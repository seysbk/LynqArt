import os
from uuid import uuid4

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from accounts.permissions import IsCanManageExhibitionsOrReadOnly, IsOwnerOrReadOnly

from .models import Exhibition, ExhibitionArtwork
from .serializers import ExhibitionArtworkSerializer, ExhibitionSerializer


class ExhibitionViewSet(viewsets.ModelViewSet):
    queryset = Exhibition.objects.select_related('organizer').prefetch_related('exhibitionartwork_set__artwork').all().order_by('-created_at')
    serializer_class = ExhibitionSerializer
    lookup_field = 'slug'
    permission_classes = [IsCanManageExhibitionsOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'slug', 'location', 'short_description', 'markdown_description', 'organizer__username')
    filterset_fields = ('status', 'show_on_homepage', 'is_featured')
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
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            return queryset.filter(organizer=self.request.user)
        return queryset

    @action(detail=True, methods=['post', 'delete'], parser_classes=[MultiPartParser, FormParser])
    def upload_banner(self, request, slug=None):
        exhibition = self.get_object()
        if request.method == 'DELETE':
            exhibition.banner_image = ''
            exhibition.save(update_fields=['banner_image', 'updated_at'])
            return Response({'id': exhibition.id, 'banner_image': ''}, status=status.HTTP_200_OK)

        uploaded_file = request.FILES.get('banner')
        if not uploaded_file:
            return Response({'banner': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        _, extension = os.path.splitext(uploaded_file.name)
        path = default_storage.save(f'exhibition-banners/{uuid4().hex}{extension.lower()}', ContentFile(uploaded_file.read()))
        exhibition.banner_image = default_storage.url(path)
        exhibition.save(update_fields=['banner_image', 'updated_at'])
        return Response({'id': exhibition.id, 'banner_image': exhibition.banner_image})


class ExhibitionArtworkViewSet(viewsets.ModelViewSet):
    queryset = ExhibitionArtwork.objects.select_related('exhibition', 'artwork').all().order_by('display_order')
    serializer_class = ExhibitionArtworkSerializer
    permission_classes = [IsCanManageExhibitionsOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ('exhibition', 'artwork', 'is_featured')
    ordering_fields = ('display_order', 'created_at')

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.method in permissions.SAFE_METHODS and self.request.user.is_authenticated and not self.request.user.can_manage_exhibitions:
            return queryset.none()
        return queryset
