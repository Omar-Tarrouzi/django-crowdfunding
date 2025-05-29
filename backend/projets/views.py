from django.http import HttpResponse
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.views.generic import ListView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from config.models import Projet, Createur, Don, Donneur
from .forms import ProjetForm, DonationForm

def index(request):
    return HttpResponse("Bienvenue dans la section Donneurs !")

def home(request):
    projets = Projet.objects.all()
    return render(request, 'home.html', {'projets': projets})

class ProjectCreate(LoginRequiredMixin, CreateView):
    model = Projet
    form_class = ProjetForm
    template_name = 'projets/project_form.html'
    success_url = reverse_lazy('projets:projects')

    def form_valid(self, form):
        try:
            # Get the Createur instance for the current user
            createur = Createur.objects.get(user=self.request.user)
            # Set the createur field with the actual Createur instance
            form.instance.createur = createur
            return super().form_valid(form)
        except Createur.DoesNotExist:
            form.add_error(None, "Vous devez être un créateur pour créer un projet.")
            return self.form_invalid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Créer un nouveau projet'
        return context

class ProjectListView(LoginRequiredMixin, ListView):
    model = Projet
    template_name = 'projets/project_list.html'
    context_object_name = 'projects'

    def get_queryset(self):
        try:
        # Only show projects created by the current user
            return Projet.objects.filter(createur=self.request.user.createur).order_by('-date_creation')
        except Createur.DoesNotExist:
            return Projet.objects.none()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Mes Projets'
        return context

def project_detail(request, pk):
    project = get_object_or_404(Projet, pk=pk)
    context = {
        'project': project,
        'title': project.titre,
    }
    return render(request, 'projets/project_detail.html', context)

def donate(request, pk):
    projet = get_object_or_404(Projet, pk=pk)
    
    if not request.user.is_authenticated:
        messages.error(request, "Vous devez être connecté pour faire un don.")
        return redirect('login')
    
    if request.method == 'POST':
        form = DonationForm(request.POST)
        if form.is_valid():
            try:
                # Get the Donneur instance for the current user
                donneur = Donneur.objects.get(user=request.user)
                
                # Create the donation
                don = form.save(commit=False)
                don.projet = projet
                don.donneur = donneur
                don.save()
                
                # Update project amount
                projet.montant_recolte += don.montant
                projet.save()
                
                messages.success(request, f'Merci pour votre don de {don.montant} DH !')
                return redirect('projets:project_detail', pk=projet.pk)
                
            except Donneur.DoesNotExist:
                messages.error(request, "Vous devez être un donneur pour faire un don.")
                return redirect('projets:project_detail', pk=projet.pk)
            except Exception as e:
                messages.error(request, "Une erreur est survenue lors du traitement de votre don.")
                return redirect('projets:donate', pk=projet.pk)
        else:
            messages.error(request, "Veuillez corriger les erreurs ci-dessous.")
    else:
        form = DonationForm()
    
    context = {
        'projet': projet,
        'form': form
    }
    return render(request, 'projets/donation_form.html', context)

class ProjectUpdate(LoginRequiredMixin, UpdateView):
    model = Projet
    form_class = ProjetForm
    template_name = 'projets/project_update.html'
    
    def get_queryset(self):
        # Only allow users to update their own projects
        return Projet.objects.filter(createur=self.request.user.createur)
    
    def get_success_url(self):
        return reverse_lazy('projets:project_detail', kwargs={'pk': self.object.pk})
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = f'Modifier {self.object.titre}'
        return context
    
    def form_valid(self, form):
        try:
            # Validate target amount
            new_target = form.cleaned_data['montant_objectif']
            if new_target < self.object.montant_recolte:
                form.add_error('montant_objectif', 
                    f"Le montant objectif ne peut pas être inférieur au montant déjà récolté ({self.object.montant_recolte} DH)")
                return self.form_invalid(form)
            
            # Handle image upload
            if 'image' in self.request.FILES:
                # Delete old image if it exists
                if self.object.image:
                    self.object.image.delete()
                form.instance.image = self.request.FILES['image']
            
            messages.success(self.request, "Le projet a été modifié avec succès.")
            return super().form_valid(form)
        except Exception as e:
            messages.error(self.request, "Une erreur est survenue lors de la modification du projet.")
            return self.form_invalid(form)

class ProjectDelete(LoginRequiredMixin, DeleteView):
    model = Projet
    template_name = 'projets/project_confirm_delete.html'
    success_url = reverse_lazy('projets:project_list')
    
    def get_queryset(self):
        # Only allow users to delete their own projects
        return Projet.objects.filter(createur=self.request.user.createur)
    
    def delete(self, request, *args, **kwargs):
        try:
            project = self.get_object()
            # Delete project image if it exists
            if project.image:
                project.image.delete()
            # Delete all related donations
            project.dons.all().delete()
            # Delete all related paliers
            project.paliers.all().delete()
            
            messages.success(request, "Le projet a été supprimé avec succès.")
            return super().delete(request, *args, **kwargs)
        except Exception as e:
            messages.error(request, "Une erreur est survenue lors de la suppression du projet.")
            return redirect('projets:project_detail', pk=kwargs['pk'])

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Supprimer le projet'
        return context
