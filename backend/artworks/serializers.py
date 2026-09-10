from rest_framework import serializers

from django.contrib.auth import get_user_model
from django.utils.text import slugify

from accounts.serializers import UserBriefSerializer
from .models import Artwork, ArtworkContributor, ArtworkImage, ArtworkTag, ArtworkVersion, Category, Tag

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug')
        read_only_fields = ('id',)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name', 'slug')
        read_only_fields = ('id',)


class ArtworkVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtworkVersion
        fields = (
            'id',
            'artwork',
            'version_number',
            'markdown_statement',
            'rendered_html',
            'ai_generated',
            'change_note',
            'created_at',
        )
        read_only_fields = ('id', 'created_at', 'version_number')


class ArtworkImageSerializer(serializers.ModelSerializer):
    image_url = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = ArtworkImage
        fields = (
            'id',
            'artwork',
            'image_url',
            'caption',
            'display_order',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')


class ArtworkBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artwork
        fields = ('id', 'title', 'slug')
        read_only_fields = fields


class ArtworkContributorSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source='user', queryset=User.objects.all(), write_only=True)
    artwork = ArtworkBriefSerializer(read_only=True)
    artwork_id = serializers.PrimaryKeyRelatedField(source='artwork', queryset=Artwork.objects.all(), write_only=True, required=False)

    class Meta:
        model = ArtworkContributor
        fields = (
            'id',
            'artwork',
            'artwork_id',
            'user',
            'user_id',
            'contribution_role',
            'is_lead',
            'status',
            'created_at',
            'responded_at',
        )
        read_only_fields = ('id', 'status', 'created_at', 'responded_at', 'artwork')


class ArtworkTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtworkTag
        fields = ('artwork', 'tag')


class ArtworkSerializer(serializers.ModelSerializer):
    artist = UserBriefSerializer(read_only=True)
    artist_id = serializers.PrimaryKeyRelatedField(source='artist', queryset=User.objects.all(), write_only=True, required=False)
    category_detail = CategorySerializer(source='category', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(source='category', queryset=Category.objects.all(), write_only=True, required=False, allow_null=True)
    current_version_detail = ArtworkVersionSerializer(source='current_version', read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(queryset=Tag.objects.all(), many=True, write_only=True, required=False)
    versions = ArtworkVersionSerializer(many=True, read_only=True)
    images = ArtworkImageSerializer(many=True, read_only=True)
    tags = serializers.SerializerMethodField()
    accepted_contributors = serializers.SerializerMethodField()
    contributors = serializers.SerializerMethodField()

    class Meta:
        model = Artwork
        fields = (
            'id',
            'artist',
            'artist_id',
            'category_detail',
            'category_id',
            'current_version_detail',
            'title',
            'slug',
            'description',
            'medium',
            'banner_image',
            'process_video_url',
            'year_created',
            'dimensions',
            'status',
            'allow_comments',
            'is_featured',
            'is_artist_featured',
            'availability_status',
            'copyright_holder',
            'copyright_confirmed',
            'license_type',
            'provenance_notes',
            'created_at',
            'updated_at',
            'published_at',
            'versions',
            'images',
            'tags',
            'tag_ids',
            'accepted_contributors',
            'contributors',
        )
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at', 'process_video_url')

    def get_accepted_contributors(self, obj):
        contributors = obj.contributors.filter(status=ArtworkContributor.STATUS_ACCEPTED).select_related('user', 'user__artist_profile')
        res = []
        for c in contributors:
            user_data = UserBriefSerializer(c.user, context=self.context).data
            avatar_url = ''
            if hasattr(c.user, 'artist_profile') and c.user.artist_profile.avatar_url:
                avatar_url = c.user.artist_profile.avatar_url
            user_data['avatar_url'] = avatar_url
            res.append({
                'id': c.id,
                'user': user_data,
                'contribution_role': c.contribution_role,
                'is_lead': c.is_lead,
                'status': c.status,
                'created_at': c.created_at,
            })
        return res

    def get_contributors(self, obj):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        if user and (user.id == obj.artist_id or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False)):
            contributors = obj.contributors.select_related('user', 'user__artist_profile').all()
        else:
            contributors = obj.contributors.filter(status=ArtworkContributor.STATUS_ACCEPTED).select_related('user', 'user__artist_profile').all()
        res = []
        for c in contributors:
            user_data = UserBriefSerializer(c.user, context=self.context).data
            avatar_url = ''
            if hasattr(c.user, 'artist_profile') and c.user.artist_profile.avatar_url:
                avatar_url = c.user.artist_profile.avatar_url
            user_data['avatar_url'] = avatar_url
            res.append({
                'id': c.id,
                'user': user_data,
                'contribution_role': c.contribution_role,
                'is_lead': c.is_lead,
                'status': c.status,
                'created_at': c.created_at,
                'responded_at': c.responded_at,
            })
        return res

    def _unique_slug(self, title, instance_id=None):
        base = slugify(title) or 'artwork'
        candidate, number = base, 1
        queryset = Artwork.objects.all()
        if instance_id:
            queryset = queryset.exclude(pk=instance_id)
        while queryset.filter(slug=candidate).exists():
            candidate = f'{base}-{number}'
            number += 1
        return candidate

    def get_tags(self, obj):
        tags = [artwork_tag.tag for artwork_tag in obj.artwork_tags.select_related('tag').all()]
        return TagSerializer(tags, many=True, context=self.context).data

    def _sync_tags(self, artwork, tags):
        ArtworkTag.objects.filter(artwork=artwork).delete()
        ArtworkTag.objects.bulk_create(
            [ArtworkTag(artwork=artwork, tag=tag) for tag in tags]
        )

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        validated_data['slug'] = self._unique_slug(validated_data['title'])
        artwork = super().create(validated_data)
        if tag_ids:
            self._sync_tags(artwork, tag_ids)
        return artwork

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        if 'title' in validated_data and validated_data['title'] != instance.title:
            validated_data['slug'] = self._unique_slug(validated_data['title'], instance.pk)
        artwork = super().update(instance, validated_data)
        if tag_ids is not None:
            self._sync_tags(artwork, tag_ids)
        return artwork

    def validate(self, attrs):
        from django.utils import timezone
        status = attrs.get('status', getattr(self.instance, 'status', Artwork.STATUS_DRAFT))
        published_at = attrs.get('published_at', getattr(self.instance, 'published_at', None))
        if status == Artwork.STATUS_PUBLISHED and published_at is None:
            attrs['published_at'] = timezone.now()
        return attrs


class ArtworkTagAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtworkTag
        fields = ('artwork', 'tag')


class ArtworkDetailSerializer(ArtworkSerializer):
    class Meta(ArtworkSerializer.Meta):
        fields = ArtworkSerializer.Meta.fields
