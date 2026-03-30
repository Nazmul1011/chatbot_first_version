from rest_framework import serializers
from .models import Tenant, User, KnowledgeDocument, DocumentChunk

class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'subdomain']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'tenant']

class KnowledgeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = ['id', 'title', 'file', 'uploaded_at', 'is_processed']
        read_only_fields = ['is_processed']

class ChatRequestSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=1000)
