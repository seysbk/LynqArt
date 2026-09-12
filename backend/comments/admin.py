from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'reason', 'status', 'assigned_moderator', 'resolved_by', 'reporter', 'target_comment', 'target_artwork', 'target_expert_review')
    list_filter = ('status', 'reason', 'created_at')
    search_fields = ('details', 'moderator_notes', 'moderator_response', 'resolution', 'reporter__username')
    readonly_fields = ('id', 'created_at', 'updated_at')
    autocomplete_fields = ('reporter', 'assigned_moderator', 'resolved_by', 'target_comment', 'target_artwork', 'target_exhibition', 'target_expert_review', 'target_user')
from django.contrib import admin

from .models import Comment, Favorite, ModerationAction


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('artwork', 'user', 'parent_comment', 'created_at')
    list_filter = ('created_at',)
    search_fields = (
        'artwork__title',
        'user__username',
        'comment',
    )
    autocomplete_fields = ('artwork', 'user', 'parent_comment')
    ordering = ('-created_at',)


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'artwork', 'created_at')
    list_filter = ('created_at',)
    search_fields = (
        'user__username',
        'artwork__title',
    )
    autocomplete_fields = ('user', 'artwork')
    ordering = ('-created_at',)


@admin.register(ModerationAction)
class ModerationActionAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'action', 'actor', 'report')
    list_filter = ('action', 'created_at')
    search_fields = ('internal_note', 'public_response', 'actor__username')
    readonly_fields = ('id', 'created_at')
