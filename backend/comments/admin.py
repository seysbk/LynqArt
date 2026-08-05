from django.contrib import admin

from .models import Comment, Favorite


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
