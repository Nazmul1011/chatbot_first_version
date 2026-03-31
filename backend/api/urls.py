from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, ChatAgentView, AnalyticsView, PublicChatView, WebsiteViewSet, TenantViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'websites', WebsiteViewSet, basename='website')
router.register(r'tenants', TenantViewSet, basename='tenant')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ChatAgentView.as_view(), name='chat'),
    path('public/chat/', PublicChatView.as_view(), name='public-chat'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
]
