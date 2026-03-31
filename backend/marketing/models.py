from django.db import models
from api.models import Tenant
import uuid

class MarketingAgent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='marketing_agents')
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    
    # AI Config
    api_key = models.CharField(max_length=500)
    model_name = models.CharField(max_length=100, default='qwen/qwen3.6-plus-preview:free')
    system_prompt = models.TextField(blank=True, null=True)
    
    # Marketing Context
    company_name = models.CharField(max_length=255)
    company_context = models.TextField()
    current_offer = models.TextField()
    lead_capture_enabled = models.BooleanField(default=True)
    
    # Token for Public Embed
    public_api_key = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.company_name})"

class CapturedLead(models.Model):
    marketing_agent = models.ForeignKey(MarketingAgent, on_delete=models.CASCADE, related_name='leads')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    visitor_name = models.CharField(max_length=255, blank=True, null=True)
    visitor_email = models.EmailField()
    interest_summary = models.TextField(blank=True, null=True)
    session_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.visitor_email} - {self.marketing_agent.name}"

class MarketingConversation(models.Model):
    session_id = models.UUIDField(unique=True)
    marketing_agent = models.ForeignKey(MarketingAgent, on_delete=models.CASCADE)
    messages = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat sess: {self.session_id}"
