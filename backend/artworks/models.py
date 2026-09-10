import uuid

from django.conf import settings
from django.db import models


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)

    def __str__(self):
        return self.name


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)

    def __str__(self):
        return self.name


class Artwork(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_ARCHIVED = 'archived'

    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PUBLISHED, 'Published'),
        (STATUS_ARCHIVED, 'Archived'),
    ]

    AVAILABILITY_AVAILABLE = 'available_for_enquiry'
    AVAILABILITY_NOT_FOR_SALE = 'not_for_sale'
    AVAILABILITY_ON_LOAN = 'on_loan'
    AVAILABILITY_SOLD = 'sold'
    AVAILABILITY_CHOICES = [
        (AVAILABILITY_AVAILABLE, 'Available for acquisition / enquiries'),
        (AVAILABILITY_NOT_FOR_SALE, 'Not available for sale / Private collection'),
        (AVAILABILITY_ON_LOAN, 'On loan'),
        (AVAILABILITY_SOLD, 'Acquired / Sold'),
    ]

    LICENSE_CHOICES = [
        ('all_rights_reserved', 'All Rights Reserved'),
        ('cc_by_nc_nd', 'Creative Commons BY-NC-ND'),
        ('cc_by_sa', 'Creative Commons BY-SA'),
        ('public_domain', 'Public Domain'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='artworks')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='artworks')
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')
    medium = models.CharField(max_length=255, blank=True, default='')
    current_version = models.ForeignKey('ArtworkVersion', on_delete=models.SET_NULL, null=True, blank=True, related_name='current_for_artwork')
    banner_image = models.CharField(max_length=500, blank=True, default='')
    process_video_url = models.CharField(max_length=500, blank=True, default='')
    year_created = models.IntegerField(null=True, blank=True)
    dimensions = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    allow_comments = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_artist_featured = models.BooleanField(default=False)
    availability_status = models.CharField(max_length=30, choices=AVAILABILITY_CHOICES, default=AVAILABILITY_AVAILABLE)
    copyright_holder = models.CharField(max_length=255, blank=True, default='')
    copyright_confirmed = models.BooleanField(default=False)
    license_type = models.CharField(max_length=50, choices=LICENSE_CHOICES, default='all_rights_reserved')
    provenance_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title


class ArtworkVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField(default=1)
    markdown_statement = models.TextField(blank=True, default='')
    rendered_html = models.TextField(blank=True, default='')
    ai_generated = models.BooleanField(default=False)
    change_note = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('artwork', 'version_number')
        ordering = ['-version_number']

    def __str__(self):
        return f'{self.artwork.title} v{self.version_number}'


class ArtworkImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='images')
    image_url = models.CharField(max_length=500, blank=True, default='')
    caption = models.CharField(max_length=255, blank=True, default='')
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.artwork.title} image'


class ArtworkTag(models.Model):
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='artwork_tags')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, related_name='artwork_tags')

    class Meta:
        unique_together = ('artwork', 'tag')

    def __str__(self):
        return f'{self.artwork.title} - {self.tag.name}'


class ArtworkContributor(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_DECLINED = 'declined'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artwork = models.ForeignKey(Artwork, on_delete=models.CASCADE, related_name='contributors')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='artwork_contributions')
    contribution_role = models.CharField(max_length=150, blank=True, default='Co-Artist')
    is_lead = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('artwork', 'user')
        ordering = ['created_at']

    def __str__(self):
        return f'{self.user.username} - {self.contribution_role} ({self.artwork.title}) [{self.status}]'
