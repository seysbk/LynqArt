from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets

from accounts.permissions import IsExpertOrReadOnly

from .models import ExpertReview
from .serializers import ExpertReviewSerializer


class ExpertReviewViewSet(viewsets.ModelViewSet):
    queryset = ExpertReview.objects.select_related('artwork', 'reviewer').all().order_by('-is_pinned', '-created_at')
    serializer_class = ExpertReviewSerializer
    permission_classes = [IsExpertOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'markdown_review', 'artwork__title', 'reviewer__username')
    filterset_fields = ('artwork', 'reviewer', 'rating', 'is_pinned')
    ordering_fields = ('created_at', 'rating')

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            return queryset.filter(reviewer=self.request.user)
        return queryset
