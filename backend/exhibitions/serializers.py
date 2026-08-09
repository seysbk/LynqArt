from rest_framework import serializers

from django.contrib.auth import get_user_model

from accounts.serializers import UserBriefSerializer
from artworks.serializers import ArtworkSerializer
from .models import Exhibition, ExhibitionArtwork

User = get_user_model()


class ExhibitionArtworkSerializer(serializers.ModelSerializer):
    artwork_detail = ArtworkSerializer(source='artwork', read_only=True)

    class Meta:
        model = ExhibitionArtwork
        fields = ('id', 'exhibition', 'artwork', 'artwork_detail', 'display_order', 'is_featured', 'created_at')
        read_only_fields = ('id', 'created_at')


class ExhibitionSerializer(serializers.ModelSerializer):
    organizer = UserBriefSerializer(read_only=True)
    organizer_id = serializers.PrimaryKeyRelatedField(source='organizer', queryset=User.objects.all(), write_only=True)
    artworks = serializers.SerializerMethodField()

    class Meta:
        model = Exhibition
        fields = (
            'id',
            'organizer',
            'organizer_id',
            'title',
            'slug',
            'banner_image',
            'short_description',
            'markdown_description',
            'location',
            'start_date',
            'end_date',
            'status',
            'show_on_homepage',
            'is_featured',
            'created_at',
            'updated_at',
            'artworks',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_artworks(self, obj):
        qs = obj.exhibitionartwork_set.select_related('artwork').all().order_by('display_order')
        return ExhibitionArtworkSerializer(qs, many=True, context=self.context).data


class ExhibitionDetailSerializer(ExhibitionSerializer):
    class Meta(ExhibitionSerializer.Meta):
        fields = ExhibitionSerializer.Meta.fields
