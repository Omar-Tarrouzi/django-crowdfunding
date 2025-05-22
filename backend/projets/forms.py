from django import forms
from .models import Projet

class ProjetForm(forms.ModelForm):
    class Meta:
        model = Projet
        fields = ['titre', 'description', 'montant_objectif', 'image']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4}),
            'montant_objectif': forms.NumberInput(attrs={'min': 0}),
        }
