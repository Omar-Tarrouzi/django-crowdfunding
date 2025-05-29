# config/api.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.views import View
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.utils.decorators import method_decorator
from django.db.models import Sum
from config.models import Projet, Favorite, UserProfile, Donation, Donneur, Createur
from config.serializers import (
    ProjetSerializer, 
    FavoriteSerializer,
    UserProfileSerializer,
    DonationSerializer,
    DonneurSerializer,
    CreateurSerializer,
    AdminDashboardSerializer
)
from config.forms import DonationForm, SignUpForm
from config.decorators import role_required
from rest_framework.permissions import AllowAny

class Home(View):
    def get(self, request):
        projects = Projet.objects.all()
        total_raised = Donation.objects.aggregate(Sum('montant'))['montant__sum'] or 0
        total_donors = Donation.objects.count()
        return render(request, 'home.html', {
            'projects': projects,
            'total_raised': total_raised,
            'total_donors': total_donors
        })

class ProjectDetail(View):
    def get(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        donation_form = DonationForm()
        return render(request, 'project_detail.html', {
            'project': project,
            'donation_form': donation_form
        })

class Donate(View):
    @method_decorator(login_required)
    def post(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        form = DonationForm(request.POST)
        if form.is_valid():
            donation = form.save(commit=False)
            donation.projet = project
            donation.donneur = request.user.donneur
            donation.save()
            return redirect('project_detail', project_id=project.id)
        return render(request, 'project_detail.html', {
            'project': project,
            'donation_form': form
        })

class FavoriteProjects(View):
    @method_decorator(login_required)
    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user)
        return render(request, 'favorite_projects.html', {'favorites': favorites})

    @method_decorator(login_required)
    def post(self, request, project_id):
        project = get_object_or_404(Projet, id=project_id)
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            project=project
        )
        if not created:
            favorite.delete()
        return redirect('project_detail', project_id=project.id)

class AccountSettings(View):
    @method_decorator(login_required)
    def get(self, request):
        form = PasswordChangeForm(request.user)
        return render(request, 'account_settings.html', {'form': form})

    @method_decorator(login_required)
    def post(self, request):
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            return redirect('account_settings')
        return render(request, 'account_settings.html', {'form': form})

class SignUp(View):
    def get(self, request):
        form = SignUpForm()
        return render(request, 'signup.html', {'form': form})

    def post(self, request):
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('home')
        return render(request, 'signup.html', {'form': form})

# REST API ViewSets
class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        if self.request.user.userprofile.role == 'creator':
            creator = Createur.objects.get(user=self.request.user)
            serializer.save(createur=creator)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def donate(self, request, pk=None):
        project = self.get_object()
        serializer = DonationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(projet=project, donneur=request.user.donneur)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DonationViewSet(viewsets.ModelViewSet):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.userprofile.role == 'admin':
            return Donation.objects.all()
        return Donation.objects.filter(donneur=self.request.user.donneur)

    def perform_create(self, serializer):
        donation = serializer.save()
        # Update project's collected amount
        donation.projet.montant_recolte += donation.montant
        donation.projet.save()

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAdminUser]

class CreateurViewSet(viewsets.ModelViewSet):
    queryset = Createur.objects.all()
    serializer_class = CreateurSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class DonneurViewSet(viewsets.ModelViewSet):
    queryset = Donneur.objects.all()
    serializer_class = DonneurSerializer
    permission_classes = [permissions.IsAuthenticated]

class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AdminDashboardAPI(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    def list(self, request):
        stats = {
            'total_projects': Projet.objects.count(),
            'total_raised': Donation.objects.aggregate(Sum('montant'))['montant__sum'] or 0,
            'total_creators': Createur.objects.count(),
            'total_donors': Donneur.objects.count()  # Use actual count, not hardcoded
        }
        serializer = AdminDashboardSerializer(stats)
        return Response(serializer.data)