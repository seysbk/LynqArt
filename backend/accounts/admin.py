from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_artist', 'is_expert', 'is_staff', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Permissions', {'fields': ('is_artist', 'is_expert', 'is_verified')}),
    )
