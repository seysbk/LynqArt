from rest_framework import serializers

from accounts.serializers import UserBriefSerializer
from artworks.serializers import ArtworkSerializer
from .models import Comment, Favorite


class CommentSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    artwork_detail = ArtworkSerializer(source='artwork', read_only=True)
    parent_comment_detail = serializers.StringRelatedField(source='parent_comment', read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = (
            'id',
            'artwork',
            'artwork_detail',
            'user',
            'parent_comment',
            'parent_comment_detail',
            'comment',
            'replies',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_replies(self, obj):
        return CommentSerializer(obj.replies.select_related('artwork', 'user', 'parent_comment').all(), many=True, context=self.context).data


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ('id', 'user', 'artwork', 'created_at')
        read_only_fields = ('id', 'created_at')
