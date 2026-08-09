import tempfile
from uuid import uuid4

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from .models import QRCode


class QRPermissionTests(APITestCase):
    def setUp(self):
        self.artist = User.objects.create_user(username='artist1', email='artist1@example.com', password='pass12345', is_artist=True)
        self.manager = User.objects.create_user(
            username='manager1',
            email='manager1@example.com',
            password='pass12345',
            can_manage_exhibitions=True,
        )
        self.viewer = User.objects.create_user(username='viewer1', email='viewer1@example.com', password='pass12345')

    def test_artwork_qr_requires_artist(self):
        self.client.force_authenticate(user=self.viewer)
        response = self.client.post(
            reverse('qrcode-list'),
            {'entity_type': QRCode.ENTITY_ARTWORK, 'entity_id': str(uuid4()), 'qr_slug': 'art-qr-1'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('entity_type', response.data)

    def test_artwork_qr_allows_artist(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.post(
            reverse('qrcode-list'),
            {'entity_type': QRCode.ENTITY_ARTWORK, 'entity_id': str(uuid4()), 'qr_slug': 'art-qr-2'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_exhibition_qr_requires_exhibition_manager(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.post(
            reverse('qrcode-list'),
            {'entity_type': QRCode.ENTITY_EXHIBITION, 'entity_id': str(uuid4()), 'qr_slug': 'exh-qr-1'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('entity_type', response.data)

    def test_exhibition_qr_allows_manager(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            reverse('qrcode-list'),
            {'entity_type': QRCode.ENTITY_EXHIBITION, 'entity_id': str(uuid4()), 'qr_slug': 'exh-qr-2'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class QRDownloadTests(APITestCase):
    def setUp(self):
        self.artist = User.objects.create_user(username='artist1', email='artist1@example.com', password='pass12345', is_artist=True)

    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_generate_qr_stores_file_and_download_streams_local(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.post(
            reverse('qrcode-list'),
            {'entity_type': QRCode.ENTITY_ARTWORK, 'entity_id': str(uuid4()), 'qr_slug': 'art-qr-stream'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        qr = QRCode.objects.get(pk=response.data['id'])
        self.assertTrue(qr.qr_image_path)

        download_response = self.client.get(reverse('qrcode-download', args=[qr.pk]))
        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(download_response['Content-Type'], 'image/png')
        self.assertIn('attachment', download_response['Content-Disposition'])
