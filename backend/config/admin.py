from django.contrib import admin
from .models import Donneur, Createur, Projet

@admin.register(Donneur)
class DonneurAdmin(admin.ModelAdmin):
    list_display = ('nom', 'email', 'montant_donne')

@admin.register(Createur)
class CreateurAdmin(admin.ModelAdmin):
    list_display = ('nom', 'email')

@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ('titre', 'createur', 'montant_objectif')
    fields = ('titre', 'description', 'montant_objectif', 'createur', 'image')  
