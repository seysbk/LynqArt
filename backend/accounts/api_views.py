from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db.models import Q
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .permissions import IsArtistProfileOwnerOrAdmin, IsSelfOrAdmin
from notifications.models import Notification

from .models import ArtistProfile, ContactMessage, FeedbackMessage
from .serializers import (
    ArtistProfileSerializer,
    ContactMessageSerializer,
    FeedbackMessageSerializer,
    UserSearchSerializer,
    UserSerializer,
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('username', 'email', 'first_name', 'last_name')
    filterset_fields = ('is_artist', 'is_expert', 'is_verified', 'can_manage_exhibitions', 'is_active')
    ordering_fields = ('username', 'email', 'date_joined', 'created_at', 'updated_at')

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='search')
    def search_users(self, request):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response([], status=status.HTTP_200_OK)
        users = User.objects.filter(is_active=True).select_related('artist_profile').filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query)
        ).exclude(id=request.user.id)[:15]
        serializer = UserSearchSerializer(users, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


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


class FeedbackMessageViewSet(viewsets.ModelViewSet):
    queryset = FeedbackMessage.objects.select_related('user').all()
    serializer_class = FeedbackMessageSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'contact'

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def perform_create(self, serializer):
        feedback = serializer.save(
            user=self.request.user if self.request.user.is_authenticated else None,
            sender_name=serializer.validated_data.get('sender_name') or (
                self.request.user.get_full_name() if self.request.user.is_authenticated else ''
            ),
            sender_email=serializer.validated_data.get('sender_email') or (
                self.request.user.email if self.request.user.is_authenticated else ''
            ),
        )
        for staff_user in User.objects.filter(is_staff=True, is_active=True):
            Notification.objects.create(
                user=staff_user,
                title=f'New {feedback.get_category_display().lower()}',
                message=(
                    f'From: {feedback.sender_name or "Anonymous"}'
                    f'{f" ({feedback.sender_email})" if feedback.sender_email else ""}\n\n'
                    f'{feedback.message}'
                    f'{f"\n\nPage: {feedback.page_url}" if feedback.page_url else ""}'
                ),
                type='feedback',
                sender_email=feedback.sender_email,
            )
