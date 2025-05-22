from django.http import HttpResponse
from django.views.generic.edit import CreateView, UpdateView
from django.views.generic import ListView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from config.models import Projet, Createur
from .forms import ProjetForm

def index(request):
    return HttpResponse("Bienvenue dans la section Donneurs !")

def home(request):
    projets = Projet.objects.all()
    return render(request, 'home.html', {'projets': projets})

class ProjectCreate(LoginRequiredMixin, CreateView):
    model = Projet
    form_class = ProjetForm
    template_name = 'project_create.html'
    success_url = reverse_lazy('home')

    def form_valid(self, form):
        try:
            # Try to get the createur profile
            createur = self.request.user.createur
        except Createur.DoesNotExist:
            # If it doesn't exist, create one with user's information
            createur = Createur.objects.create(
                user=self.request.user,
                nom=self.request.user.username,
                email=self.request.user.email,
                bio=f"Bio de {self.request.user.username}"
            )
            messages.info(self.request, 'Profil créateur créé avec succès!')
        
        form.instance.createur = createur
        messages.success(self.request, 'Projet créé avec succès!')
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Créer un nouveau projet'
        return context

class ProjectListView(LoginRequiredMixin, ListView):
    model = Projet
    template_name = 'project_list.html'
    context_object_name = 'projects'

    def get_queryset(self):
        # Only show projects created by the current user
        return Projet.objects.filter(createur=self.request.user.createur)

def project_detail(request, pk):
    project = get_object_or_404(Projet, pk=pk)
    return render(request, 'project_detail.html', {'project': project})

class ProjectUpdate(LoginRequiredMixin, UpdateView):
    model = Projet
    form_class = ProjetForm
    template_name = 'project_update.html'
    
    def get_queryset(self):
        # Only allow users to update their own projects
        return Projet.objects.filter(createur=self.request.user.createur)
    
    def get_success_url(self):
        return reverse_lazy('projets:project_detail', kwargs={'pk': self.object.pk})
