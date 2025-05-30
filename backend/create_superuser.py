import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crowdfunding.settings')
django.setup()

from django.contrib.auth.models import User

# Create superuser if it doesn't exist
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin123'
    )
    print('Superuser created successfully!')
else:
    print('Superuser already exists!') 