import uuid

from django.conf import settings
from django.db import models


class ExpertReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey('artworks.Artwork', on_delete=models.CASCADE, related_name='expert_reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expert_reviews')
    title = models.CharField(max_length=255)
    markdown_review = models.TextField()
    rating = models.IntegerField(default=0)
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
