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
        if settings.DEBUG and (not hasattr(request, 'user') or not request.user.is_authenticated):
            tenant, _ = Tenant.objects.get_or_create(name="Demo Company", defaults={"subdomain": "demo"})
            user, created = User.objects.get_or_create(
                username="demo_user",
                defaults={"is_staff": True, "is_superuser": True, "tenant": tenant}
            )
            if created:
                user.set_password("demo_pass")
                user.save()
            request.user = user

        # Set default tenant
        request.tenant = getattr(request.user, 'tenant', None) if request.user.is_authenticated else None

        # Override if Switcher is used
        tenant_id = request.headers.get('X-Tenant-ID')
        if tenant_id and request.user.is_authenticated:
            try:
                # Force switch for staff only
                if request.user.is_staff:
                    request.tenant = Tenant.objects.get(id=tenant_id)
                    # Sync back to user object for serializers/logic
                    request.user.tenant = request.tenant
            except (Tenant.DoesNotExist, ValueError):
                pass
            
        return self.get_response(request)
