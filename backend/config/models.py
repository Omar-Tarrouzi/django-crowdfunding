from django.db import models
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.utils import timezone

class Donneur(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nom = models.CharField(max_length=100)
    email = models.EmailField()
    montant_donne = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.nom

class Createur(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nom = models.CharField(max_length=100)
    email = models.EmailField()
    bio = models.TextField()

    def __str__(self):
        return self.nom
    
class Projet(models.Model):
    STATUT_CHOICES = (
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
    )
    
    titre = models.CharField(max_length=200)
    description = models.TextField()
    montant_objectif = models.DecimalField(max_digits=10, decimal_places=2)
    montant_recolte = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Track the total money raised
    date_creation = models.DateTimeField(auto_now_add=True)  # This will automatically set the creation date
    image = models.ImageField(upload_to='projets/', blank=True, null=True)  
    createur = models.ForeignKey(Createur, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_cours')
    date_fin = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'config_projet'  # Spécifier explicitement le nom de la table

    def __str__(self):
        return self.titre

    # This method will calculate how much more is needed to reach the goal
    def montant_restant(self):
        return self.montant_objectif - self.montant_recolte

    # This method will calculate the percentage of goal achieved
    def avancement(self):
        if self.montant_objectif == 0:
            return 0
            return (self.montant_recolte / self.montant_objectif) * 100

    def get_current_palier(self):
        """Returns the highest achieved palier for this project"""
        achieved_paliers = self.paliers.filter(montant__lte=self.montant_recolte).order_by('-montant')
        return achieved_paliers.first() if achieved_paliers.exists() else None

class Paliers(models.Model):
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='paliers')
    titre = models.CharField(max_length=200)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    couleur = models.CharField(max_length=7, default='#000000')  # pour les couleurs des paliers
    ordre = models.IntegerField()

    class Meta:
        ordering = ['ordre']
        verbose_name_plural = "Paliers"

    def __str__(self):
        return f"{self.titre} - {self.montant} DH"

class Donation(models.Model):
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_don = models.DateTimeField(default=timezone.now)
    donneur = models.ForeignKey(Donneur, on_delete=models.CASCADE)
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE)
    message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Don de {self.montant} DH par {self.donneur.nom}"

    # 
    def save(self, *args, **kwargs):
        
        self.projet.montant_recolte += self.montant
        self.projet.save()
        super().save(*args, **kwargs)

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('createur', 'Createur'),
        ('donneur', 'Donneur'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='donneur')

    def __str__(self):
        return f"{self.user.username}'s profile"

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Projet, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'project')

    def __str__(self):
        return f"{self.user.username}'s favorite: {self.project.titre}"

class Don(models.Model):
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    date_don = models.DateTimeField(auto_now_add=True)
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='dons')
    donneur = models.ForeignKey(Donneur, on_delete=models.CASCADE, related_name='dons')
    message = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Don"
        verbose_name_plural = "Dons"
        ordering = ['-date_don']

    def __str__(self):
        return f"Don de {self.montant} DH par {self.donneur.nom} pour {self.projet.titre}"

    def save(self, *args, **kwargs):
        # Update project's montant_recolte when saving a new donation
        if not self.pk:  # Only on creation
            self.projet.montant_recolte += self.montant
            self.projet.save()
        super().save(*args, **kwargs)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Vérifier si l'utilisateur est un créateur
        try:
            createur = Createur.objects.get(user=instance)
            role = 'createur'
        except Createur.DoesNotExist:
            # Vérifier si l'utilisateur est un donneur
            try:
                donneur = Donneur.objects.get(user=instance)
                role = 'donneur'
            except Donneur.DoesNotExist:
                # Par défaut, c'est un donneur
                role = 'donneur'
        
        UserProfile.objects.create(user=instance, role=role)