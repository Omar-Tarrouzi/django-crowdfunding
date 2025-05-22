from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from config.views import (
    ProjetViewSet,
    DonationViewSet,
    FavoriteViewSet,
    AdminDashboardAPI,
    user_profile
)

# DRF Router Configuration
router = DefaultRouter()
router.register(r'projects', ProjetViewSet, basename='project-api')
router.register(r'donations', DonationViewSet, basename='donation-api')
router.register(r'favorites', FavoriteViewSet, basename='favorite-api')

urlpatterns = [
    # Admin and Authentication
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/user/profile/', user_profile, name='user-profile'),
    
    # API Endpoints
    path('api/', include(router.urls)),
    path('api/admin-stats/', AdminDashboardAPI.as_view({'get': 'list'}), name='admin-stats-api'),
    
    # Template-based URLs
    path('', include('config.urls')),  # Include config URLs for template views
    path('projets/', include('projets.urls')),  # Include projets URLs
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)