from rest_framework import viewsets, status, views, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import KnowledgeDocument, DocumentChunk, Tenant, ChatQuery
from .serializers import KnowledgeDocumentSerializer, ChatRequestSerializer
from .permissions import IsTenantDataOwner, TenantQuerySetMixin
import time
from django.db.models import Avg
from django.utils import timezone
from datetime import timedelta
from .rag_utils import extract_text_from_file, chunk_text, generate_embedding, get_ai_response
from pgvector.django import CosineDistance

class DocumentViewSet(TenantQuerySetMixin, viewsets.ModelViewSet):
    """
    Handles listing, retrieving, and uploading documents.
    Automatically filters by the user's tenant.
    """
    queryset = KnowledgeDocument.objects.all()
    serializer_class = KnowledgeDocumentSerializer
    permission_classes = [IsTenantDataOwner]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        # Assign the document to the current user's tenant
        doc = serializer.save(tenant=self.request.user.tenant)
        
        # Trigger RAG processing (In a real app, this should be a Celery task)
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

class ChatAgentView(views.APIView):
    """
    Endpoint for querying the AI agent.
    Retrieves relevant chunks from the database using vector search.
    """
    permission_classes = [IsTenantDataOwner]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.validated_data['question']
            tenant = request.user.tenant
            
            # 1. Generate embedding for the question
            question_vector = generate_embedding(question)
            
            # 2. Retrieve top 5 most relevant chunks from THIS tenant's data
            # Using CosineDistance from pgvector
            relevant_chunks = DocumentChunk.objects.filter(tenant=tenant).order_by(
                CosineDistance('embedding', question_vector)
            )[:5]
            
            # 3. Combine chunks into context
            context = "\n---\n".join([c.content for c in relevant_chunks])
            
            # 4. Get AI response
            start_time = time.time()
            answer = get_ai_response(question, context)
            response_time_ms = int((time.time() - start_time) * 1000)
            
            ChatQuery.objects.create(
                tenant=tenant,
                question=question,
                answer=answer,
                response_time_ms=response_time_ms,
                is_successful=not answer.startswith("Error")
            )
            
            return Response({"answer": answer}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PublicChatView(views.APIView):
    """
    Publicly accessible endpoint for embedded widgets.
    Identifies the tenant via public_api_key instead of auth tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        api_key = request.data.get('public_api_key')
        question = request.data.get('question')
        
        if not api_key:
            return Response({"error": "Missing public_api_key"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tenant = Tenant.objects.get(public_api_key=api_key)
        except (Tenant.DoesNotExist, ValueError):
            return Response({"error": "Invalid public_api_key"}, status=status.HTTP_403_FORBIDDEN)

        if not question:
            return Response({"error": "Missing question"}, status=status.HTTP_400_BAD_REQUEST)

        # Vector Search logic (same as internal chat but using the found tenant)
        question_vector = generate_embedding(question)
        relevant_chunks = DocumentChunk.objects.filter(tenant=tenant).order_by(
            CosineDistance('embedding', question_vector)
        )[:5]
        
        context = "\n---\n".join([c.content for c in relevant_chunks])
        
        start_time = time.time()
        answer = get_ai_response(question, context)
        response_time_ms = int((time.time() - start_time) * 1000)
        
        ChatQuery.objects.create(
            tenant=tenant,
            question=question,
            answer=answer,
            response_time_ms=response_time_ms,
            is_successful=not answer.startswith("Error")
        )
        
        return Response({"answer": answer}, status=status.HTTP_200_OK)

class AnalyticsView(views.APIView):
    """
    Endpoint for fetching real-time dashboard analytics.
    """
    permission_classes = [IsTenantDataOwner]

    def get(self, request):
        tenant = request.user.tenant
        queries = ChatQuery.objects.filter(tenant=tenant)
        
        total_queries = queries.count()
        avg_response = queries.aggregate(Avg('response_time_ms'))['response_time_ms__avg'] or 0
        success_count = queries.filter(is_successful=True).count()
        success_rate = (success_count / total_queries * 100) if total_queries > 0 else 100
        
        # Last 7 days chart data
        weekly_data = []
        today = timezone.now().date()
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_queries = queries.filter(created_at__date=day).count()
            weekly_data.append({
                "day": day.strftime("%a"),
                "queries": day_queries
            })
            
        return Response({
            "total_queries": total_queries,
            "avg_response_time": round(avg_response / 1000, 2), # seconds
            "success_rate": round(success_rate, 1),
            "weekly_data": weekly_data
        }, status=status.HTTP_200_OK)
