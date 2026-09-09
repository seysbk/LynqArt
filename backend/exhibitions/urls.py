from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import ExhibitionArtworkViewSet, ExhibitionViewSet
from .views import healthcheck, share_exhibition_preview

router = DefaultRouter()
router.register(r'artworks', ExhibitionArtworkViewSet, basename='exhibitionartwork')
router.register(r'exhibition-artworks', ExhibitionArtworkViewSet, basename='exhibitionartwork-alt')
router.register(r'', ExhibitionViewSet, basename='exhibition')

urlpatterns = [
    path('health/', healthcheck, name='exhibitions-healthcheck'),
    path('<slug:slug>/share-preview/', share_exhibition_preview, name='exhibition-share-preview'),
]

urlpatterns += router.urls
