from rest_framework import viewsets, status, views, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import KnowledgeDocument, DocumentChunk, Tenant, ChatQuery, WebsiteSource
from .permissions import IsTenantDataOwner, TenantQuerySetMixin
from marketing.models import MarketingAgent, CapturedLead, MarketingConversation
from marketing.serializers import CapturedLeadSerializer
import time
import re
import uuid
from django.db.models import Avg
from django.utils import timezone
from datetime import timedelta
from .rag_utils import extract_text_from_file, chunk_text, generate_embedding, get_ai_response
from .scraper_utils import scrape_website_text
from .serializers import (
    KnowledgeDocumentSerializer, ChatRequestSerializer, 
    WebsiteSourceSerializer, WebsiteScrapeRequestSerializer,
    TenantSerializer
)
from pgvector.django import CosineDistance
from openai import OpenAI

class OracleOrchestrator:
    @staticmethod
    def classify_intent(agent, question):
        if not agent: return "SUPPORT"
        client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=agent.api_key)
        prompt = f"Classify intent as 'SALES' or 'SUPPORT'. User: '{question}'"
        try:
            response = client.chat.completions.create(model="qwen/qwen3.6-plus-preview:free", messages=[{"role": "user", "content": prompt}], max_tokens=10)
            intent = response.choices[0].message.content.strip().upper()
            return "SALES" if "SALES" in intent else "SUPPORT"
        except: return "SUPPORT"

class ChatAgentView(views.APIView):
    permission_classes = [IsTenantDataOwner]

    def post(self, request):
        question = request.data.get('question')
        if not question: return Response({"error": "Missing question"}, status=status.HTTP_400_BAD_REQUEST)

        tenant = getattr(request, 'tenant', None) or request.user.tenant
        marketing_agent = MarketingAgent.objects.filter(tenant=tenant, is_active=True).first()
        session_id = request.data.get('session_id') or uuid.uuid4()
        
        print(f"\n--- [ORCHESTRATOR] New Request from {tenant.name} ---")
        intent = OracleOrchestrator.classify_intent(marketing_agent, question)
        print(f"--- [ORCHESTRATOR] Detected Intent: {intent} ---")

        # 1. Route to correct brain
        if intent == "SALES" and marketing_agent:
            print(f"--- [ORCHESTRATOR] Routing to Sales Brain ---")
            resp = self.handle_sales(request, marketing_agent, question, session_id)
        else:
            print(f"--- [ORCHESTRATOR] Routing to Support Brain ---")
            resp = self.handle_support(request, tenant, question)

        # 2. Universal Lead Hunter
        if marketing_agent and marketing_agent.lead_capture_enabled:
            answer = resp.data.get('answer', '')
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', question + " " + answer)
            if email_match:
                email = email_match.group(0)
                if not CapturedLead.objects.filter(visitor_email=email, marketing_agent=marketing_agent).exists():
                    CapturedLead.objects.create(marketing_agent=marketing_agent, tenant=tenant, visitor_email=email, interest_summary=question, session_id=session_id)
                    print(f"--- [LEAD HUNTER] Captured: {email} ---")

        return resp

    def handle_support(self, request, tenant, question):
        question_vector = generate_embedding(question)
        relevant_chunks = DocumentChunk.objects.filter(tenant=tenant).order_by(CosineDistance('embedding', question_vector))[:5]
        context = "\n---\n".join([c.content for c in relevant_chunks])
        start_time = time.time()
        answer = get_ai_response(question, context)
        ChatQuery.objects.create(tenant=tenant, question=question, answer=answer, response_time_ms=int((time.time()-start_time)*1000), is_successful=not answer.startswith("Error"))
        return Response({"answer": answer, "mode": "support"}, status=status.HTTP_200_OK)

    def handle_sales(self, request, agent, question, session_id):
        conv, _ = MarketingConversation.objects.get_or_create(session_id=session_id, marketing_agent=agent)
        history = [{'role': m['role'], 'content': m['content']} for m in conv.messages[-6:]]
        client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=agent.api_key)
        try:
            full_messages = [{"role": "system", "content": f"Sales bot for {agent.company_name}. Offer: {agent.current_offer}. Context: {agent.company_context}"}] + history + [{"role": "user", "content": question}]
            response = client.chat.completions.create(model=agent.model_name, messages=full_messages)
            reply = response.choices[0].message.content
            conv.messages.extend([{"role": "user", "content": question}, {"role": "assistant", "content": reply}])
            conv.save()
            return Response({"answer": reply, "mode": "sales", "session_id": str(session_id)}, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"--- Sales Brain Error: {str(e)} ---")
            return self.handle_support(request, agent.tenant, question)

class PublicChatView(ChatAgentView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        api_key = request.data.get('public_api_key')
        if not api_key: return Response({"error": "Missing key"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            tenant = Tenant.objects.get(public_api_key=api_key)
            request.tenant = tenant
            return super().post(request)
        except: return Response({"error": "Invalid tenant"}, status=status.HTTP_403_FORBIDDEN)

class DocumentViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    queryset = KnowledgeDocument.objects.all()
    serializer_class = KnowledgeDocumentSerializer
    permission_classes = [IsTenantDataOwner]
    parser_classes = [MultiPartParser, FormParser]
    def perform_create(self, serializer):
        active_tenant = getattr(self.request, 'tenant', None) or self.request.user.tenant
        doc = serializer.save(tenant=active_tenant)
        text = extract_text_from_file(doc.file.path)
        chunks = chunk_text(text)
        for content in chunks:
            vector = generate_embedding(content)
            DocumentChunk.objects.create(document=doc, tenant=doc.tenant, content=content, embedding=vector)
        doc.is_processed = True
        doc.save()

class WebsiteViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    queryset = WebsiteSource.objects.all()
    serializer_class = WebsiteSourceSerializer
    permission_classes = [IsTenantDataOwner]
    def perform_create(self, serializer):
        url = serializer.validated_data['url']
        active_tenant = getattr(self.request, 'tenant', None) or self.request.user.tenant
        website_source = serializer.save(tenant=active_tenant)
        text = scrape_website_text(url)
        if text:
            chunks = chunk_text(text)
            for content in chunks:
                vector = generate_embedding(content)
                DocumentChunk.objects.create(website=website_source, tenant=active_tenant, content=content, embedding=vector)
            website_source.is_processed = True
            website_source.save()
        else:
            website_source.delete()
            raise views.serializers.ValidationError({"url": "Scrape failed."})

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all().order_by('created_at')
    serializer_class = TenantSerializer
    permission_classes = [permissions.AllowAny]
    def perform_create(self, serializer):
        import re
        name = serializer.validated_data.get('name', '')
        base_slug = re.sub(r'[^a-z0-9]', '-', name.lower()).strip('-')
        serializer.save(subdomain=base_slug)

class AnalyticsView(views.APIView):
    permission_classes = [IsTenantDataOwner]

    def get(self, request):
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        queries = ChatQuery.objects.filter(tenant=tenant)
        
        total_queries = queries.count()
        avg_response = queries.aggregate(Avg('response_time_ms'))['response_time_ms__avg'] or 0
        
        # Calculate weekly data (last 7 days)
        weekly_data = []
        today = timezone.now().date()
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            day_name = date.strftime('%a')
            count = queries.filter(created_at__date=date).count()
            weekly_data.append({"day": day_name, "queries": count})

        return Response({
            "total_queries": total_queries,
            "avg_response_time": round(avg_response / 1000, 2),
            "success_rate": 100,
            "weekly_data": weekly_data
        }, status=status.HTTP_200_OK)
