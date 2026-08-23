from rest_framework import serializers

from django.contrib.auth import get_user_model
from django.utils.text import slugify

from accounts.serializers import UserBriefSerializer
from .models import Artwork, ArtworkImage, ArtworkTag, ArtworkVersion, Category, Tag

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
        read_only_fields = ('id', 'created_at')


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
            'is_process_image',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')


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
            'year_created',
            'dimensions',
            'status',
            'allow_comments',
            'is_featured',
            'created_at',
            'updated_at',
            'published_at',
            'versions',
            'images',
            'tags',
            'tag_ids',
        )
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at')

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
