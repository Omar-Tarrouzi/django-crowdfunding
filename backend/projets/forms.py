from django import forms
from config.models import Projet, Don
from decimal import Decimal
import re

class ProjetForm(forms.ModelForm):
    class Meta:
        model = Projet
        fields = ['titre', 'description', 'montant_objectif', 'date_fin', 'image']
        widgets = {
            'titre': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'montant_objectif': forms.NumberInput(attrs={'class': 'form-control', 'min': '0', 'step': '0.01'}),
            'date_fin': forms.DateTimeInput(attrs={'class': 'form-control', 'type': 'datetime-local'}),
            'image': forms.FileInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make date_fin optional
        self.fields['date_fin'].required = False
        self.fields['image'].required = False

    def clean(self):
        cleaned_data = super().clean()
        # Add any additional validation here if needed
        return cleaned_data

class DonationForm(forms.ModelForm):
    # Credit Card Fields
    card_number = forms.CharField(
        max_length=19,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '1234 5678 9012 3456',
            'pattern': '[0-9\s]{13,19}',
            'maxlength': '19'
        })
    )
    expiry_date = forms.CharField(
        max_length=5,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'MM/YY',
            'pattern': '(0[1-9]|1[0-2])\/([0-9]{2})',
            'maxlength': '5'
        })
    )
    cvv = forms.CharField(
        max_length=4,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '123',
            'pattern': '[0-9]{3,4}',
            'maxlength': '4'
        })
    )

    # Donation Amount
    montant = forms.DecimalField(
        min_value=Decimal('10.00'),
        max_digits=10,
        decimal_places=2,
        widget=forms.NumberInput(attrs={
            'class': 'form-control form-control-lg',
            'placeholder': 'Entrez le montant (minimum 10 DH)',
            'min': '10',
            'step': '0.01'
        })
    )

    # Support Message
    message = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'placeholder': 'Votre message de soutien...',
            'rows': '3'
        })
    )

    class Meta:
        model = Don
        fields = ['montant', 'message']
        exclude = ['date_don', 'projet', 'donneur']

    def clean_card_number(self):
        card_number = self.cleaned_data.get('card_number')
        # Remove spaces and check if it's a valid card number
        card_number = re.sub(r'\s+', '', card_number)
        if not card_number.isdigit() or len(card_number) < 13 or len(card_number) > 19:
            raise forms.ValidationError("Numéro de carte invalide")
        return card_number

    def clean_expiry_date(self):
        expiry_date = self.cleaned_data.get('expiry_date')
        if not re.match(r'^(0[1-9]|1[0-2])\/([0-9]{2})$', expiry_date):
            raise forms.ValidationError("Format de date invalide (MM/YY)")
        return expiry_date

    def clean_cvv(self):
        cvv = self.cleaned_data.get('cvv')
        if not cvv.isdigit() or len(cvv) < 3 or len(cvv) > 4:
            raise forms.ValidationError("Code CVV invalide")
        return cvv

    def clean_montant(self):
        montant = self.cleaned_data.get('montant')
        if montant < 10:
            raise forms.ValidationError("Le montant minimum est de 10 DH.")
        return montant
