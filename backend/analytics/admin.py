from django.contrib import admin

from .models import ArtworkView


@admin.register(ArtworkView)
class ArtworkViewAdmin(admin.ModelAdmin):
    list_display = (
        'artwork',
        'visitor_hash',
        'viewed_from',
        'viewed_at',
    )
    list_filter = ('viewed_at', 'viewed_from')
    search_fields = (
        'artwork__title',
        'visitor_hash',
        'viewed_from',
        'user_agent',
    )
    autocomplete_fields = ('artwork',)
    ordering = ('-viewed_at',)
