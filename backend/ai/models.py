import uuid

from django.conf import settings
from django.db import models


class AIGeneration(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey('artworks.Artwork', on_delete=models.CASCADE, related_name='ai_generations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_generations')
    prompt = models.TextField()
    generated_text = models.TextField(blank=True, default='')
    model_used = models.CharField(max_length=100, blank=True, default='')
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'AI draft for {self.artwork}'
