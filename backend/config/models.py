from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver

class Donneur(models.Model):
    nom = models.CharField(max_length=100)
    email = models.EmailField()
    montant_donne = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.nom

class Createur(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    nom = models.CharField(max_length=100)
    email = models.EmailField()
    bio = models.TextField()

    def __str__(self):
        return self.nom
    
class Projet(models.Model):
    titre = models.CharField(max_length=200)
    description = models.TextField()
    montant_objectif = models.DecimalField(max_digits=10, decimal_places=2)
    montant_recolte = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Track the total money raised
    image = models.ImageField(upload_to='projets/', blank=True, null=True)  
    createur = models.ForeignKey(Createur, on_delete=models.CASCADE)

    class Meta:
        db_table = 'config_projet'  # Spécifier explicitement le nom de la table

    def __str__(self):
        return self.titre

    # This method will calculate how much more is needed to reach the goal
    def montant_restant(self):
        return self.montant_objectif - self.montant_recolte

    # This method will calculate the percentage of goal achieved
    def avancement(self):
        if self.montant_objectif > 0:
            return (self.montant_recolte / self.montant_objectif) * 100
        return 0

class Donation(models.Model):
    donneur = models.ForeignKey(Donneur, on_delete=models.CASCADE)
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_don = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.donneur.nom} - {self.projet.titre} - {self.montant}€"

    # Update the project amount raised when a donation is made
    def save(self, *args, **kwargs):
        # Before saving donation, update the project's amount raised
        self.projet.montant_recolte += self.montant
        self.projet.save()
        super().save(*args, **kwargs)

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('donor','Donor'),
        ('creator','Creator'),
        ('admin','Admin'),
    ]
    user      = models.OneToOneField(User, on_delete=models.CASCADE)
    role      = models.CharField(max_length=10, choices=ROLE_CHOICES)
    # any extra fields...

    def __str__(self):
        return f"{self.user.username} ({self.role})"
    


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Projet, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.user.username} - {self.project.title}'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)