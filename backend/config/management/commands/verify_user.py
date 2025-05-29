from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from config.models import Createur, Donneur, UserProfile

class Command(BaseCommand):
    help = 'Verify and fix a user\'s setup'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to verify')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            # Check if user exists
            user = User.objects.get(username=username)
            self.stdout.write(f"\n=== User Details ===")
            self.stdout.write(f"Username: {user.username}")
            self.stdout.write(f"Email: {user.email}")
            self.stdout.write(f"Is active: {user.is_active}")
            self.stdout.write(f"Is staff: {user.is_staff}")
            self.stdout.write(f"Is superuser: {user.is_superuser}")
            self.stdout.write(f"Groups: {[g.name for g in user.groups.all()]}")
            
            # Check UserProfile
            try:
                profile = UserProfile.objects.get(user=user)
                self.stdout.write(f"\nUserProfile found with role: {profile.role}")
            except UserProfile.DoesNotExist:
                self.stdout.write("\nNo UserProfile found")
                # Create UserProfile
                profile = UserProfile.objects.create(user=user, role='createur')
                self.stdout.write("Created UserProfile with role 'createur'")
            
            # Check Createur profile
            try:
                createur = Createur.objects.get(user=user)
                self.stdout.write(f"\nCreateur profile found: {createur.nom}")
            except Createur.DoesNotExist:
                self.stdout.write("\nNo Createur profile found")
                # Create Createur profile
                createur = Createur.objects.create(
                    user=user,
                    nom=user.username,
                    email=user.email
                )
                self.stdout.write("Created Createur profile")
            
            # Check Donneur profile
            try:
                donneur = Donneur.objects.get(user=user)
                self.stdout.write(f"\nDonneur profile found: {donneur.nom}")
            except Donneur.DoesNotExist:
                self.stdout.write("\nNo Donneur profile found")
            
            # Check and add to Createurs group
            createurs_group, _ = Group.objects.get_or_create(name='Createurs')
            if createurs_group not in user.groups.all():
                user.groups.add(createurs_group)
                self.stdout.write("\nAdded user to Createurs group")
            
            self.stdout.write(self.style.SUCCESS(f"\nUser {username} has been verified and fixed"))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User {username} does not exist")) 