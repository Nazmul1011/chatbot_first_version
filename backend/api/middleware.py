from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Tenant

User = get_user_model()

class DevAuthMiddleware:
    """
    Middleware that automatically logs in a default 'demo_user' 
    if DEBUG is True and no user is authenticated.
    Ensures a smooth 'Zero Config' MVP experience.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if settings.DEBUG and not request.user.is_authenticated:
            # Look for or create a demo user/tenant
            tenant, _ = Tenant.objects.get_or_create(name="Demo Company")
            user, created = User.objects.get_or_create(
                username="demo_user",
                defaults={"is_staff": True, "is_superuser": True, "tenant": tenant}
            )
            if created:
                user.set_password("demo_pass")
                user.save()
            
            # Manually assign the user to the request
            request.user = user
            
        response = self.get_response(request)
        return response
