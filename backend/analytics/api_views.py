from rest_framework import filters, permissions, viewsets

from accounts.permissions import IsArtistOrReadOnly

from .models import ArtworkView
from .serializers import ArtworkViewSerializer


class ArtworkViewViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ArtworkView.objects.select_related('artwork').all().order_by('-viewed_at')
    serializer_class = ArtworkViewSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('artwork__title', 'visitor_hash', 'viewed_from')
    filterset_fields = ('artwork', 'viewed_from')
    ordering_fields = ('viewed_at',)
