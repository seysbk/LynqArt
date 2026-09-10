import os
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import models as db_models
from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from accounts.permissions import IsArtistOrReadOnly, IsOwnerOrReadOnly
from accounts.models import ArtistProfile
from config.security import validate_and_store_upload
from notifications.models import Notification

from .models import Artwork, ArtworkContributor, ArtworkImage, ArtworkTag, ArtworkVersion, Category, Tag
from .serializers import (
    ArtworkContributorSerializer,
    ArtworkImageSerializer,
    ArtworkSerializer,
    ArtworkTagSerializer,
    ArtworkVersionSerializer,
    CategorySerializer,
    TagSerializer,
)

User = get_user_model()


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsArtistOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name', 'slug')
    ordering_fields = ('name', 'created_at', 'updated_at')


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagSerializer
    permission_classes = [IsArtistOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name', 'slug')
    ordering_fields = ('name', 'created_at', 'updated_at')


class ArtworkViewSet(viewsets.ModelViewSet):
    queryset = Artwork.objects.select_related('artist', 'category', 'current_version').prefetch_related('versions', 'images', 'artwork_tags__tag').all().order_by('-created_at')
    serializer_class = ArtworkSerializer
    lookup_field = 'slug'
    permission_classes = [IsArtistOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'slug', 'description', 'medium', 'artist__username', 'artist__email', 'category__name')
    filterset_fields = ('status', 'is_featured', 'is_artist_featured', 'allow_comments', 'category', 'artist', 'artist_id')
    ordering_fields = ('created_at', 'updated_at', 'published_at', 'title')

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if request.method == 'GET' and response.status_code == 200:
            # The serialized contributor list includes pending invitations for the
            # artwork owner, so authenticated responses must never be shared with
            # another viewer by a public cache.
            response['Cache-Control'] = (
                'private, no-cache' if request.user.is_authenticated
                else 'public, max-age=60, s-maxage=300'
            )
        return response

    def perform_create(self, serializer):
        serializer.save(artist=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        artist_id = self.request.query_params.get('artist_id') or self.request.query_params.get('artist')
        contributor_id = self.request.query_params.get('contributor_id') or self.request.query_params.get('contributor')
        work_type = self.request.query_params.get('type')

        if artist_id:
            target_user = User.objects.filter(
                db_models.Q(id=artist_id) if len(str(artist_id)) == 36 else db_models.Q(username__iexact=artist_id)
            ).first()
            if target_user:
                if work_type in {'contributed', 'collaborative'}:
                    queryset = queryset.filter(contributors__user=target_user, contributors__status=ArtworkContributor.STATUS_ACCEPTED)
                else:
                    queryset = queryset.filter(artist=target_user)
            else:
                queryset = queryset.filter(artist_id=artist_id)
        elif contributor_id:
            target_user = User.objects.filter(
                db_models.Q(id=contributor_id) if len(str(contributor_id)) == 36 else db_models.Q(username__iexact=contributor_id)
            ).first()
            if target_user:
                queryset = queryset.filter(contributors__user=target_user, contributors__status=ArtworkContributor.STATUS_ACCEPTED)
            else:
                queryset = queryset.filter(contributors__user_id=contributor_id, contributors__status=ArtworkContributor.STATUS_ACCEPTED)

        user = self.request.user
        if not user.is_authenticated:
            queryset = queryset.filter(status=Artwork.STATUS_PUBLISHED)
        elif not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            queryset = queryset.filter(
                db_models.Q(artist=user) |
                db_models.Q(contributors__user=user, contributors__status=ArtworkContributor.STATUS_ACCEPTED) |
                db_models.Q(status=Artwork.STATUS_PUBLISHED)
            ).distinct()

        if self.action in {'update', 'partial_update', 'destroy'} and self.request.user.is_authenticated:
            if not (getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False)):
                return queryset.filter(artist=self.request.user)
        return queryset.distinct() if (artist_id or contributor_id) else queryset

    def _store_upload(self, uploaded_file, folder):
        _, url = validate_and_store_upload(uploaded_file, folder, max_size_mb=10)
        return url

    def _store_process_video(self, uploaded_file):
        allowed_extensions = {'.mp4', '.webm', '.mov'}
        extension = os.path.splitext(uploaded_file.name)[1].lower()
        if extension not in allowed_extensions:
            raise serializers.ValidationError('Unsupported video format. Use MP4, WebM, or MOV.')
        if uploaded_file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('Process video must be 10 MB or smaller.')
        content_type = (getattr(uploaded_file, 'content_type', '') or '').lower()
        if content_type and not content_type.startswith('video/'):
            raise serializers.ValidationError('The selected file must be a video.')
        saved_path = default_storage.save(f'artwork-process-videos/{uuid4().hex}{extension}', ContentFile(uploaded_file.read()))
        return default_storage.url(saved_path)

    @action(detail=True, methods=['post', 'delete'], url_path='upload_process_video', parser_classes=[MultiPartParser, FormParser])
    def upload_process_video(self, request, slug=None):
        artwork = self.get_object()
        if artwork.artist != request.user and not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to modify this artwork process video.')
        if request.method == 'DELETE':
            artwork.process_video_url = ''
        else:
            uploaded_file = request.FILES.get('video')
            if not uploaded_file:
                return Response({'video': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
            artwork.process_video_url = self._store_process_video(uploaded_file)
        artwork.save(update_fields=['process_video_url', 'updated_at'])
        return Response({'id': artwork.id, 'process_video_url': artwork.process_video_url})

    @action(
        detail=True,
        methods=['post'],
        url_path='upload_images',
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_images(self, request, slug=None):
        artwork = self.get_object()
        if artwork.artist != request.user and not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to upload images for this artwork.')

        uploaded_files = request.FILES.getlist('images') or request.FILES.getlist('image')
        if not uploaded_files:
            uploaded_file = request.FILES.get('image') or request.FILES.get('images')
            if uploaded_file:
                uploaded_files = [uploaded_file]

        if not uploaded_files:
            return Response({'image': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        caption = request.data.get('caption', '')
        display_order = int(request.data.get('display_order') or 0)

        created_images = []
        for idx, uploaded_file in enumerate(uploaded_files):
            image = ArtworkImage.objects.create(
                artwork=artwork,
                image_url=self._store_upload(uploaded_file, 'artworks'),
                caption=caption,
                display_order=display_order + idx,
            )
            created_images.append(image)

        if len(created_images) == 1:
            return Response(ArtworkImageSerializer(created_images[0], context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(ArtworkImageSerializer(created_images, many=True, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=['post', 'delete'],
        url_path='upload_banner',
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_banner(self, request, slug=None):
        artwork = self.get_object()
        if artwork.artist != request.user and not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to modify this artwork banner.')

        if request.method == 'DELETE':
            artwork.banner_image = ''
            artwork.save(update_fields=['banner_image', 'updated_at'])
            return Response({'id': artwork.id, 'banner_image': ''}, status=status.HTTP_200_OK)

        uploaded_file = request.FILES.get('banner')
        if not uploaded_file:
            return Response({'banner': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        artwork.banner_image = self._store_upload(uploaded_file, 'artwork-banners')
        artwork.save(update_fields=['banner_image', 'updated_at'])
        return Response({'id': artwork.id, 'banner_image': artwork.banner_image}, status=status.HTTP_200_OK)


class ArtworkVersionViewSet(viewsets.ModelViewSet):
    queryset = ArtworkVersion.objects.select_related('artwork').all().order_by('-created_at')
    serializer_class = ArtworkVersionSerializer
    permission_classes = [IsArtistOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('artwork__title', 'change_note', 'markdown_statement')
    filterset_fields = ('ai_generated', 'artwork')
    ordering_fields = ('created_at', 'version_number')

    def perform_create(self, serializer):
        user = self.request.user
        artwork = serializer.validated_data['artwork']
        if not getattr(user, 'is_staff', False) and not getattr(user, 'is_superuser', False) and artwork.artist_id != user.id:
            raise PermissionDenied('You do not have permission to update this artwork statement.')

        with transaction.atomic():
            artwork = Artwork.objects.select_for_update().get(pk=artwork.pk)
            next_version = artwork.versions.order_by('-version_number').values_list('version_number', flat=True).first() or 0
            version = serializer.save(artwork=artwork, version_number=next_version + 1)
            artwork.current_version = version
            artwork.save(update_fields=['current_version', 'updated_at'])


class ArtworkImageViewSet(viewsets.ModelViewSet):
    queryset = ArtworkImage.objects.select_related('artwork').all().order_by('artwork', 'display_order')
    serializer_class = ArtworkImageSerializer
    permission_classes = [IsArtistOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('artwork__title', 'caption', 'image_url')
    filterset_fields = ('artwork',)
    ordering_fields = ('display_order', 'created_at')

    def perform_create(self, serializer):
        artwork = serializer.validated_data.get('artwork')
        user = self.request.user
        if artwork and artwork.artist_id != user.id and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to add images to this artwork.')
        serializer.save()


class ArtworkTagViewSet(viewsets.ModelViewSet):
    queryset = ArtworkTag.objects.select_related('artwork', 'tag').all()
    serializer_class = ArtworkTagSerializer
    permission_classes = [IsArtistOrReadOnly, IsOwnerOrReadOnly]

    def perform_create(self, serializer):
        artwork = serializer.validated_data.get('artwork')
        user = self.request.user
        if artwork and artwork.artist_id != user.id and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to tag this artwork.')
        serializer.save()


class ArtworkContributorViewSet(viewsets.ModelViewSet):
    queryset = ArtworkContributor.objects.select_related('artwork', 'user', 'user__artist_profile').all().order_by('-created_at')
    serializer_class = ArtworkContributorSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ('artwork', 'status', 'user')

    def get_queryset(self):
        queryset = super().get_queryset()
        artwork_param = self.request.query_params.get('artwork')
        if artwork_param:
            queryset = queryset.filter(
                db_models.Q(artwork_id=artwork_param) | db_models.Q(artwork__slug=artwork_param)
            )

        # Accepted collaborators are public attribution data. Pending and
        # declined invitations are private, and should only be visible to the
        # lead artist, the invited user, or an administrator.
        if not self.request.user.is_authenticated:
            return queryset.filter(status=ArtworkContributor.STATUS_ACCEPTED)
        if getattr(self.request.user, 'is_staff', False) or getattr(self.request.user, 'is_superuser', False):
            return queryset
        return queryset.filter(
            db_models.Q(status=ArtworkContributor.STATUS_ACCEPTED) |
            db_models.Q(artwork__artist=self.request.user) |
            db_models.Q(user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        artwork_id = self.request.data.get('artwork_id') or self.request.data.get('artwork')
        if not artwork_id:
            raise serializers.ValidationError({'artwork': 'Artwork is required.'})

        try:
            if len(str(artwork_id)) == 36:
                artwork = Artwork.objects.get(pk=artwork_id)
            else:
                artwork = Artwork.objects.get(slug=artwork_id)
        except Artwork.DoesNotExist:
            raise serializers.ValidationError({'artwork': 'Artwork not found.'})

        if artwork.artist_id != user.id and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            raise PermissionDenied('Only the lead artist can add contributors to this artwork.')

        target_user_id = self.request.data.get('user_id') or self.request.data.get('user')
        if not target_user_id:
            raise serializers.ValidationError({'user_id': 'Target user is required.'})

        try:
            target_user = User.objects.get(pk=target_user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({'user_id': 'User not found.'})

        if target_user.id == artwork.artist_id:
            raise serializers.ValidationError({'user_id': 'The lead artist is already the primary owner of this artwork.'})

        if ArtworkContributor.objects.filter(artwork=artwork, user=target_user).exists():
            raise serializers.ValidationError({'user_id': 'This user is already added or invited as a contributor to this artwork.'})

        role = serializer.validated_data.get('contribution_role', '').strip() or 'Co-Artist'
        contributor = serializer.save(artwork=artwork, user=target_user, contribution_role=role, status=ArtworkContributor.STATUS_PENDING)

        Notification.objects.create(
            user=target_user,
            title=f'Collaboration Invitation: {artwork.title}',
            message=f'You have been invited by {user.get_full_name() or user.username} to contribute to "{artwork.title}" as {role}.',
            type='collaboration_invite',
            sender_email=user.email,
        )

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.artwork.artist_id != user.id and instance.user_id != user.id and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            raise PermissionDenied('You do not have permission to remove this contributor.')
        instance.delete()

    def perform_update(self, serializer):
        user = self.request.user
        artwork = serializer.instance.artwork
        if artwork.artist_id != user.id and not (getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            raise PermissionDenied('Only the lead artist can edit contributor details.')
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def accept(self, request, pk=None):
        contributor = self.get_object()
        if contributor.user_id != request.user.id and not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False)):
            raise PermissionDenied('Only the invited contributor can accept this invitation.')
        if contributor.status != ArtworkContributor.STATUS_PENDING:
            return Response({'detail': 'This invitation has already been answered.'}, status=status.HTTP_400_BAD_REQUEST)

        contributor.status = ArtworkContributor.STATUS_ACCEPTED
        contributor.responded_at = timezone.now()
        contributor.save(update_fields=['status', 'responded_at'])

        # A collaborator does not need to be an artist before accepting an
        # invitation. Creating the empty profile here makes the accepted work
        # discoverable from their public profile immediately.
        ArtistProfile.objects.get_or_create(user=contributor.user)

        Notification.objects.create(
            user=contributor.artwork.artist,
            title=f'Invitation Accepted: {contributor.artwork.title}',
            message=f'{request.user.get_full_name() or request.user.username} accepted your invitation to contribute as {contributor.contribution_role} on "{contributor.artwork.title}".',
            type='collaboration_accepted',
            sender_email=request.user.email,
        )

        return Response(ArtworkContributorSerializer(contributor, context={'request': request}).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def decline(self, request, pk=None):
        contributor = self.get_object()
        if contributor.user_id != request.user.id and not (getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False)):
            raise PermissionDenied('Only the invited contributor can decline this invitation.')
        if contributor.status != ArtworkContributor.STATUS_PENDING:
            return Response({'detail': 'This invitation has already been answered.'}, status=status.HTTP_400_BAD_REQUEST)

        contributor.status = ArtworkContributor.STATUS_DECLINED
        contributor.responded_at = timezone.now()
        contributor.save(update_fields=['status', 'responded_at'])

        Notification.objects.create(
            user=contributor.artwork.artist,
            title=f'Invitation Declined: {contributor.artwork.title}',
            message=f'{request.user.get_full_name() or request.user.username} declined your invitation to contribute as {contributor.contribution_role} on "{contributor.artwork.title}".',
            type='collaboration_declined',
            sender_email=request.user.email,
        )

        return Response(ArtworkContributorSerializer(contributor, context={'request': request}).data, status=status.HTTP_200_OK)
