from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseRedirect, JsonResponse
from django.views import View
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.utils.decorators import method_decorator
from django.db.models import Sum
from django import forms
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Projet, Favorite, Donation, Createur, Donneur
from .forms import DonationForm, SignUpForm
from .serializers import ProjetSerializer
from config.decorators import role_required
from django.contrib.auth.models import User
from rest_framework import serializers

# REST API ViewSets
class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all()
    permission_classes = [IsAuthenticated]

class FavoriteViewSet(viewsets.ModelViewSet):
    queryset = Favorite.objects.all()
    permission_classes = [IsAuthenticated]

class AdminDashboardAPI(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        total_projects = Projet.objects.count()
        total_raised = Donation.objects.aggregate(Sum('montant'))['montant__sum'] or 0
        total_creators = Createur.objects.count()
        total_donors = Donneur.objects.count()
        
        return Response({
            'total_projects': total_projects,
            'total_raised': total_raised,
            'total_creators': total_creators,
            'total_donors': total_donors
        })

class DonationForm(forms.Form):
    donation_amount = forms.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        label="Amount (DH)",
        min_value=0.01
    )
    # These are optional fields for demonstration
    card_number = forms.CharField(max_length=16, required=False)
    expiry_date = forms.CharField(max_length=5, required=False)
    cvv = forms.CharField(max_length=3, required=False)

class SignUp(View):
    def get(self, request):
        return render(request,'signup.html', {'form': SignUpForm()})

    def post(self, request):
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            # update the profile role
            user.userprofile.role = form.cleaned_data['role']
            user.userprofile.save()
            login(request, user)
            return redirect('home')
        return render(request,'signup.html', {'form': form})


@login_required
def account_settings(request):
    if request.method == 'POST':
        pw_form = PasswordChangeForm(request.user, request.POST)
        if pw_form.is_valid():
            pw_form.save()
            update_session_auth_hash(request, pw_form.user)
            return redirect('account_settings')
    else:
        pw_form = PasswordChangeForm(request.user)
    return render(request, 'account_settings.html', {
        'pw_form': pw_form
    })

@method_decorator(role_required('admin'), name='dispatch')
class AdminDashboard(View):
    def get(self, request):
        total_projects = Projet.objects.count()
        total_raised   = Donation.objects.aggregate(Sum('montant'))['montant__sum'] or 0
        total_creators = Createur.objects.count()
        total_donors   = Donneur.objects.count()
        
        return render(request, 'admin_dashboard.html', {
            'tp': total_projects,
            'tr': total_raised,
            'tc': total_creators,
            'td': total_donors
        })

 
@login_required
def like_project(request, project_id):
    project = get_object_or_404(Projet, id=project_id)

    # Vérifier si le projet est déjà dans les favoris
    favorite, created = Favorite.objects.get_or_create(user=request.user, project=project)

    if not created:
        # Si ce n'est pas une nouvelle création (c'est-à-dire que le projet est déjà dans les favoris), on le supprime
        favorite.delete()
        action = 'supprimé des favoris'
    else:
        action = 'ajouté aux favoris'

    return redirect('home')  # Re   
@login_required
def favorite_projects(request):
    # Récupère tous les projets favoris du donneur
    favorite_projects = Projet.objects.filter(favorite__user=request.user)

    return render(request, 'favorite_projects.html', {'favorite_projects': favorite_projects})

