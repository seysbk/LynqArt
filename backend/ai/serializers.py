from rest_framework import serializers

from accounts.serializers import UserBriefSerializer
from artworks.serializers import ArtworkSerializer
from .models import AIGeneration


class AIGenerationSerializer(serializers.ModelSerializer):
    artwork_detail = ArtworkSerializer(source='artwork', read_only=True)
    user = UserBriefSerializer(read_only=True)

    class Meta:
        model = AIGeneration
        fields = (
            'id',
            'artwork',
            'artwork_detail',
            'user',
            'prompt',
            'generated_text',
            'model_used',
            'accepted',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')
