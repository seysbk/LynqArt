from rest_framework import filters, permissions, viewsets

from accounts.permissions import IsArtistOrReadOnly

from .models import AIGeneration
from .serializers import AIGenerationSerializer


class AIGenerationViewSet(viewsets.ModelViewSet):
    queryset = AIGeneration.objects.select_related('artwork', 'user').all().order_by('-created_at')
    serializer_class = AIGenerationSerializer
    permission_classes = [IsArtistOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('prompt', 'generated_text', 'model_used', 'artwork__title', 'user__username')
    filterset_fields = ('accepted', 'model_used', 'artwork', 'user')
    ordering_fields = ('created_at',)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_authenticated and not self.request.user.is_staff:
            return queryset.filter(user=self.request.user)
        return queryset
