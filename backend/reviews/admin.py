from django.contrib import admin

from .models import ExpertReview


@admin.register(ExpertReview)
class ExpertReviewAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'artwork',
        'reviewer',
        'rating',
        'is_pinned',
        'created_at',
    )
    list_filter = ('rating', 'is_pinned', 'created_at')
    search_fields = (
        'title',
        'artwork__title',
        'reviewer__username',
        'markdown_review',
    )
    autocomplete_fields = ('artwork', 'reviewer')
    ordering = ('-created_at',)
