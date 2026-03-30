from django.db import models
from django.contrib.auth.models import AbstractUser
from pgvector.django import VectorField
import uuid

class Tenant(models.Model):
    """
    Represents a client company (SaaS customer).
    All data in the system must be linked back to a Tenant.
    """
    name = models.CharField(max_length=255)
    subdomain = models.CharField(max_length=255, unique=True, null=True, blank=True)
    public_api_key = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    """
    Custom user model linked to a Tenant.
    A user can only access data belonging to their tenant.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    
    def __str__(self):
        return f"{self.username} ({self.tenant.name if self.tenant else 'No Tenant'})"

class KnowledgeDocument(models.Model):
    """
    Represents an uploaded file from a client.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='knowledge_base/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_processed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.tenant.name}"

class DocumentChunk(models.Model):
    """
    Stores individual text chunks and their corresponding vector embeddings.
    Used for RAG retrieval.
    """
    document = models.ForeignKey(KnowledgeDocument, on_delete=models.CASCADE, related_name='chunks')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='chunks')
    content = models.TextField()
    # Using 384 dimensions for all-MiniLM-L6-v2 embeddings
    embedding = VectorField(dimensions=384) 
    
    def __str__(self):
        return f"Chunk from {self.document.title} ({self.tenant.name})"

class ChatQuery(models.Model):
    """
    Tracks customer questions and AI responses for analytics.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='queries')
    question = models.TextField()
    answer = models.TextField()
    response_time_ms = models.IntegerField(help_text="Response time in milliseconds")
    is_successful = models.BooleanField(default=True, help_text="False if the AI declined to answer")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Query: {self.question[:50]}... ({self.tenant.name})"
