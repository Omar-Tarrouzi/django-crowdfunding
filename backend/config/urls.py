from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from .views import (
    Home, ProjectDetail, Donate, FavoriteProjects,
    AccountSettings, SignUp, like_project, CreateProject,
    project_detail_api, toggle_favorite_api, favorite_projects_api, donate_api
)

urlpatterns = [
    path('', Home.as_view(), name='home'),
    path('project/<int:project_id>/', ProjectDetail.as_view(), name='project_detail'),
    path('project/<int:project_id>/donate/', Donate.as_view(), name='donate'),
    path('favorites/', FavoriteProjects.as_view(), name='favorite_projects'),
    path('account/', AccountSettings.as_view(), name='account_settings'),
    path('signup/', SignUp.as_view(), name='signup'),
    path('like/<int:project_id>/', like_project, name='like_project'),
    path('create-project/', CreateProject.as_view(), name='create_project'),
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('accounts/', include('django.contrib.auth.urls')),
    
    # API endpoints
    path('api/project/<int:project_id>/', project_detail_api, name='project_detail_api'),
    path('api/project/<int:project_id>/favorite/', toggle_favorite_api, name='toggle_favorite_api'),
    path('api/favorites/', favorite_projects_api, name='favorite_projects_api'),
    path('api/project/<int:project_id>/donate/', donate_api, name='donate_api'),
]

