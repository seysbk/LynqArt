from django.contrib.auth import get_user_model
from rest_framework import filters, permissions, viewsets

from .models import ArtistProfile
from .permissions import IsArtistProfileOwnerOrAdmin, IsSelfOrAdmin
from .serializers import ArtistProfileSerializer, UserSerializer

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('username', 'email', 'first_name', 'last_name')
    filterset_fields = ('is_artist', 'is_expert', 'is_verified', 'can_manage_exhibitions', 'is_active')
    ordering_fields = ('username', 'email', 'date_joined', 'created_at', 'updated_at')


class ArtistProfileViewSet(viewsets.ModelViewSet):
    queryset = ArtistProfile.objects.select_related('user').all().order_by('-created_at')
    serializer_class = ArtistProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsArtistProfileOwnerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('user__username', 'user__email', 'bio', 'location', 'website', 'instagram', 'twitter')
    filterset_fields = ('user',)
    ordering_fields = ('created_at', 'updated_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            return queryset.filter(user=self.request.user)
        return queryset
