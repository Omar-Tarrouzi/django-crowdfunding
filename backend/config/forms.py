from django import forms
from config.models import Projet, UserProfile
from django.contrib.auth.models import User
from config.models import UserProfile, Createur
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm

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

class SignUpForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    role = forms.ChoiceField(choices=[
        ('donor', 'Donor'),
        ('creator', 'Creator'),
        ('admin', 'Admin')
    ])
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

class LoginForm(AuthenticationForm):
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Nom d\'utilisateur'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Mot de passe'
        })
    )

class RegisterForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Email'
        })
    )
    first_name = forms.CharField(
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Prénom'
        })
    )
    last_name = forms.CharField(
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Nom'
        })
    )
    role = forms.ChoiceField(
        choices=[
            ('donor', 'Donor'),
            ('creator', 'Creator'),
            ('admin', 'Admin')
        ],
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'role', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].widget.attrs.update({'class': 'form-control', 'placeholder': 'Nom d\'utilisateur'})
        self.fields['password1'].widget.attrs.update({'class': 'form-control', 'placeholder': 'Mot de passe'})
        self.fields['password2'].widget.attrs.update({'class': 'form-control', 'placeholder': 'Confirmer le mot de passe'})
