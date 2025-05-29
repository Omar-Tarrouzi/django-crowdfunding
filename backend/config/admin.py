from django.contrib import admin
from .models import Donneur, Createur, Projet, UserProfile, Paliers, Donation, Favorite, Don

@admin.register(Donneur)
class DonneurAdmin(admin.ModelAdmin):
    list_display = ('nom', 'email', 'montant_donne')
    search_fields = ('nom', 'email')

@admin.register(Createur)
class CreateurAdmin(admin.ModelAdmin):
    list_display = ('nom', 'email')
    search_fields = ('nom', 'email')

@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ('titre', 'createur', 'montant_objectif', 'montant_recolte', 'statut', 'date_creation', 'date_fin')
    list_filter = ('statut', 'date_creation')
    search_fields = ('titre', 'description', 'createur__nom')
    readonly_fields = ('montant_recolte',)

@admin.register(Paliers)
class PaliersAdmin(admin.ModelAdmin):
    list_display = ('titre', 'projet', 'montant', 'ordre', 'couleur')
    list_filter = ('projet',)
    search_fields = ('titre', 'description', 'projet__titre')
    ordering = ('projet', 'ordre')

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('montant', 'donneur', 'projet', 'date_don')
    list_filter = ('date_don', 'projet')
    search_fields = ('donneur__nom', 'projet__titre')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'project')
    list_filter = ('project',)
    search_fields = ('user__username', 'project__titre')

@admin.register(Don)
class DonAdmin(admin.ModelAdmin):
    list_display = ('montant', 'projet', 'donneur', 'date_don')
    list_filter = ('date_don', 'projet')
    search_fields = ('donneur__nom', 'projet__titre')  
