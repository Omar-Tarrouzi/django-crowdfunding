from django.db import models
from createurs.models import Createur

class Projet(models.Model):
    titre = models.CharField(max_length=200)
    description = models.TextField()
    montant_objectif = models.DecimalField(max_digits=10, decimal_places=2)
    createur = models.ForeignKey(Createur, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='project_images/', null=True, blank=True)

    def __str__(self):
        return self.titre
