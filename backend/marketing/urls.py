from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MarketingAgentViewSet, MarketingChatView, MarketingLeadView

router = DefaultRouter()
router.register(r'agents', MarketingAgentViewSet, basename='marketing-agent')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', MarketingChatView.as_view(), name='marketing-chat'),
    path('<uuid:agent_id>/leads/', MarketingLeadView.as_view(), name='marketing-leads'),
]
