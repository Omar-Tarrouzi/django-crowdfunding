from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from config.models import Createur, UserProfile

class Command(BaseCommand):
    help = 'Updates UserProfile roles for creators'

    def handle(self, *args, **options):
        # Get all creators
        creators = Createur.objects.all()
        
        for creator in creators:
            # Get or create UserProfile
            profile, created = UserProfile.objects.get_or_create(
                user=creator.user,
                defaults={'role': 'createur'}
            )
            
            if not created:
                # Update existing profile
                profile.role = 'createur'
                profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated profile for creator: {creator.user.username}')
            ) 