from rest_framework import serializers

from accounts.serializers import UserBriefSerializer
from artworks.serializers import ArtworkBriefSerializer
from .models import Comment, Favorite, ModerationAction, Report


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
    assigned_moderator_detail = UserBriefSerializer(source='assigned_moderator', read_only=True)
    resolved_by_detail = UserBriefSerializer(source='resolved_by', read_only=True)
    actions = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = (
            'id', 'reporter', 'reporter_ip', 'target_comment', 'target_artwork',
            'target_exhibition', 'target_expert_review', 'target_user', 'reason', 'details', 'status',
            'moderator_notes', 'assigned_moderator', 'assigned_moderator_detail',
            'moderator_response', 'resolution', 'resolved_by_detail', 'resolved_at',
            'actions', 'target_label', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'reporter', 'reporter_ip', 'status', 'moderator_notes',
            'assigned_moderator', 'assigned_moderator_detail', 'moderator_response',
            'resolution', 'resolved_by_detail', 'resolved_at', 'actions',
            'created_at', 'updated_at',
        )

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and request.user.is_authenticated and (
            getattr(request.user, 'is_moderator', False) or request.user.is_staff or request.user.is_superuser
        ):
            fields['status'].read_only = False
            fields['moderator_notes'].read_only = False
            fields['assigned_moderator'].read_only = False
            fields['moderator_response'].read_only = False
            fields['resolution'].read_only = False
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

    def get_actions(self, obj):
        return ModerationActionSerializer(obj.actions.select_related('actor').all(), many=True, context=self.context).data


class ModerationActionSerializer(serializers.ModelSerializer):
    actor = UserBriefSerializer(read_only=True)
    status = serializers.ChoiceField(choices=Report.STATUS_CHOICES, write_only=True, required=False)

    class Meta:
        model = ModerationAction
        fields = ('id', 'actor', 'action', 'status', 'internal_note', 'public_response', 'created_at')
        read_only_fields = ('id', 'actor', 'created_at')
