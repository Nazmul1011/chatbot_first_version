import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Tenant, User

def seed():
    print("Seeding database for MVP development...")
    
    tenant, created = Tenant.objects.get_or_create(
        name="Demo Company",
        defaults={"subdomain": "demo"}
    )
    if created:
        print(f"Created Tenant: {tenant.name}")
    else:
        print(f"Tenant '{tenant.name}' already exists.")

    user, created = User.objects.get_or_create(
        username="demo_user",
        defaults={
            "email": "demo@example.com",
            "is_staff": True,
            "is_superuser": True,
            "tenant": tenant
        }
    )
    if created:
        user.set_password("demo_pass")
        user.save()
        print(f"Created User: {user.username} (Password: demo_pass)")
    else:
        print(f"User '{user.username}' already exists.")

    print("Seeding complete!")

if __name__ == "__main__":
    seed()
