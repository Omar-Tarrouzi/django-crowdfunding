from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseRedirect, JsonResponse
from django.views import View
from django.contrib.auth import login, update_session_auth_hash, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.utils.decorators import method_decorator
from django.db.models import Sum
from django import forms
from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Projet, Favorite, Donation, Createur, Donneur, Paliers
from projets.forms import DonationForm
from .forms import SignUpForm, ProjetForm, LoginForm, RegisterForm
from .serializers import ProjetSerializer, UserSerializer, DonneurSerializer, CreateurSerializer, FavoriteSerializer, UserProfileSerializer, DonationSerializer, PaliersSerializer, AdminDashboardSerializer
from config.decorators import role_required
import json
from django.contrib.auth.models import User
from .models import UserProfile
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib import messages
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import Group
from django.db import transaction
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from rest_framework.views import APIView

# REST API ViewSets
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class CreateurViewSet(viewsets.ModelViewSet):
    queryset = Createur.objects.all()
    serializer_class = CreateurSerializer
    permission_classes = [IsAuthenticated]

class DonneurViewSet(viewsets.ModelViewSet):
    queryset = Donneur.objects.all()
    serializer_class = DonneurSerializer
    permission_classes = [IsAuthenticated]

class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # <-- Change from [AllowAny] to [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Projet.objects.all()
        statut = self.request.query_params.get('statut', None)
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset

    def perform_create(self, serializer):
        request = self.request
        if not request.user or not request.user.is_authenticated:
            raise forms.ValidationError("Authentication required to create a project.")

        # Parse paliers from multipart/form-data if present as JSON string
        paliers_data = request.data.get('paliers')
        paliers_list = None
        if paliers_data:
            try:
                paliers_list = json.loads(paliers_data)
            except Exception:
                raise forms.ValidationError("Invalid paliers format. Must be JSON.")

        try:
            createur = Createur.objects.get(user=request.user)
            # Pass paliers via serializer context for custom create()
            serializer.save(createur=createur)
            if paliers_list:
                for i, palier in enumerate(paliers_list):
                    Paliers.objects.create(
                        projet=serializer.instance,
                        titre=palier.get('titre', ''),
                        montant=palier.get('montant', 0),
                        description=palier.get('description', ''),
                        couleur=palier.get('couleur', '#000000'),
                        ordre=palier.get('ordre', i)
                    )
        except Createur.DoesNotExist:
            createur_id = request.data.get('createur')
            if createur_id:
                try:
                    createur = Createur.objects.get(id=createur_id)
                    serializer.save(createur=createur)
                    if paliers_list:
                        for i, palier in enumerate(paliers_list):
                            Paliers.objects.create(
                                projet=serializer.instance,
                                titre=palier.get('titre', ''),
                                montant=palier.get('montant', 0),
                                description=palier.get('description', ''),
                                couleur=palier.get('couleur', '#000000'),
                                ordre=palier.get('ordre', i)
                            )
                except Createur.DoesNotExist:
                    raise forms.ValidationError("Invalid createur id.")
            else:
                raise forms.ValidationError("You must be a creator to create a project.")

    @action(detail=True, methods=['get'])
    def paliers(self, request, pk=None):
        projet = self.get_object()
        paliers = projet.paliers.all().order_by('ordre')
        serializer = PaliersSerializer(paliers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        projet = self.get_object()
        favorite, created = Favorite.objects.get_or_create(user=request.user, project=projet)
        
        if not created:
            favorite.delete()
            return Response({'is_favorite': False})
        
        return Response({'is_favorite': True})

    @action(detail=True, methods=['post'])
    def donate(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        projet = self.get_object()
        montant = request.data.get('montant')
        
        if not montant:
            return Response({'error': 'Montant is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            donneur = Donneur.objects.get(user=request.user)
        except Donneur.DoesNotExist:
            return Response({'error': 'Donor profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        donation = Donation.objects.create(
            montant=montant,
            donneur=donneur,
            projet=projet
        )
        
        return Response(DonationSerializer(donation).data)

    def destroy(self, request, *args, **kwargs):
        projet = self.get_object()
        user = request.user
        # Only allow deletion if user is superuser or the creator of the project
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if not (user.is_superuser or (hasattr(projet, "createur") and projet.createur and projet.createur.user_id == user.id)):
            return Response({'error': 'Vous n\'êtes pas autorisé à supprimer ce projet.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='creator', permission_classes=[IsAuthenticated])
    def creator_projects(self, request):
        """
        Return all projects created by the authenticated creator.
        """
        try:
            createur = Createur.objects.get(user=request.user)
        except Createur.DoesNotExist:
            return Response({'error': 'Vous devez être un créateur.'}, status=status.HTTP_403_FORBIDDEN)
        projects = Projet.objects.filter(createur=createur)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ProjetSerializer(instance, context={'request': request})
        return Response(serializer.data)

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

class SignUp(View):
    def get(self, request):
        return render(request,'signup.html', {'form': SignUpForm()})

    def post(self, request):
        form = SignUpForm(request.POST)
        if form.is_valid():
            try:
                with transaction.atomic():
                    # Create the user
                    user = form.save(commit=False)
                    user.set_password(form.cleaned_data['password'])
                    user.save()

                    # Get or create UserProfile
                    profile, created = UserProfile.objects.get_or_create(
                        user=user,
                        defaults={'role': form.cleaned_data['role']}
                    )
                    if not created:
                        profile.role = form.cleaned_data['role']
                        profile.save()

                    # Create groups if they don't exist
                    admin_group, _ = Group.objects.get_or_create(name='Admins')
                    donneur_group, _ = Group.objects.get_or_create(name='Donneurs')
                    createur_group, _ = Group.objects.get_or_create(name='Createurs')

                    # Add user to appropriate group
                    if form.cleaned_data['role'] == 'admin':
                        user.groups.add(admin_group)
                        user.is_staff = True
                        user.is_superuser = True
                        user.save()
                    elif form.cleaned_data['role'] == 'donneur':
                        user.groups.add(donneur_group)
                        # Get or create Donneur profile
                        Donneur.objects.get_or_create(
                            user=user,
                            defaults={
                                'nom': user.username,
                                'email': user.email
                            }
                        )
                    else:  # createur
                        user.groups.add(createur_group)
                        # Get or create Createur profile
                        Createur.objects.get_or_create(
                            user=user,
                            defaults={
                                'nom': user.username,
                                'email': user.email
                            }
                        )

                    login(request, user)
                    return redirect('home')
            except Exception as e:
                print(f"Error during signup: {str(e)}")
                return render(request, 'signup.html', {
                    'form': form,
                    'error': f'Une erreur est survenue lors de l\'inscription : {str(e)}'
                })
        return render(request, 'signup.html', {'form': form})


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
        return render(request, 'projets/donation_form.html', {
            'project': project,
            'form': form
        })

    @method_decorator(login_required)
    def post(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        form = DonationForm(request.POST)
        
        if form.is_valid():
            try:
                # Get or create Donneur profile for the current user
                donneur, created = Donneur.objects.get_or_create(
                    user=request.user,
                    defaults={
                        'nom': request.user.username,
                        'email': request.user.email
                    }
                )
                
                # Create the donation
                don = form.save(commit=False)
                don.donneur = donneur
                don.projet = project
                don.save()
                
                # Update project's collected amount
                project.montant_recolte += don.montant
                project.save()
                
                messages.success(request, f'Merci pour votre don de {don.montant} DH !')
                return redirect('project_detail', project_id=project.id)
                
            except Exception as e:
                messages.error(request, f"Une erreur est survenue lors du traitement de votre don: {str(e)}")
                return redirect('donate', project_id=project.id)
        else:
            messages.error(request, "Veuillez corriger les erreurs ci-dessous.")
            
        return render(request, 'projets/donation_form.html', {
            'project': project,
            'form': form
        })

class FavoriteProjects(View):
    @method_decorator(login_required)
    def get(self, request):
        try:
            favorite_projects = Projet.objects.filter(favorite__user=request.user)
            # Add a has_image flag to each project
            for project in favorite_projects:
                project.has_image = bool(project.image)
            return render(request, 'favorite_projects.html', {
                'favorite_projects': favorite_projects
            })
        except Exception as e:
            print(f"Error in FavoriteProjects view: {str(e)}")
            return render(request, 'favorite_projects.html', {
                'error': 'Une erreur est survenue lors du chargement des projets favoris.',
                'favorite_projects': []
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
        try:
            # Vérifier si l'utilisateur a un profil createur
            createur = Createur.objects.get(user=request.user)
            return render(request, 'create_project.html')
        except Createur.DoesNotExist:
            messages.error(request, "Vous devez être un créateur pour créer un projet.")
            return redirect('home')

    @method_decorator(login_required)
    def post(self, request):
        try:
            print("Début de la création du projet...")
            print("POST data:", request.POST)
            print("FILES:", request.FILES)
            
            # Vérifier si l'utilisateur a un profil createur
            try:
                createur = Createur.objects.get(user=request.user)
                print(f"Createur trouvé : {createur.nom}")
            except Createur.DoesNotExist:
                print("Erreur : Createur non trouvé pour l'utilisateur")
                messages.error(request, "Vous devez être un créateur pour créer un projet.")
                return redirect('home')
            
            # Validation des données
            titre = request.POST.get('titre')
            description = request.POST.get('description')
            montant_objectif = request.POST.get('montant_objectif')
            date_fin = request.POST.get('date_fin')
            
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
                createur=createur,
                date_fin=date_fin if date_fin else None
            )
            print(f"Projet créé avec succès : {projet.titre} (ID: {projet.id})")
            
            # Gérer l'image si elle est fournie
            if 'image' in request.FILES:
                projet.image = request.FILES['image']
                projet.save()
                print(f"Image ajoutée au projet : {projet.image}")
            
            # Gérer les paliers
            paliers_data = request.POST.getlist('paliers[]')
            if paliers_data:
                for i, palier_data in enumerate(paliers_data):
                    try:
                        palier_json = json.loads(palier_data)
                        Paliers.objects.create(
                            projet=projet,
                            titre=palier_json['titre'],
                            montant=palier_json['montant'],
                            description=palier_json['description'],
                            couleur=palier_json.get('couleur', '#000000'),
                            ordre=i
                        )
                    except json.JSONDecodeError:
                        print(f"Erreur lors du décodage du palier {i}")
                        continue
            
            messages.success(request, "Projet créé avec succès !")
            return redirect('project_detail', project_id=projet.id)
            
        except Exception as e:
            print(f"Error creating project: {str(e)}")
            messages.error(request, f'Une erreur est survenue lors de la création du projet : {str(e)}')
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
        
        # Get current palier
        current_palier = project.get_current_palier()
        
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
            'montant_restant': float(project.montant_restant()),
            'statut': project.statut,
            'date_fin': project.date_fin.isoformat() if project.date_fin else None,
            'current_palier': {
                'id': current_palier.id,
                'titre': current_palier.titre,
                'couleur': current_palier.couleur
            } if current_palier else None,
            'paliers': [{
                'id': palier.id,
                'titre': palier.titre,
                'montant': float(palier.montant),
                'description': palier.description,
                'couleur': palier.couleur,
                'ordre': palier.ordre
            } for palier in project.paliers.all()]
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
    """
    API endpoint to return the list of favorite projects for the authenticated user.
    """
    favorites = Favorite.objects.filter(user=request.user)
    projects = []
    for fav in favorites:
        project = fav.project
        projects.append({
            'id': project.id,
            'titre': project.titre,
            'description': project.description,
            'montant_objectif': float(getattr(project, 'montant_objectif', 0)),
            'montant_recolte': float(getattr(project, 'montant_recolte', 0)),
            'image': project.image.url if project.image else None,
        })
    return Response(projects)

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
            donneur = Donneur.objects.get(user=request.user)
        except Donneur.DoesNotExist:
            # Créer automatiquement un profil Donneur si l'utilisateur n'en a pas
            donneur = Donneur.objects.create(
                user=request.user,
                nom=request.user.username,
                email=request.user.email
            )
            
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

class ProjectUpdate(View):
    @method_decorator(login_required)
    def get(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        # Check if user is authorized to edit this project
        if not (request.user.is_superuser or request.user.email == project.createur.email):
            return redirect('project_detail', project_id=project.id)
        form = ProjetForm(instance=project, user=request.user)
        return render(request, 'project_edit.html', {'form': form, 'project': project})

    @method_decorator(login_required)
    def post(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        # Check if user is authorized to edit this project
        if not (request.user.is_superuser or request.user.email == project.createur.email):
            return redirect('project_detail', project_id=project.id)
        
        form = ProjetForm(request.POST, request.FILES, instance=project, user=request.user)
        if form.is_valid():
            form.save()
            return redirect('project_detail', project_id=project.id)
        return render(request, 'project_edit.html', {'form': form, 'project': project})

class ProjectDelete(View):
    @method_decorator(login_required)
    def get(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        # Check if user is authorized to delete this project
        if not (request.user.is_superuser or request.user.email == project.createur.email):
            return redirect('project_detail', project_id=project.id)
        return render(request, 'project_delete.html', {'project': project})

    @method_decorator(login_required)
    def post(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        # Check if user is authorized to delete this project
        if not (request.user.is_superuser or request.user.email == project.createur.email):
            return redirect('project_detail', project_id=project.id)
        project.delete()
        return redirect('home')

class LoginAPI(generics.GenericAPIView):
    authentication_classes = ()  # No authentication required
    permission_classes = (AllowAny,)  # Allow any user to access this view
    
    def post(self, request, *args, **kwargs):
        try:
            print("\n=== Login Request Details ===")
            print("Request headers:", dict(request.headers))
            print("Request body:", request.body)
            print("Request method:", request.method)
            print("Request content type:", request.content_type)
            print("Origin header:", request.headers.get('Origin'))
            
            # Try to get data from request.data first (handles both JSON and form data)
            if request.data:
                data = request.data
            else:
                # Fallback to request.body for raw JSON
                data = json.loads(request.body)
                
            username = data.get('username')
            password = data.get('password')
            
            print(f"\n=== Authentication Attempt ===")
            print(f"Username: {username}")
            print(f"Password provided: {'Yes' if password else 'No'}")
            
            if not username or not password:
                print("Error: Missing username or password")
                return Response({
                    'error': 'Please provide both username and password'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Authenticate user
            user = authenticate(request, username=username, password=password)
            print(f"\n=== Authentication Result ===")
            print(f"User authenticated: {user is not None}")
            
            if user is None:
                print(f"Error: Authentication failed for user {username}")
                return Response({
                    'error': 'Invalid username or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
            elif not user.is_active:
                print(f"Error: User {username} is inactive")
                return Response({
                    'error': 'User account is inactive'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            print(f"\n=== User Details ===")
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Is active: {user.is_active}")
            print(f"Is staff: {user.is_staff}")
            print(f"Is superuser: {user.is_superuser}")
            print(f"Groups: {[g.name for g in user.groups.all()]}")
            
            # Determine user role
            try:
                createur = Createur.objects.get(user=user)
                print(f"User is a Createur: {createur.nom}")
                role = 'createur'
            except Createur.DoesNotExist:
                try:
                    donneur = Donneur.objects.get(user=user)
                    print(f"User is a Donneur: {donneur.nom}")
                    role = 'donneur'
                except Donneur.DoesNotExist:
                    if user.is_superuser:
                        print("User is an admin")
                        role = 'admin'
                    else:
                        print("User has no specific role, defaulting to donneur")
                        role = 'donneur'
            
            # Generate JWT token
            refresh = RefreshToken.for_user(user)
            print("\n=== Generated JWT Tokens ===")
            
            response_data = {
                'token': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': role
                }
            }
            
            response = Response(response_data)
            
            # Add CORS headers
            response["Access-Control-Allow-Origin"] = "http://localhost:3000"
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Accept, Authorization, X-CSRFToken"
            
            print("\n=== Response Headers ===")
            print("Access-Control-Allow-Origin:", response.get("Access-Control-Allow-Origin"))
            print("Access-Control-Allow-Credentials:", response.get("Access-Control-Allow-Credentials"))
            print("Access-Control-Allow-Methods:", response.get("Access-Control-Allow-Methods"))
            print("Access-Control-Allow-Headers:", response.get("Access-Control-Allow-Headers"))
            
            return response
            
        except json.JSONDecodeError as e:
            print(f"\nError: JSON decode error: {str(e)}")
            return Response({
                'error': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"\nError: Unexpected error: {str(e)}")
            return Response({
                'error': f'An error occurred: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_csrf_token(request):
    return JsonResponse({
        'csrfToken': get_token(request)
    })

@api_view(['POST'])
def logout_api(request):
    logout(request)
    return Response({
        'message': 'Logout successful'
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        data = request.data
        print("Received registration data:", data)  # Debug log
        
        # Accept both user_type and role fields
        user_type = data.get('user_type') or data.get('role')
        
        if not user_type or user_type not in ['admin', 'creator', 'donor']:
            return Response({
                'error': 'user_type must be either "admin", "creator" or "donor"',
                'received_data': data
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user_data = {
            'username': data.get('username'),
            'email': data.get('email'),
            'password': data.get('password'),
            'first_name': data.get('first_name', ''),
            'last_name': data.get('last_name', '')
        }
        
        print("User data to create:", user_data)  # Debug log
        
        user_serializer = UserSerializer(data=user_data)
        if not user_serializer.is_valid():
            print("User serializer errors:", user_serializer.errors)  # Debug log
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Create the user
            user = user_serializer.save()
            
            # Create the appropriate profile based on user_type
            if user_type == 'creator':
                Createur.objects.create(
                    user=user,
                    nom=f"{user.first_name} {user.last_name}".strip() or user.username,
                    email=user.email
                )
            elif user_type == 'donor':
                Donneur.objects.create(
                    user=user,
                    nom=f"{user.first_name} {user.last_name}".strip() or user.username,
                    email=user.email
                )
            elif user_type == 'admin':
                user.is_staff = True
                user.is_superuser = True
                user.save()

            # Get or create UserProfile
            profile, created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': user_type}
            )
            if not created:
                profile.role = user_type
                profile.save()

            # Add user to appropriate group
            group, _ = Group.objects.get_or_create(name=f"{user_type.capitalize()}s")
            user.groups.add(group)

        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user_type
            }
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print("Registration error:", str(e))  # Debug log
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_palier_api(request, project_id):
    try:
        project = Projet.objects.get(id=project_id)
        
        # Check if user is the project creator
        if request.user != project.createur.user:
            return Response({'error': 'Only the project creator can add paliers'}, status=403)
        
        data = request.data
        palier = Paliers.objects.create(
            projet=project,
            titre=data['titre'],
            montant=data['montant'],
            description=data['description'],
            couleur=data.get('couleur', '#000000'),
            ordre=data.get('ordre', project.paliers.count())
        )
        
        return Response({
            'id': palier.id,
            'titre': palier.titre,
            'montant': float(palier.montant),
            'description': palier.description,
            'couleur': palier.couleur,
            'ordre': palier.ordre
        })
    except Projet.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    try:
        user = request.user
        print(f"\n=== Getting user info for {user.username} ===")
        print(f"Request headers: {request.headers}")
        
        # Vérifier si l'utilisateur est un créateur
        try:
            createur = Createur.objects.get(user=user)
            role = 'createur'
            creator_id = createur.id
            print(f"User is a creator: {createur.nom}")
        except Createur.DoesNotExist:
            try:
                # Vérifier si l'utilisateur est un donneur
                donneur = Donneur.objects.get(user=user)
                role = 'donneur'
                creator_id = None
                print(f"User is a donor: {donneur.nom}")
            except Donneur.DoesNotExist:
                # Vérifier le profil utilisateur
                user_profile = UserProfile.objects.get(user=user)
                role = user_profile.role
                creator_id = None
                print(f"User role from profile: {role}")
        
        # Mettre à jour le profil utilisateur si nécessaire
        user_profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': role}
        )
        if not created and user_profile.role != role:
            user_profile.role = role
            user_profile.save()
            print(f"Updated user profile role to: {role}")
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': role
        }

        # Add creator_id if user is a creator
        if role == 'createur' and creator_id:
            user_data['creator_id'] = creator_id
        
        print(f"Returning user data: {user_data}")
        response = JsonResponse(user_data)
        
        # Add CORS headers
        response["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response["Access-Control-Allow-Credentials"] = "true"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Accept, Authorization"
        
        return response
        
    except Exception as e:
        print(f"Error in get_user_info: {str(e)}")
        return JsonResponse({
            'error': str(e)
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.data)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                
                # Vérifier si l'utilisateur est un créateur
                try:
                    createur = Createur.objects.get(user=user)
                    role = 'createur'
                except Createur.DoesNotExist:
                    # Vérifier le profil utilisateur
                    user_profile = UserProfile.objects.get(user=user)
                    role = user_profile.role
                
                print(f"User logged in: {user.username}, role: {role}")


                return Response({
                    'message': 'Connexion réussie',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'role': role
                    }
                })
            else:
                return Response({
                    'error': 'Nom d\'utilisateur ou mot de passe incorrect'
                }, status=status.HTTP_401_UNAUTHORIZED)
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response({'error': 'Méthode non autorisée'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.data)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return Response({
                'message': 'Inscription réussie',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                }
            }, status=status.HTTP_201_CREATED)
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response({'error': 'Méthode non autorisée'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
@login_required
def logout_view(request):
    logout(request)
    return Response({'message': 'Déconnexion réussie'})

@api_view(['GET'])
@login_required
def user_view(request):
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'role': request.user.role
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def donation_history(request):
    user = request.user
    try:
        donneur = Donneur.objects.get(user=user)
        donations = Donation.objects.filter(donneur=donneur).order_by('-date')
    except Donneur.DoesNotExist:
        donations = []

    data = [
        {
            'id': d.id,
            'project': d.projet.id,
            'project_title': getattr(d.projet, 'titre', ''),
            'montant': d.montant,
            'date': d.date_don if hasattr(d, 'date_don') else d.date,
        }
        for d in donations
    ]
    return Response(data)

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_me_api(request):
    user = request.user
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    elif request.method in ['PUT', 'PATCH']:
        serializer = UserSerializer(user, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DashboardAPI(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        total_projects = Projet.objects.count()
        total_raised = Donation.objects.aggregate(Sum('montant'))['montant__sum'] or 0
        total_donors = Donneur.objects.count()
        return Response({
            'total_projects': total_projects,
            'total_raised': total_raised,
            'total_donors': total_donors
        })







