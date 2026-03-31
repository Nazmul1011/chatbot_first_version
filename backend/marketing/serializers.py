from rest_framework import serializers
from .models import MarketingAgent, CapturedLead, MarketingConversation

class MarketingAgentSerializer(serializers.ModelSerializer):
    lead_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = MarketingAgent
        fields = [
            'id', 'name', 'is_active', 'api_key', 'model_name', 
            'company_name', 'company_context', 'current_offer', 
            'lead_capture_enabled', 'public_api_key', 'created_at', 'lead_count'
        ]
        read_only_fields = ['id', 'public_api_key', 'created_at', 'lead_count']

class CapturedLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CapturedLead
        fields = '__all__'

class MarketingChatRequestSerializer(serializers.Serializer):
    question = serializers.CharField()
    session_id = serializers.UUIDField(required=False, allow_null=True)
