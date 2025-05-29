from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from config.views import (
    Home, ProjectDetail, Donate, FavoriteProjects,
    AccountSettings, SignUp, like_project, CreateProject,
    project_detail_api, toggle_favorite_api, favorite_projects_api,
    ProjectUpdate, ProjectDelete, LoginAPI, logout_api, get_user_info, get_csrf_token,
    ProjetViewSet, DonationViewSet, FavoriteViewSet, AdminDashboardAPI, register, donate_api,
    user_me_api,
)

# DRF Router Configuration
router = DefaultRouter()
router.register(r'projects', ProjetViewSet, basename='project-api')
router.register(r'donations', DonationViewSet, basename='donation-api')
router.register(r'favorites', FavoriteViewSet, basename='favorite-api')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('config.urls')),  # Unique inclusion pour toutes les routes API
    path('', include('config.urls')),
    path('accounts/', include('django.contrib.auth.urls')),
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
    
    
    path('api/auth/login/', LoginAPI.as_view(), name='login_api'),
    path('api/auth/logout/', logout_api, name='logout_api'),
    path('api/auth/register/', register, name='register_api'),
    path('api/auth/user/', get_user_info, name='user_info'),
    path('api/auth/csrf-token/', get_csrf_token, name='csrf_token'),
    path('api/project/<int:project_id>/', project_detail_api, name='project_detail_api'),
    path('api/project/<int:project_id>/favorite/', toggle_favorite_api, name='toggle_favorite_api'),
    path('api/favorite-projects/', favorite_projects_api, name='favorite_projects_api'),
    path('api/project/<int:project_id>/donate/', donate_api, name='donate_api'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API Endpoints
    path('api/admin-stats/', AdminDashboardAPI.as_view({'get': 'list'}), name='admin-stats-api'),
    # Add this line to expose the user/me endpoint for frontend account settings
    path('api/user/me/', user_me_api, name='user_me_api'),
    
    # Template-based URLs
    path('projets/', include('projets.urls')),  # Include projets URLs
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)