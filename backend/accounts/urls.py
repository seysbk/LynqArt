from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

from .auth_views import ArtistProfileSelfView, BecomeArtistView, CurrentUserView, RegisterView
from .api_views import ArtistProfileViewSet, UserViewSet
from .views import healthcheck

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'artist-profiles', ArtistProfileViewSet, basename='artistprofile')

urlpatterns = [
    path('', healthcheck, name='accounts-healthcheck'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', CurrentUserView.as_view(), name='current-user'),
    path('become-artist/', BecomeArtistView.as_view(), name='become-artist'),
    path('artist-profile/', ArtistProfileSelfView.as_view(), name='artist-profile-self'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('', include(router.urls)),
]
