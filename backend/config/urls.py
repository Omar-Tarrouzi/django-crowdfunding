from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from . import views
from .views import (
    Home, ProjectDetail, Donate, FavoriteProjects,
    AccountSettings, SignUp, like_project, CreateProject,
    project_detail_api, toggle_favorite_api, favorite_projects_api, donate_api,
    ProjectUpdate, ProjectDelete, LoginAPI, logout_api, get_user_info, get_csrf_token,
    register, ProjetViewSet, DonationViewSet, UserViewSet, CreateurViewSet, DonneurViewSet,
    donation_history, user_me_api, DashboardAPI
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from config.views import AdminDashboardAPI
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'projects', ProjetViewSet)
router.register(r'donations', DonationViewSet)
router.register(r'users', UserViewSet)
router.register(r'creators', CreateurViewSet)
router.register(r'donors', DonneurViewSet)
router.register(r'admin-stats', AdminDashboardAPI, basename='admin-stats')

urlpatterns = [
    path('', Home.as_view(), name='home'),
    path('project/<int:project_id>/', ProjectDetail.as_view(), name='project_detail'),
    path('project/<int:project_id>/donate/', Donate.as_view(), name='donate'),
    path('favorites/', FavoriteProjects.as_view(), name='favorite_projects'),
    path('account/', AccountSettings.as_view(), name='account_settings'),
    path('signup/', SignUp.as_view(), name='signup'),
    path('like/<int:project_id>/', like_project, name='like_project'),
    path('create-project/', CreateProject.as_view(), name='create_project'),
    path('project/<int:project_id>/update/', ProjectUpdate.as_view(), name='project_update'),
    path('project/<int:project_id>/delete/', ProjectDelete.as_view(), name='project_delete'),
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('accounts/', include('django.contrib.auth.urls')),
    
    # API endpoints
    path('api/auth/login/', LoginAPI.as_view(), name='login_api'),
    path('api/auth/logout/', logout_api, name='logout_api'),
    path('api/auth/register/', register, name='register_api'),
    path('api/auth/user/', get_user_info, name='user_info'),
    path('api/auth/csrf-token/', get_csrf_token, name='csrf_token'),
    path('api/project/<int:project_id>/', project_detail_api, name='project_detail_api'),
    path('api/project/<int:project_id>/favorite/', toggle_favorite_api, name='toggle_favorite_api'),
    path('api/favorites/', favorite_projects_api, name='favorite_projects_api'),
    path('api/project/<int:project_id>/donate/', donate_api, name='donate_api'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
    path('projects/<int:pk>/paliers/', ProjetViewSet.as_view({'get': 'paliers'}), name='project-paliers'),
    path('projects/<int:pk>/toggle-favorite/', ProjetViewSet.as_view({'post': 'toggle_favorite'}), name='project-toggle-favorite'),
    path('projects/<int:pk>/donate/', ProjetViewSet.as_view({'post': 'donate'}), name='project-donate'),
    path('api/donations/history/', donation_history, name='donation_history'),
    path('api/users/me/', user_me_api, name='user_me_api'),
    path('api/dashboard/', DashboardAPI.as_view(), name='dashboard-api'),
]

