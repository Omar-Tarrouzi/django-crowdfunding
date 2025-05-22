from django.db import models
from config.models import Projet

# Create your models here.
class Donneur(models.Model):
    nom = models.CharField(max_length=100)
    email = models.EmailField()
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE)
    montant = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.nom} - {self.projet.titre}"
