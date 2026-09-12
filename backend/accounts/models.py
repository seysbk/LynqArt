import uuid

from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[RegexValidator(r'^[A-Za-z0-9_-]+$', 'Use only letters, numbers, underscores, and hyphens.')],
    )
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')

    is_artist = models.BooleanField(default=False)
    is_expert = models.BooleanField(default=False)
    is_moderator = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    can_manage_exhibitions = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.get_full_name() or self.username


class ArtistProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='artist_profile')
    bio = models.TextField(blank=True, default='')
    avatar_url = models.CharField(max_length=500, blank=True, default='')
    website = models.CharField(max_length=500, blank=True, default='')
    instagram = models.CharField(max_length=500, blank=True, default='')
    twitter = models.CharField(max_length=500, blank=True, default='')
    linkedin = models.CharField(max_length=500, blank=True, default='')
    youtube = models.CharField(max_length=500, blank=True, default='')
    facebook = models.CharField(max_length=500, blank=True, default='')
    tiktok = models.CharField(max_length=500, blank=True, default='')
    pinterest = models.CharField(max_length=500, blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} profile'


class ContactMessage(models.Model):
    INQUIRY_GENERAL = 'general'
    INQUIRY_ACQUISITION = 'acquisition'
    INQUIRY_EXHIBITION = 'exhibition'
    INQUIRY_CHOICES = [
        (INQUIRY_ACQUISITION, 'Acquisition / Purchase Inquiry'),
        (INQUIRY_EXHIBITION, 'Exhibition Invitation'),
        (INQUIRY_GENERAL, 'General Inquiry'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_inquiries')
    artwork = models.ForeignKey('artworks.Artwork', on_delete=models.SET_NULL, null=True, blank=True, related_name='inquiries')
    sender_name = models.CharField(max_length=150)
    sender_email = models.EmailField()
    sender_phone = models.CharField(max_length=50, blank=True, default='')
    inquiry_type = models.CharField(max_length=32, choices=INQUIRY_CHOICES, default=INQUIRY_GENERAL)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)


class FeedbackMessage(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General feedback'),
        ('bug', 'Report a problem'),
        ('idea', 'Feature idea'),
        ('content', 'Content or accessibility feedback'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedback_messages',
    )
    sender_name = models.CharField(max_length=150, blank=True, default='')
    sender_email = models.EmailField(blank=True, default='')
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='general')
    message = models.TextField()
    page_url = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.get_category_display()} from {self.sender_name or "Anonymous"}'
