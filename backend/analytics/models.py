import uuid

from django.db import models


class ArtworkView(models.Model):
    SOURCE_CHOICES = [
        ('qr', 'QR'),
        ('direct', 'Direct'),
        ('shared_link', 'Shared link'),
        ('artist_profile', 'Artist profile'),
        ('exhibition', 'Exhibition'),
        ('internal_search', 'Internal search'),
        ('unknown', 'Unknown'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey('artworks.Artwork', on_delete=models.CASCADE, related_name='views')
    visitor_hash = models.CharField(max_length=255, blank=True, default='')
    viewed_from = models.CharField(max_length=255, blank=True, default='')
    source = models.CharField(max_length=32, choices=SOURCE_CHOICES, default='unknown')
    user_agent = models.TextField(blank=True, default='')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=('artwork', 'viewed_at')),
            models.Index(fields=('artwork', 'visitor_hash')),
            models.Index(fields=('source', 'viewed_at')),
        ]

    def __str__(self):
        return f'View for {self.artwork}'
