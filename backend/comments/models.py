import uuid

from django.conf import settings
from django.db import models


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey('artworks.Artwork', on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments')
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user} - {self.comment[:30]}'


class Favorite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    artwork = models.ForeignKey('artworks.Artwork', on_delete=models.CASCADE, related_name='favorites')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'artwork')

    def __str__(self):
        return f'{self.user} likes {self.artwork}'


class Report(models.Model):
    REASON_CHOICES = [
        ('inappropriate', 'Inappropriate Content / NSFW'),
        ('harassment', 'Harassment or Hate Speech'),
        ('spam', 'Spam or Advertising'),
        ('copyright', 'Copyright or Intellectual Property Infringement'),
        ('other', 'Other Violation'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('actioned', 'Actioned'),
        ('escalated', 'Escalated to Staff'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reports')
    reporter_ip = models.CharField(max_length=64, blank=True, default='')
    target_comment = models.ForeignKey(Comment, on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    target_artwork = models.ForeignKey('artworks.Artwork', on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    target_exhibition = models.ForeignKey('exhibitions.Exhibition', on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    target_expert_review = models.ForeignKey('reviews.ExpertReview', on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='reported_as_target')
    reason = models.CharField(max_length=32, choices=REASON_CHOICES)
    details = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    moderator_notes = models.TextField(blank=True, default='')
    assigned_moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_reports',
    )
    moderator_response = models.TextField(blank=True, default='')
    resolution = models.TextField(blank=True, default='')
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_reports',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)


class ModerationAction(models.Model):
    ACTION_CHOICES = [
        ('dismiss', 'Dismiss report'),
        ('warn', 'Warn user'),
        ('hide_comment', 'Hide comment'),
        ('remove_comment', 'Remove comment'),
        ('hide_artwork', 'Hide artwork'),
        ('request_changes', 'Request changes'),
        ('escalate_to_staff', 'Escalate to staff'),
        ('resolve', 'Resolve report'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='actions')
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='moderation_actions',
    )
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    internal_note = models.TextField(blank=True, default='')
    public_response = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('created_at',)
