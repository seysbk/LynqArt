import os
from uuid import uuid4

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from accounts.permissions import IsCanManageExhibitionsOrReadOnly, IsOwnerOrReadOnly
from artworks.models import ArtworkContributor
from config.security import validate_and_store_upload

from .models import Exhibition, ExhibitionArtwork
from .serializers import ExhibitionArtworkSerializer, ExhibitionSerializer


class ExhibitionViewSet(viewsets.ModelViewSet):
    queryset = Exhibition.objects.select_related('organizer').prefetch_related('exhibitionartwork_set__artwork').all().order_by('-created_at')
    serializer_class = ExhibitionSerializer
    lookup_field = 'slug'
    permission_classes = [IsCanManageExhibitionsOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'slug', 'location', 'short_description', 'markdown_description', 'organizer__username')
    filterset_fields = ('status', 'show_on_homepage', 'is_featured', 'organizer')
    ordering_fields = ('created_at', 'updated_at', 'start_date', 'end_date', 'title')

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if request.method == 'GET' and response.status_code == 200:
            response['Cache-Control'] = 'public, max-age=60, s-maxage=300'
        return response

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            queryset = queryset.filter(status='published')
        elif not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            queryset = queryset.filter(organizer=user) | queryset.filter(status='published')
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            if not (getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False)):
                return queryset.filter(organizer=self.request.user)
        return queryset

    @action(detail=True, methods=['post', 'delete'], parser_classes=[MultiPartParser, FormParser])
    def upload_banner(self, request, slug=None):
        exhibition = self.get_object()
        if exhibition.organizer != request.user and not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to modify this exhibition banner.')

        if request.method == 'DELETE':
            exhibition.banner_image = ''
            exhibition.save(update_fields=['banner_image', 'updated_at'])
            return Response({'id': exhibition.id, 'banner_image': ''}, status=status.HTTP_200_OK)

        uploaded_file = request.FILES.get('banner')
        if not uploaded_file:
            return Response({'banner': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        _, banner_url = validate_and_store_upload(uploaded_file, 'exhibition-banners', max_size_mb=10)
        exhibition.banner_image = banner_url
        exhibition.save(update_fields=['banner_image', 'updated_at'])
        return Response({'id': exhibition.id, 'banner_image': exhibition.banner_image})


class ExhibitionArtworkViewSet(viewsets.ModelViewSet):
    queryset = ExhibitionArtwork.objects.select_related('exhibition', 'artwork').all().order_by('display_order')
    serializer_class = ExhibitionArtworkSerializer
    permission_classes = [IsCanManageExhibitionsOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ('exhibition', 'artwork', 'is_featured')
    ordering_fields = ('display_order', 'created_at')

    def perform_create(self, serializer):
        exhibition = serializer.validated_data.get('exhibition')
        artwork = serializer.validated_data.get('artwork')
        user = self.request.user
        can_manage = getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False) or exhibition.organizer_id == user.id
        can_manage_artwork = artwork and (artwork.artist_id == user.id or ArtworkContributor.objects.filter(artwork=artwork, user=user, status=ArtworkContributor.STATUS_ACCEPTED).exists())
        if not can_manage and not can_manage_artwork:
            raise PermissionDenied('You do not have permission to add artworks to this exhibition.')
        serializer.save()

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
