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

class DocumentViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    queryset = KnowledgeDocument.objects.all()
    serializer_class = KnowledgeDocumentSerializer
    permission_classes = [IsTenantDataOwner]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        active_tenant = getattr(self.request, 'tenant', None) or self.request.user.tenant
        doc = serializer.save(tenant=active_tenant)
        self.process_document(doc)

    def process_document(self, doc):
        text = extract_text_from_file(doc.file.path)
        chunks = chunk_text(text)
        for content in chunks:
            vector = generate_embedding(content)
            DocumentChunk.objects.create(
                document=doc,
                tenant=doc.tenant,
                content=content,
                embedding=vector
            )
        doc.is_processed = True
        doc.save()

class OracleOrchestrator:
    @staticmethod
    def classify_intent(agent, question):
        if not agent: return "SUPPORT"
        
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=agent.api_key
        )
        prompt = f"""Classify the user intent into exactly one word: 'SALES' or 'SUPPORT'.
'SALES' = Asking about deals, pricing, buying something, interested in offers.
'SUPPORT' = General questions, complaints, tech help.

User: "{question}"
Intent:"""
        try:
            response = client.chat.completions.create(
                model="qwen/qwen3.6-plus-preview:free",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10
            )
            intent = response.choices[0].message.content.strip().upper()
            return "SALES" if "SALES" in intent else "SUPPORT"
        except:
            return "SUPPORT"

class ChatAgentView(views.APIView):
    permission_classes = [IsTenantDataOwner]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        question = serializer.validated_data['question']
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        marketing_agent = MarketingAgent.objects.filter(tenant=tenant, is_active=True).first()
        
        print(f"\n--- [ORCHESTRATOR] New Request from {tenant.name} ---")
        print(f"--- [ORCHESTRATOR] Question: '{question[:50]}...' ---")

        intent = OracleOrchestrator.classify_intent(marketing_agent, question)
        print(f"--- [ORCHESTRATOR] Detected Intent: {intent} ---")
        
        if intent == "SALES" and marketing_agent:
            print(f"--- [ORCHESTRATOR] Routing to Sales Brain: {marketing_agent.name} ---")
            return self.handle_sales(request, marketing_agent, question)
        
        print(f"--- [ORCHESTRATOR] Routing to Support Brain (RAG Knowledge Base) ---")
        return self.handle_support(request, tenant, question)

    def handle_support(self, request, tenant, question):
        question_vector = generate_embedding(question)
        relevant_chunks = DocumentChunk.objects.filter(tenant=tenant).order_by(
            CosineDistance('embedding', question_vector)
        )[:5]
        context = "\n---\n".join([c.content for c in relevant_chunks])
        start_time = time.time()
        answer = get_ai_response(question, context)
        response_time_ms = int((time.time() - start_time) * 1000)
        ChatQuery.objects.create(tenant=tenant, question=question, answer=answer, response_time_ms=response_time_ms, is_successful=not answer.startswith("Error"))
        return Response({"answer": answer, "mode": "support"}, status=status.HTTP_200_OK)

    def handle_sales(self, request, agent, question):
        session_id = request.data.get('session_id') or uuid.uuid4()
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
        except:
            return self.handle_support(request, agent.tenant, question)

class PublicChatView(ChatAgentView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        api_key = request.data.get('public_api_key')
        question = request.data.get('question')
        if not api_key: return Response({"error": "Missing key"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            tenant = Tenant.objects.get(public_api_key=api_key)
            return super().post(request)
        except:
            return Response({"error": "Invalid tenant"}, status=status.HTTP_403_FORBIDDEN)

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
        success_count = queries.filter(is_successful=True).count()
        return Response({"total_queries": total_queries, "avg_response_time": round(avg_response/1000, 2), "success_rate": round(success_count/total_queries*100, 1) if total_queries > 0 else 100}, status=status.HTTP_200_OK)
