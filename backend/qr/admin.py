from django.contrib import admin

from .models import QRCode, QRScan


@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ('qr_slug', 'entity_type', 'entity_id', 'scans', 'created_at')
    list_filter = ('entity_type', 'created_at')
    search_fields = ('qr_slug', 'entity_id')
    ordering = ('-created_at',)


@admin.register(QRScan)
class QRScanAdmin(admin.ModelAdmin):
    list_display = ('qr_code', 'visitor_hash', 'scanned_at')
    list_filter = ('scanned_at',)
    search_fields = ('qr_code__qr_slug', 'visitor_hash')
    autocomplete_fields = ('qr_code',)
    ordering = ('-scanned_at',)
