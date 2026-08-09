from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsOwnerOrReadOnly

from .models import Comment, Favorite
from .serializers import CommentSerializer, FavoriteSerializer


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.select_related('artwork', 'user', 'parent_comment').all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('comment', 'artwork__title', 'user__username')
    filterset_fields = ('artwork', 'user', 'parent_comment')
    ordering_fields = ('created_at', 'updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            return queryset.filter(user=self.request.user)
        return queryset


class FavoriteViewSet(viewsets.ModelViewSet):
    queryset = Favorite.objects.select_related('artwork', 'user').all().order_by('-created_at')
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ('artwork', 'user')
    ordering_fields = ('created_at',)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    @action(detail=False, methods=['post', 'delete'])
    def by_artwork(self, request):
        artwork_id = request.data.get('artwork_id') or request.query_params.get('artwork_id')
        if not artwork_id:
            return Response({'artwork_id': 'This parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'POST':
            favorite, created = Favorite.objects.get_or_create(user=request.user, artwork_id=artwork_id)
            return Response(FavoriteSerializer(favorite, context={'request': request}).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        else:
            deleted_count, _ = Favorite.objects.filter(user=request.user, artwork_id=artwork_id).delete()
            if deleted_count == 0:
                return Response({'detail': 'Favorite not found.'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'detail': 'Favorite removed.'}, status=status.HTTP_204_NO_CONTENT)
