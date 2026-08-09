import os
from uuid import uuid4

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from accounts.permissions import IsArtistOrReadOnly

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
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name', 'slug')
    ordering_fields = ('name', 'created_at', 'updated_at')


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name', 'slug')
    ordering_fields = ('name', 'created_at', 'updated_at')


class ArtworkViewSet(viewsets.ModelViewSet):
    queryset = Artwork.objects.select_related('artist', 'category', 'current_version').prefetch_related('versions', 'images', 'artwork_tags__tag').all().order_by('-created_at')
    serializer_class = ArtworkSerializer
    permission_classes = [IsArtistOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'slug', 'description', 'medium', 'artist__username', 'artist__email', 'category__name')
    filterset_fields = ('status', 'is_featured', 'allow_comments', 'category')
    ordering_fields = ('created_at', 'updated_at', 'published_at', 'title')

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            return queryset.filter(artist=self.request.user)
        return queryset

    def _store_upload(self, uploaded_file, folder):
        _, extension = os.path.splitext(uploaded_file.name)
        storage_name = f'{folder}/{uuid4().hex}{extension.lower()}'
        saved_path = default_storage.save(storage_name, ContentFile(uploaded_file.read()))
        return default_storage.url(saved_path)

    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_images(self, request, pk=None):
        artwork = self.get_object()
        uploaded_file = request.FILES.get('image')
        if not uploaded_file:
            return Response({'image': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        image = ArtworkImage.objects.create(
            artwork=artwork,
            image_url=self._store_upload(uploaded_file, 'artworks'),
            caption=request.data.get('caption', ''),
            display_order=int(request.data.get('display_order') or 0),
            is_process_image=str(request.data.get('is_process_image', '')).lower() in {'1', 'true', 'yes', 'on'},
        )
        return Response(ArtworkImageSerializer(image, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_banner(self, request, pk=None):
        artwork = self.get_object()
        uploaded_file = request.FILES.get('banner')
        if not uploaded_file:
            return Response({'banner': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        artwork.banner_image = self._store_upload(uploaded_file, 'artwork-banners')
        artwork.save(update_fields=['banner_image', 'updated_at'])
        return Response({'id': artwork.id, 'banner_image': artwork.banner_image}, status=status.HTTP_200_OK)


class ArtworkVersionViewSet(viewsets.ModelViewSet):
    queryset = ArtworkVersion.objects.select_related('artwork').all().order_by('-created_at')
    serializer_class = ArtworkVersionSerializer
    permission_classes = [IsArtistOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('artwork__title', 'change_note', 'markdown_statement')
    filterset_fields = ('ai_generated', 'artwork')
    ordering_fields = ('created_at', 'version_number')

    def perform_create(self, serializer):
        serializer.save()


class ArtworkImageViewSet(viewsets.ModelViewSet):
    queryset = ArtworkImage.objects.select_related('artwork').all().order_by('artwork', 'display_order')
    serializer_class = ArtworkImageSerializer
    permission_classes = [IsArtistOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('artwork__title', 'caption', 'image_url')
    filterset_fields = ('is_process_image', 'artwork')
    ordering_fields = ('display_order', 'created_at')

    def perform_create(self, serializer):
        serializer.save()


class ArtworkTagViewSet(viewsets.ModelViewSet):
    queryset = ArtworkTag.objects.select_related('artwork', 'tag').all()
    serializer_class = ArtworkTagSerializer
    permission_classes = [IsArtistOrReadOnly]

    def perform_create(self, serializer):
        serializer.save()
