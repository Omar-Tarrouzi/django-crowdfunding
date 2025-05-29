from django.urls import path
from . import views

app_name = 'projets'

urlpatterns = [
    path('', views.ProjectListView.as_view(), name='projects'),
    path('create/', views.ProjectCreate.as_view(), name='project_create'),
    path('<int:pk>/', views.project_detail, name='project_detail'),
    path('<int:pk>/update/', views.ProjectUpdate.as_view(), name='project_update'),
    path('<int:pk>/delete/', views.ProjectDelete.as_view(), name='project_delete'),
    path('<int:pk>/donate/', views.donate, name='donate'),
]
