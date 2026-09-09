from rest_framework import serializers

from accounts.serializers import UserBriefSerializer
from artworks.serializers import ArtworkBriefSerializer
from .models import Comment, Favorite, Report


class CommentSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    artwork_detail = ArtworkBriefSerializer(source='artwork', read_only=True)
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


class ReportSerializer(serializers.ModelSerializer):
    target_label = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = (
            'id', 'reporter', 'reporter_ip', 'target_comment', 'target_artwork',
            'target_exhibition', 'target_expert_review', 'target_user', 'reason', 'details', 'status',
            'moderator_notes', 'target_label', 'created_at',
        )
        read_only_fields = ('id', 'reporter', 'reporter_ip', 'status', 'moderator_notes', 'created_at')

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            fields['status'].read_only = False
            fields['moderator_notes'].read_only = False
        return fields

    def validate(self, attrs):
        targets = [
            attrs.get(field, getattr(self.instance, field, None))
            for field in ('target_comment', 'target_artwork', 'target_exhibition', 'target_expert_review', 'target_user')
        ]
        if sum(target is not None for target in targets) != 1:
            raise serializers.ValidationError('Select exactly one piece of content to report.')
        return attrs

    def get_target_label(self, obj):
        if obj.target_artwork:
            return f'Artwork: {obj.target_artwork.title}'
        if obj.target_exhibition:
            return f'Exhibition: {obj.target_exhibition.title}'
        if obj.target_comment:
            return f'Comment: {obj.target_comment.comment[:120]}'
        if obj.target_expert_review:
            return f'Expert review: {obj.target_expert_review.title}'
        if obj.target_user:
            return f'User: {obj.target_user.get_full_name() or obj.target_user.username}'
        return 'Unknown content'
