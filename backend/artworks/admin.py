from django.contrib import admin

from .models import Artwork, ArtworkImage, ArtworkTag, ArtworkVersion, Category, Tag


class ArtworkImageInline(admin.TabularInline):
    model = ArtworkImage
    extra = 0
    fields = ('image_url', 'caption', 'display_order')
    ordering = ('display_order',)


class ArtworkVersionInline(admin.TabularInline):
    model = ArtworkVersion
    extra = 0
    fields = ('version_number', 'ai_generated', 'change_note', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ('-version_number',)


class ArtworkTagInline(admin.TabularInline):
    model = ArtworkTag
    extra = 0
    autocomplete_fields = ('tag',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Artwork)
class ArtworkAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'artist',
        'category',
        'status',
        'is_featured',
        'created_at',
    )
    list_filter = ('status', 'is_featured', 'allow_comments', 'category', 'created_at')
    search_fields = (
        'title',
        'slug',
        'artist__username',
        'artist__email',
        'description',
        'medium',
    )
    autocomplete_fields = ('artist', 'category', 'current_version')
    prepopulated_fields = {'slug': ('title',)}
    inlines = (ArtworkVersionInline, ArtworkImageInline, ArtworkTagInline)
    ordering = ('-created_at',)


@admin.register(ArtworkVersion)
class ArtworkVersionAdmin(admin.ModelAdmin):
    list_display = ('artwork', 'version_number', 'ai_generated', 'change_note', 'created_at')
    list_filter = ('ai_generated', 'created_at')
    search_fields = ('artwork__title', 'change_note', 'markdown_statement')
    autocomplete_fields = ('artwork',)
    ordering = ('-created_at',)


@admin.register(ArtworkImage)
class ArtworkImageAdmin(admin.ModelAdmin):
    list_display = ('artwork', 'display_order', 'caption', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('artwork__title', 'caption', 'image_url')
    autocomplete_fields = ('artwork',)
    ordering = ('artwork', 'display_order')


@admin.register(ArtworkTag)
class ArtworkTagAdmin(admin.ModelAdmin):
    list_display = ('artwork', 'tag')
    search_fields = ('artwork__title', 'tag__name')
    autocomplete_fields = ('artwork', 'tag')
