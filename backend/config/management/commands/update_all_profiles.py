from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from config.models import Createur, Donneur, UserProfile

class Command(BaseCommand):
    help = 'Updates UserProfile roles for all users'

    def handle(self, *args, **options):
        # Get all users
        users = User.objects.all()
        
        for user in users:
            # Déterminer le rôle
            try:
                # Vérifier si c'est un créateur
                createur = Createur.objects.get(user=user)
                role = 'createur'
            except Createur.DoesNotExist:
                try:
                    # Vérifier si c'est un donneur
                    donneur = Donneur.objects.get(user=user)
                    role = 'donneur'
                except Donneur.DoesNotExist:
                    # Par défaut, c'est un donneur
                    role = 'donneur'
            
            # Mettre à jour ou créer le profil
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': role}
            )
            
            if not created and profile.role != role:
                profile.role = role
                profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated profile for user: {user.username} with role: {role}')
            ) 