from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, ChatAgentView, AnalyticsView, PublicChatView

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ChatAgentView.as_view(), name='chat'),
    path('public/chat/', PublicChatView.as_view(), name='public-chat'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
]
