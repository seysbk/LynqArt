from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import ExhibitionArtworkViewSet, ExhibitionViewSet
from .views import healthcheck

router = DefaultRouter()
router.register(r'artworks', ExhibitionArtworkViewSet, basename='exhibitionartwork')
router.register(r'exhibition-artworks', ExhibitionArtworkViewSet, basename='exhibitionartwork-alt')
router.register(r'', ExhibitionViewSet, basename='exhibition')

urlpatterns = [
    path('health/', healthcheck, name='exhibitions-healthcheck'),
]

urlpatterns += router.urls
