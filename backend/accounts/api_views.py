from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework import filters, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import ArtistProfile
from .permissions import IsArtistProfileOwnerOrAdmin, IsSelfOrAdmin
from notifications.models import Notification

from .models import ArtistProfile, ContactMessage
from .serializers import ArtistProfileSerializer, ContactMessageSerializer, UserSerializer

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
        user_lookup = self.request.query_params.get('user')
        if user_lookup:
            queryset = queryset.filter(user_id=user_lookup) | queryset.filter(user__username__iexact=user_lookup)
        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            return queryset.filter(user=self.request.user)
        return queryset

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field)
        queryset = self.filter_queryset(self.get_queryset())
        obj = queryset.filter(user_id=lookup).first() or queryset.filter(user__username__iexact=lookup).first()
        if not obj:
            from django.http import Http404
            raise Http404('Artist profile not found.')
        self.check_object_permissions(self.request, obj)
        return obj


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.select_related('artist', 'artwork').all()
    serializer_class = ContactMessageSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'contact'

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_staff or self.request.user.is_superuser:
            return queryset
        return queryset.filter(artist=self.request.user)

    def perform_create(self, serializer):
        inquiry = serializer.save()
        artwork_title = inquiry.artwork.title if inquiry.artwork else "your portfolio"
        
        # 1. Create in-app notification with sender_email
        Notification.objects.create(
            user=inquiry.artist,
            title=f'New {inquiry.get_inquiry_type_display()} from {inquiry.sender_name}',
            message=(
                f'From: {inquiry.sender_name} ({inquiry.sender_email})\n'
                f'Phone: {inquiry.sender_phone or "N/A"}\n'
                f'Target: {artwork_title}\n\n'
                f'Message:\n{inquiry.message}'
            ),
            type='inquiry',
            sender_email=inquiry.sender_email,
        )

        # 2. Dispatch Email to Artist
        from django.conf import settings
        from django.core.mail import EmailMessage

        subject = f'[LynqArt] {inquiry.get_inquiry_type_display()} regarding {artwork_title} from {inquiry.sender_name}'
        body = (
            f"You have received a new inquiry on LynqArt.\n\n"
            f"From: {inquiry.sender_name} ({inquiry.sender_email})\n"
            f"Phone: {inquiry.sender_phone or 'N/A'}\n"
            f"Inquiry Type: {inquiry.get_inquiry_type_display()}\n"
            f"Target Artwork/Portfolio: {artwork_title}\n\n"
            f"Message:\n{inquiry.message}\n\n"
            f"---\n"
            f"You can reply directly to this email or write to {inquiry.sender_email}."
        )
        try:
            from_addr = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@lynqart.local')
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=from_addr,
                to=[inquiry.artist.email],
                reply_to=[inquiry.sender_email],
            )
            email.send(fail_silently=False)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error(f"Failed to dispatch inquiry email to {inquiry.artist.email}: {exc}")

