from rest_framework import viewsets, status, views, permissions
from rest_framework.response import Response
from .models import MarketingAgent, CapturedLead, MarketingConversation
from .serializers import MarketingAgentSerializer, CapturedLeadSerializer, MarketingChatRequestSerializer
from api.permissions import IsTenantDataOwner, TenantQuerySetMixin
from django.db.models import Count
from openai import OpenAI
import re
import uuid

class MarketingAgentViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    queryset = MarketingAgent.objects.all()
    serializer_class = MarketingAgentSerializer
    permission_classes = [IsTenantDataOwner]

    def get_queryset(self):
        return super().get_queryset().annotate(lead_count=Count('leads'))

    def perform_create(self, serializer):
        # Improved robustness for identify tenant
        active_tenant = getattr(self.request, 'tenant', None)
        if not active_tenant:
            active_tenant = getattr(self.request.user, 'tenant', None)
            
        if not active_tenant:
            # Final fallback to first available for demo/mvp safety
            from api.models import Tenant
            active_tenant = Tenant.objects.first()

        serializer.save(tenant=active_tenant)

class MarketingChatView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        api_key_header = request.headers.get('X-Public-API-Key')
        serializer = MarketingChatRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if not api_key_header:
            return Response({"error": "Missing X-Public-API-Key"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            agent = MarketingAgent.objects.get(public_api_key=api_key_header, is_active=True)
        except (MarketingAgent.DoesNotExist, ValueError):
            return Response({"error": "Offline or invalid agent"}, status=status.HTTP_401_UNAUTHORIZED)
        
        question = serializer.validated_data['question']
        session_id = serializer.validated_data.get('session_id') or uuid.uuid4()
        conv, _ = MarketingConversation.objects.get_or_create(session_id=session_id, marketing_agent=agent)
        history = [{'role': m['role'], 'content': m['content']} for m in conv.messages[-6:]]
        
        system_prompt = f"""You are a warm, confident sales assistant for {agent.company_name}.
Your goal is to understand what the visitor needs and guide them toward taking action.
Ask ONE question at a time. Keep replies under 80 words. Be helpful, not pushy.
If you detect the visitor's email in the conversation, confirm it naturally.
Company context: {agent.company_context}
Current offer: {agent.current_offer}"""

        # Call OpenRouter with extra headers for compliance
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=agent.api_key,
            default_headers={
                "HTTP-Referer": "http://localhost:3000", # Required by some models
                "X-Title": "ChatAgent AI Platform",      # Required by some models
            }
        )
        try:
            full_messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": question}]
            response = client.chat.completions.create(model=agent.model_name, messages=full_messages)
            reply = response.choices[0].message.content
        except Exception as e:
            print(f"--- OPENROUTER ERROR: {str(e)} ---")
            return Response({"error": f"AI Link Failed: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        conv.messages.append({"role": "user", "content": question})
        conv.messages.append({"role": "assistant", "content": reply})
        conv.save()
        
        lead_captured = False
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', question + " " + reply)
        if email_match and agent.lead_capture_enabled:
            email = email_match.group(0)
            if not CapturedLead.objects.filter(visitor_email=email, marketing_agent=agent).exists():
                CapturedLead.objects.create(marketing_agent=agent, tenant=agent.tenant, visitor_email=email, interest_summary=question, session_id=session_id)
                lead_captured = True
        
        return Response({"reply": reply, "session_id": str(session_id), "lead_captured": lead_captured})

class MarketingLeadView(views.APIView):
    permission_classes = [IsTenantDataOwner]
    def get(self, request, agent_id):
        active_tenant = getattr(request, 'tenant', None) or request.user.tenant
        try:
            agent = MarketingAgent.objects.get(id=agent_id, tenant=active_tenant)
        except MarketingAgent.DoesNotExist:
            return Response({"error": "Agent not found"}, status=status.HTTP_404_NOT_FOUND)
            
        leads = CapturedLead.objects.filter(marketing_agent=agent).order_by('-created_at')
        serializer = CapturedLeadSerializer(leads, many=True)
        return Response(serializer.data)
