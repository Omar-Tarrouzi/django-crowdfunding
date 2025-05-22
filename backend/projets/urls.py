from django.urls import path
from . import views
from .views import ProjectCreate
from .views import home

app_name = 'projets'

urlpatterns = [
    path('', home, name='home'),  # Page d'accueil où les projets sont affichés
    path('projects/create/', ProjectCreate.as_view(), name='project_create'),
    path('projects/', views.ProjectListView.as_view(), name='projects'),
]
