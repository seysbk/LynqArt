from rest_framework import serializers

from artworks.serializers import ArtworkSerializer
from .models import ArtworkView


class ArtworkViewSerializer(serializers.ModelSerializer):
    artwork_detail = ArtworkSerializer(source='artwork', read_only=True)

    class Meta:
        model = ArtworkView
        fields = ('id', 'artwork', 'artwork_detail', 'source', 'viewed_at')
        read_only_fields = ('id', 'viewed_at')
