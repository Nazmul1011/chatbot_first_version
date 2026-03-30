from rest_framework import permissions

class IsTenantDataOwner(permissions.BasePermission):
    """
    Custom permission to ensure that a user can only access data 
    that belongs to their own Tenant.
    """

    def has_permission(self, request, view):
        # STEP 1: Check if the user is authenticated.
        # If not logged in, they shouldn't even reach the data checks.
        if not request.user.is_authenticated:
            return False
            
        # STEP 2: Check if the user is associated with a Tenant.
        # In our multi-tenant system, every user MUST belong to a company/tenant.
        if not request.user.tenant:
            return False
            
        return True

    def has_object_permission(self, request, view, obj):
        """
        This method is called for detail views (e.g., GET /documents/5/).
        It checks if the specific object (document, chunk, etc.) 
        belongs to the same tenant as the requesting user.
        """
        
        # STEP 1: Identify the tenant of the user.
        user_tenant = request.user.tenant
        
        # STEP 2: Identify the tenant of the object.
        # Most of our models have a direct 'tenant' field.
        # If it's a model like DocumentChunk, it has a direct 'tenant' field for efficiency.
        # If it's a model that doesn't have a direct 'tenant' field, we would 
        # traverse the relationship (e.g., obj.document.tenant).
        obj_tenant = getattr(obj, 'tenant', None)
        
        # Fallback: if 'tenant' is not directly on the object, try to find it via relations.
        if not obj_tenant and hasattr(obj, 'document'):
            obj_tenant = obj.document.tenant

        # STEP 3: Compare the IDs.
        # This is the "Absolute Data Isolation" check. 
        # If the IDs don't match, we return False, and DRF will raise a 403 Forbidden.
        is_owner = (user_tenant == obj_tenant)
        
        return is_owner

class TenantQuerySetMixin:
    """
    A Mixin to be used in ViewSets to automatically filter all querysets
    by the requesting user's tenant. 
    This is an EXTRA layer of security on top of permissions.
    """
    def get_queryset(self):
        # We start with the base queryset defined in the ViewSet.
        queryset = super().get_queryset()
        
        # We strictly filter it to only include rows that match the user's tenant ID.
        # This ensures that even if a user tries to guess a Document ID, 
        # the database query won't even find it if it belongs to someone else.
        return queryset.filter(tenant=self.request.user.tenant)
