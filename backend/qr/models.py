import uuid

from django.db import models


class QRCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.OneToOneField('artworks.Artwork', on_delete=models.CASCADE, related_name='qr_code')
    qr_slug = models.SlugField(max_length=255, unique=True)
    qr_image_url = models.URLField(blank=True, default='')
    scans = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.qr_slug


class QRScan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    qr_code = models.ForeignKey(QRCode, on_delete=models.CASCADE, related_name='qr_scans')
    visitor_hash = models.CharField(max_length=255, blank=True, default='')
    scanned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Scan for {self.qr_code.qr_slug}'
