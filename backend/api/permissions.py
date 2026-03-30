from rest_framework import permissions

class IsTenantDataOwner(permissions.BasePermission):
    """
    Custom permission to ensure that a user can only access data 
    that belongs to their own Tenant.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Use request.tenant set by middleware (supports Agent Switcher)
        active_tenant = getattr(request, 'tenant', None) or getattr(request.user, 'tenant', None)
        if not active_tenant:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        """
        This method is called for detail views (e.g., GET /documents/5/).
        It checks if the specific object (document, chunk, etc.) 
        belongs to the same tenant as the requesting user.
        """
        
        # Use request.tenant (middleware-overridden) for correctness during agent switching
        user_tenant = getattr(request, 'tenant', None) or getattr(request.user, 'tenant', None)
        obj_tenant = getattr(obj, 'tenant', None)
        if not obj_tenant and hasattr(obj, 'document'):
            obj_tenant = obj.document.tenant
        return user_tenant == obj_tenant

class TenantQuerySetMixin:
    """
    A Mixin to be used in ViewSets to automatically filter all querysets
    by the requesting user's tenant. 
    This is an EXTRA layer of security on top of permissions.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        # Use request.tenant (set by middleware) so Agent Switcher works correctly.
        # Falls back to user's own tenant if no override is set.
        active_tenant = getattr(self.request, 'tenant', None) or getattr(self.request.user, 'tenant', None)
        return queryset.filter(tenant=active_tenant)
