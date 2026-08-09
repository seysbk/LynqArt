import uuid

from django.db import models


class QRCode(models.Model):
    ENTITY_ARTWORK = 'artwork'
    ENTITY_EXHIBITION = 'exhibition'

    ENTITY_TYPE_CHOICES = [
        (ENTITY_ARTWORK, 'Artwork'),
        (ENTITY_EXHIBITION, 'Exhibition'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entity_type = models.CharField(max_length=50, choices=ENTITY_TYPE_CHOICES, blank=True, default='')
    entity_id = models.UUIDField(null=True, blank=True)
    qr_slug = models.SlugField(max_length=255, unique=True)
    qr_image_path = models.CharField(max_length=500, blank=True, default='')
    qr_image_url = models.URLField(blank=True, default='')
    scans = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.entity_type}:{self.qr_slug}'


class QRScan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    qr_code = models.ForeignKey(QRCode, on_delete=models.CASCADE, related_name='qr_scans')
    visitor_hash = models.CharField(max_length=255, blank=True, default='')
    scanned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Scan for {self.qr_code.qr_slug}'
