from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ArtistProfile, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        'username',
        'email',
        'is_artist',
        'is_expert',
        'is_verified',
        'is_staff',
        'is_active',
    )
    list_filter = ('is_artist', 'is_expert', 'is_verified', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fieldsets = UserAdmin.fieldsets + (
        (
            'Profile Flags',
            {'fields': ('is_artist', 'is_expert', 'is_verified', 'can_manage_exhibitions')},
        ),
        ('Audit', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ArtistProfile)
class ArtistProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'location', 'website', 'created_at')
    search_fields = ('user__username', 'user__email', 'bio', 'location')
    autocomplete_fields = ('user',)
    readonly_fields = ('created_at', 'updated_at')
