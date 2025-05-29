import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User

username = 'omar'
password = 'jaioublier'

try:
    user = User.objects.get(username=username)
    print("User found:", user.username)
    if user.check_password(password):
        print("Password is correct!")
    else:
        print("Password is INCORRECT.")
except User.DoesNotExist:
    print("User does not exist.") 