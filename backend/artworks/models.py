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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    artist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='artworks')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='artworks')
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')
    medium = models.CharField(max_length=255, blank=True, default='')
    current_version = models.ForeignKey('ArtworkVersion', on_delete=models.SET_NULL, null=True, blank=True, related_name='current_for_artwork')
    banner_image = models.CharField(max_length=500, blank=True, default='')
    year_created = models.IntegerField(null=True, blank=True)
    dimensions = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    allow_comments = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
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