class Home(View):
    def get(self, request):
        try:
            print("Tentative de chargement des projets...")
            # Forcer l'utilisation de la table config_projet
            projects = Projet.objects.using('default').all()
            print(f"Nombre de projets trouvés : {projects.count()}")
            
            # Afficher les détails de chaque projet
            for p in projects:
                print(f"Projet : {p.titre}")
                print(f"  - ID: {p.id}")
                print(f"  - Description: {p.description[:50]}...")
                print(f"  - Montant objectif: {p.montant_objectif}")
                print(f"  - Montant récolté: {p.montant_recolte}")
                print(f"  - Createur: {p.createur.nom}")
                print("  ---")
            
            total_raised = Donation.objects.aggregate(Sum('montant'))['montant__sum'] or 0
            total_donors = Donneur.objects.count()
            
            context = {
                'projects': projects,
                'total_raised': total_raised,
                'total_donors': total_donors,
            }
            return render(request, 'home.html', context)
        except Exception as e:
            print(f"Error in Home view: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return render(request, 'error.html', {'error': 'Unable to load projects. Please try again later.'})

class ProjectDetail(View):
    def get(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        donations = Donation.objects.filter(projet=project)
        total_donated = donations.aggregate(Sum('montant'))['montant__sum'] or 0
        is_favorite = Favorite.objects.filter(user=request.user, project=project).exists() if request.user.is_authenticated else False
        
        context = {
            'project': project,
            'donations': donations,
            'total_donated': total_donated,
            'is_favorite': is_favorite,
            'form': DonationForm()
        }
        return render(request, 'project_detail.html', context)

class Donate(View):
    @method_decorator(login_required)
    def get(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        form = DonationForm()
        return render(request, 'donate.html', {
            'project': project,
            'form': form
        })

    @method_decorator(login_required)
    def post(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        form = DonationForm(request.POST)
        
        if form.is_valid():
            donation = Donation.objects.create(
                donneur=request.user.donneur,
                projet=project,
                montant=form.cleaned_data['donation_amount']
            )
            return redirect('project_detail', project_id=project.id)
            
        return render(request, 'donate.html', {
            'project': project,
            'form': form
        })

class FavoriteProjects(View):
    @method_decorator(login_required)
    def get(self, request):
        favorite_projects = Projet.objects.filter(favorite__user=request.user)
        return render(request, 'favorite_projects.html', {
            'favorite_projects': favorite_projects
        })

class AccountSettings(View):
    @method_decorator(login_required)
    def get(self, request):
        pw_form = PasswordChangeForm(request.user)
        return render(request, 'account_settings.html', {
            'pw_form': pw_form
        })

    @method_decorator(login_required)
    def post(self, request):
        pw_form = PasswordChangeForm(request.user, request.POST)
        if pw_form.is_valid():
            pw_form.save()
            update_session_auth_hash(request, pw_form.user)
            return redirect('account_settings')
        return render(request, 'account_settings.html', {
            'pw_form': pw_form
        })

class CreateProject(View):
    @method_decorator(login_required)
    def get(self, request):
        return render(request, 'create_project.html')

    @method_decorator(login_required)
    def post(self, request):
        try:
            print("Début de la création du projet...")
            print("POST data:", request.POST)
            print("FILES:", request.FILES)
            
            # Récupérer le createur associé à l'utilisateur
            createur = Createur.objects.get(user=request.user)
            print(f"Createur trouvé : {createur.nom}")
            
            # Validation des données
            titre = request.POST.get('titre')
            description = request.POST.get('description')
            montant_objectif = request.POST.get('montant_objectif')
            
            if not all([titre, description, montant_objectif]):
                print("Données manquantes dans le formulaire")
                return render(request, 'create_project.html', {
                    'error': 'Tous les champs sont obligatoires.'
                })
            
            # Créer le projet
            projet = Projet.objects.create(
                titre=titre,
                description=description,
                montant_objectif=montant_objectif,
                montant_recolte=0,
                createur=createur
            )
            print(f"Projet créé avec succès : {projet.titre} (ID: {projet.id})")
            
            # Gérer l'image si elle est fournie
            if 'image' in request.FILES:
                projet.image = request.FILES['image']
                projet.save()
                print(f"Image ajoutée au projet : {projet.image}")
            
            return redirect('project_detail', project_id=projet.id)
        except Createur.DoesNotExist:
            print("Erreur : Createur non trouvé pour l'utilisateur")
            return render(request, 'create_project.html', {
                'error': 'Vous devez être un créateur pour créer un projet.'
            })
        except Exception as e:
            print(f"Error creating project: {str(e)}")
            return render(request, 'create_project.html', {
                'error': f'Une erreur est survenue lors de la création du projet : {str(e)}'
            })

@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def project_detail_api(request, project_id):
    try:
        project = Projet.objects.get(id=project_id)
        donations = Donation.objects.filter(projet=project)
        total_donated = donations.aggregate(Sum('montant'))['montant__sum'] or 0
        is_favorite = Favorite.objects.filter(user=request.user, project=project).exists() if request.user.is_authenticated else False
        
        data = {
            'id': project.id,
            'titre': project.titre,
            'description': project.description,
            'montant_objectif': float(project.montant_objectif),
            'montant_recolte': float(project.montant_recolte),
            'image': project.image.url if project.image else None,
            'createur': {
                'id': project.createur.id,
                'nom': project.createur.nom,
                'email': project.createur.email
            },
            'total_donated': float(total_donated),
            'is_favorite': is_favorite,
            'avancement': project.avancement(),
            'montant_restant': float(project.montant_restant())
        }
        return Response(data)
    except Projet.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite_api(request, project_id):
    try:
        project = Projet.objects.get(id=project_id)
        favorite, created = Favorite.objects.get_or_create(user=request.user, project=project)
        
        if not created:
            favorite.delete()
            is_favorite = False
        else:
            is_favorite = True
            
        return Response({
            'is_favorite': is_favorite,
            'message': 'Project added to favorites' if is_favorite else 'Project removed from favorites'
        })
    except Projet.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def favorite_projects_api(request):
    try:
        favorites = Favorite.objects.filter(user=request.user)
        projects = [{
            'id': fav.project.id,
            'titre': fav.project.titre,
            'description': fav.project.description,
            'montant_objectif': float(fav.project.montant_objectif),
            'montant_recolte': float(fav.project.montant_recolte),
            'image': fav.project.image.url if fav.project.image else None,
            'avancement': fav.project.avancement()
        } for fav in favorites]
        return Response(projects)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def donate_api(request, project_id):
    try:
        project = Projet.objects.get(id=project_id)
        montant = request.data.get('montant')
        
        if not montant or float(montant) <= 0:
            return Response({'error': 'Invalid donation amount'}, status=400)
            
        # Vérifier si l'utilisateur a un profil donneur
        try:
            donneur = request.user.donneur
        except Donneur.DoesNotExist:
            return Response({'error': 'User is not a donor'}, status=400)
            
        donation = Donation.objects.create(
            donneur=donneur,
            projet=project,
            montant=montant
        )
        
        return Response({
            'message': 'Donation successful',
            'donation': {
                'id': donation.id,
                'montant': float(donation.montant),
                'date': donation.date_don
            }
        })
    except Projet.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
