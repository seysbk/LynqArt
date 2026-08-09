from rest_framework import serializers

from accounts.serializers import UserBriefSerializer
from artworks.serializers import ArtworkSerializer
from .models import ExpertReview


class ExpertReviewSerializer(serializers.ModelSerializer):
    artwork_detail = ArtworkSerializer(source='artwork', read_only=True)
    reviewer = UserBriefSerializer(read_only=True)

    class Meta:
        model = ExpertReview
        fields = (
            'id',
            'artwork',
            'artwork_detail',
            'reviewer',
            'title',
            'markdown_review',
            'rating',
            'is_pinned',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def validate_rating(self, value):
        if value < 0 or value > 5:
            raise serializers.ValidationError('Rating must be between 0 and 5.')
        return value
