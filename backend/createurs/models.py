from django.db import models
from django.contrib.auth.models import User

class Createur(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='createur_profile')
    nom = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    bio = models.TextField()

    def __str__(self):
        return self.nom
