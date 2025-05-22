from django import forms
from config.models import Projet
from django.contrib.auth.models import User
from config.models import UserProfile,Createur

class ProjetForm(forms.ModelForm):
    class Meta:
        model = Projet
        fields = ['titre', 'description', 'montant_objectif', 'image']
        
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super(ProjetForm, self).__init__(*args, **kwargs)
        
        # If user is not admin, remove the createur field
        if not (self.user and self.user.is_superuser):
            if 'createur' in self.fields:
                del self.fields['createur']
        else:
            # For admin, show all creators
            self.fields['createur'].queryset = Createur.objects.all()


class DonationForm(forms.Form):
    amount = forms.DecimalField(
        label="Montant (€)",
        min_value=0.5,
        decimal_places=2,
        max_digits=10,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Montant'})
    )
    card_number = forms.CharField(
        label="Numéro de carte",
        min_length=13,
        max_length=19,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '1234 5678 9012 3456'})
    )
    expiration = forms.CharField(
        label="Expiration (MM/AA)",
        max_length=5,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'MM/AA'})
    )
    cvv = forms.CharField(
        label="CVV",
        max_length=4,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': '123'})
    )

class SignUpForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    role     = forms.ChoiceField(choices=UserProfile.ROLE_CHOICES)
    class Meta:
        model  = User
        fields = ['username','email','password']
