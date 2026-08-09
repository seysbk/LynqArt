from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets

from accounts.permissions import IsCanManageExhibitionsOrReadOnly, IsOwnerOrReadOnly

from .models import Exhibition, ExhibitionArtwork
from .serializers import ExhibitionArtworkSerializer, ExhibitionSerializer


class ExhibitionViewSet(viewsets.ModelViewSet):
    queryset = Exhibition.objects.select_related('organizer').prefetch_related('exhibitionartwork_set__artwork').all().order_by('-created_at')
    serializer_class = ExhibitionSerializer
    permission_classes = [IsCanManageExhibitionsOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'slug', 'location', 'short_description', 'markdown_description', 'organizer__username')
    filterset_fields = ('status', 'show_on_homepage', 'is_featured')
    ordering_fields = ('created_at', 'updated_at', 'start_date', 'end_date', 'title')

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            return queryset.filter(organizer=self.request.user)
        return queryset


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
