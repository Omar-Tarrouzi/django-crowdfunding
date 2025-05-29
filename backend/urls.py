from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from config.views import login_view, register_view, logout_view, user_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('projects.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    # Custom auth views
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/register/', register_view, name='register'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/user/', user_view, name='user'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 