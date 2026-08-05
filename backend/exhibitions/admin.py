from django.contrib import admin

from .models import Exhibition, ExhibitionArtwork


class ExhibitionArtworkInline(admin.TabularInline):
    model = ExhibitionArtwork
    extra = 0
    fields = ('artwork', 'display_order', 'is_featured')
    autocomplete_fields = ('artwork',)
    ordering = ('display_order',)


@admin.register(Exhibition)
class ExhibitionAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'organizer',
        'status',
        'start_date',
        'end_date',
        'show_on_homepage',
        'is_featured',
        'created_at',
    )
    list_filter = ('status', 'is_featured', 'created_at')
    search_fields = ('title', 'slug', 'organizer__username', 'organizer__email', 'location')
    prepopulated_fields = {'slug': ('title',)}
    autocomplete_fields = ('organizer',)
    inlines = (ExhibitionArtworkInline,)
    ordering = ('-created_at',)


@admin.register(ExhibitionArtwork)
class ExhibitionArtworkAdmin(admin.ModelAdmin):
    list_display = ('exhibition', 'artwork', 'display_order', 'is_featured')
    list_filter = ('exhibition', 'is_featured')
    search_fields = ('exhibition__title', 'artwork__title')
    autocomplete_fields = ('exhibition', 'artwork')
