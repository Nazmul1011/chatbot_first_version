import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from rest_framework.authtoken.models import Token
t = Token.objects.get(user__username='demo_user')
with open('token.txt', 'w') as f:
    f.write(t.key)
