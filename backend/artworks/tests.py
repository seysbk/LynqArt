import tempfile
from uuid import uuid4

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import Artwork, Category


class ArtworkUploadTests(APITestCase):
    def setUp(self):
        self.artist = User.objects.create_user(username='artist1', email='artist1@example.com', password='pass12345', is_artist=True)
        self.viewer = User.objects.create_user(username='viewer1', email='viewer1@example.com', password='pass12345')
        self.category = Category.objects.create(name='Painting', slug='painting')
        self.artwork = Artwork.objects.create(
            artist=self.artist,
            category=self.category,
            title='Sunset',
            slug=f'sunset-{uuid4().hex[:8]}',
        )

    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_artist_can_upload_artwork_image(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.post(
            reverse('artwork-upload-images', args=[self.artwork.slug]),
            {'image': self._image_file(), 'caption': 'Main image', 'display_order': 1, 'is_process_image': False},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('image_url', response.data)
        self.assertIn('artworks/', response.data['image_url'])

    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_artist_can_upload_banner(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.post(
            reverse('artwork-upload-banner', args=[self.artwork.slug]),
            {'banner': self._image_file(name='banner.png')},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artwork.refresh_from_db()
        self.assertIn('artwork-banners/', self.artwork.banner_image)

    def test_viewer_cannot_upload_artwork_image(self):
        self.client.force_authenticate(user=self.viewer)
        response = self.client.post(
            reverse('artwork-upload-images', args=[self.artwork.slug]),
            {'image': self._image_file()},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_can_search_artworks(self):
        response = self.client.get(reverse('artwork-list'), {'search': 'Sunset'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def _image_file(self, name='test.png'):
        from django.core.files.uploadedfile import SimpleUploadedFile

        return SimpleUploadedFile(name, b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR', content_type='image/png')
