from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import ArtworkImageViewSet, ArtworkTagViewSet, ArtworkVersionViewSet, ArtworkViewSet, CategoryViewSet, TagViewSet
from .views import healthcheck, share_artwork_preview

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'versions', ArtworkVersionViewSet, basename='artworkversion')
router.register(r'images', ArtworkImageViewSet, basename='artworkimage')
router.register(r'artwork-tags', ArtworkTagViewSet, basename='artworktag')
router.register(r'', ArtworkViewSet, basename='artwork')

urlpatterns = [
    path('health/', healthcheck, name='artworks-healthcheck'),
    path('<slug:slug>/share-preview/', share_artwork_preview, name='artwork-share-preview'),
]

urlpatterns += router.urls
