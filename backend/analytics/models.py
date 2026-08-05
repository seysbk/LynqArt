import uuid

from django.db import models


class ArtworkView(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey('artworks.Artwork', on_delete=models.CASCADE, related_name='views')
    visitor_hash = models.CharField(max_length=255, blank=True, default='')
    viewed_from = models.CharField(max_length=255, blank=True, default='')
    user_agent = models.TextField(blank=True, default='')
    viewed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'View for {self.artwork}'
