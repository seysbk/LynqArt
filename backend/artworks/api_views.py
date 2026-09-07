import os
from uuid import uuid4

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from accounts.permissions import IsArtistOrReadOnly, IsOwnerOrReadOnly
from config.security import validate_and_store_upload

from .models import Artwork, ArtworkImage, ArtworkTag, ArtworkVersion, Category, Tag
from .serializers import (
    ArtworkImageSerializer,
    ArtworkSerializer,
    ArtworkTagSerializer,
    ArtworkVersionSerializer,
    CategorySerializer,
    TagSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsArtistOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name', 'slug')
    ordering_fields = ('name', 'created_at', 'updated_at')


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    permission_classes = [IsArtistOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name', 'slug')
    ordering_fields = ('name', 'created_at', 'updated_at')


class ArtworkViewSet(viewsets.ModelViewSet):
    queryset = Artwork.objects.select_related('artist', 'category', 'current_version').prefetch_related('versions', 'images', 'artwork_tags__tag').all().order_by('-created_at')
    serializer_class = ArtworkSerializer
    lookup_field = 'slug'
    permission_classes = [IsArtistOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'slug', 'description', 'medium', 'artist__username', 'artist__email', 'category__name')
    filterset_fields = ('status', 'is_featured', 'is_artist_featured', 'allow_comments', 'category', 'artist', 'artist_id')
    ordering_fields = ('created_at', 'updated_at', 'published_at', 'title')

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if request.method == 'GET' and response.status_code == 200:
            response['Cache-Control'] = 'public, max-age=60, s-maxage=300'
        return response

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        artist_id = self.request.query_params.get('artist_id') or self.request.query_params.get('artist')
        if artist_id:
            queryset = queryset.filter(artist_id=artist_id)
        user = self.request.user
        if not user.is_authenticated:
            queryset = queryset.filter(status=Artwork.STATUS_PUBLISHED)
        elif not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            queryset = queryset.filter(artist=user) | queryset.filter(status=Artwork.STATUS_PUBLISHED)
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            if not (getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False)):
                return queryset.filter(artist=self.request.user)
        return queryset

    def _store_upload(self, uploaded_file, folder):
        _, url = validate_and_store_upload(uploaded_file, folder, max_size_mb=10)
        return url

    @action(
        detail=True,
        methods=['post'],
        url_path='upload_images',
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_images(self, request, slug=None):
        artwork = self.get_object()
        if artwork.artist != request.user and not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to upload images for this artwork.')

        uploaded_files = request.FILES.getlist('images') or request.FILES.getlist('image')
        if not uploaded_files:
            uploaded_file = request.FILES.get('image') or request.FILES.get('images')
            if uploaded_file:
                uploaded_files = [uploaded_file]

        if not uploaded_files:
            return Response({'image': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        caption = request.data.get('caption', '')
        display_order = int(request.data.get('display_order') or 0)

        created_images = []
        for idx, uploaded_file in enumerate(uploaded_files):
            image = ArtworkImage.objects.create(
                artwork=artwork,
                image_url=self._store_upload(uploaded_file, 'artworks'),
                caption=caption,
                display_order=display_order + idx,
            )
            created_images.append(image)

        if len(created_images) == 1:
            return Response(ArtworkImageSerializer(created_images[0], context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(ArtworkImageSerializer(created_images, many=True, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=['post', 'delete'],
        url_path='upload_banner',
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_banner(self, request, slug=None):
        artwork = self.get_object()
        if artwork.artist != request.user and not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to modify this artwork banner.')

        if request.method == 'DELETE':
            artwork.banner_image = ''
            artwork.save(update_fields=['banner_image', 'updated_at'])
            return Response({'id': artwork.id, 'banner_image': ''}, status=status.HTTP_200_OK)

        uploaded_file = request.FILES.get('banner')
        if not uploaded_file:
            return Response({'banner': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        artwork.banner_image = self._store_upload(uploaded_file, 'artwork-banners')
        artwork.save(update_fields=['banner_image', 'updated_at'])
        return Response({'id': artwork.id, 'banner_image': artwork.banner_image}, status=status.HTTP_200_OK)


class ArtworkVersionViewSet(viewsets.ModelViewSet):
    queryset = ArtworkVersion.objects.select_related('artwork').all().order_by('-created_at')
    serializer_class = ArtworkVersionSerializer
    permission_classes = [IsArtistOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('artwork__title', 'change_note', 'markdown_statement')
    filterset_fields = ('ai_generated', 'artwork')
    ordering_fields = ('created_at', 'version_number')

    def perform_create(self, serializer):
        user = self.request.user
        artwork = serializer.validated_data['artwork']
        if not getattr(user, 'is_staff', False) and not getattr(user, 'is_superuser', False) and artwork.artist_id != user.id:
            raise PermissionDenied('You do not have permission to update this artwork statement.')

        with transaction.atomic():
            artwork = Artwork.objects.select_for_update().get(pk=artwork.pk)
            next_version = artwork.versions.order_by('-version_number').values_list('version_number', flat=True).first() or 0
            version = serializer.save(artwork=artwork, version_number=next_version + 1)
            artwork.current_version = version
            artwork.save(update_fields=['current_version', 'updated_at'])


class ArtworkImageViewSet(viewsets.ModelViewSet):
    queryset = ArtworkImage.objects.select_related('artwork').all().order_by('artwork', 'display_order')
    serializer_class = ArtworkImageSerializer
    permission_classes = [IsArtistOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('artwork__title', 'caption', 'image_url')
    filterset_fields = ('artwork',)
    ordering_fields = ('display_order', 'created_at')

    def perform_create(self, serializer):
        artwork = serializer.validated_data.get('artwork')
        user = self.request.user
        if artwork and artwork.artist_id != user.id and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to add images to this artwork.')
        serializer.save()


class ArtworkTagViewSet(viewsets.ModelViewSet):
    queryset = ArtworkTag.objects.select_related('artwork', 'tag').all()
    serializer_class = ArtworkTagSerializer
    permission_classes = [IsArtistOrReadOnly, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        artwork = serializer.validated_data.get('artwork')
        user = self.request.user
        if artwork and artwork.artist_id != user.id and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to tag this artwork.')
        serializer.save()
