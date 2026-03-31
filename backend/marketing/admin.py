from django.contrib import admin
from .models import MarketingAgent, CapturedLead, MarketingConversation

@admin.register(MarketingAgent)
class MarketingAgentAdmin(admin.ModelAdmin):
    list_display = ('name', 'company_name', 'model_name', 'is_active', 'created_at', 'tenant')
    list_filter = ('tenant', 'is_active', 'model_name')
    search_fields = ('name', 'company_name', 'public_api_key')

@admin.register(CapturedLead)
class CapturedLeadAdmin(admin.ModelAdmin):
    list_display = ('visitor_email', 'marketing_agent', 'visitor_name', 'created_at')
    list_filter = ('marketing_agent', 'created_at')
    search_fields = ('visitor_email', 'visitor_name', 'interest_summary')

@admin.register(MarketingConversation)
class MarketingConversationAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'marketing_agent', 'updated_at')
