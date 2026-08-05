from django.contrib import admin

from .models import AIGeneration


@admin.register(AIGeneration)
class AIGenerationAdmin(admin.ModelAdmin):
    list_display = (
        'artwork',
        'user',
        'model_used',
        'accepted',
        'created_at',
    )
    list_filter = ('accepted', 'model_used', 'created_at')
    search_fields = (
        'artwork__title',
        'user__username',
        'prompt',
        'generated_text',
        'model_used',
    )
    autocomplete_fields = ('artwork', 'user')
    ordering = ('-created_at',)
