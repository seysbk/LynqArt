from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import ArtworkViewViewSet
from .views import healthcheck

router = DefaultRouter()
router.register(r'views', ArtworkViewViewSet, basename='artworkview')

urlpatterns = [
    path('', healthcheck, name='analytics-healthcheck'),
]

urlpatterns += router.urls
