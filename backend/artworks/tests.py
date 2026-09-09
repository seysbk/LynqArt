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
            status=Artwork.STATUS_PUBLISHED,
        )

    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_artist_can_upload_artwork_image(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.post(
            reverse('artwork-upload-images', args=[self.artwork.slug]),
            {'image': self._image_file(), 'caption': 'Main image', 'display_order': 1},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('image_url', response.data)
        self.assertIn('artworks/', response.data['image_url'])

    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_artist_can_upload_multiple_progress_images(self):
        self.client.force_authenticate(user=self.artist)
        img1 = self._image_file(name='step1.png')
        img2 = self._image_file(name='step2.png')
        response = self.client.post(
            reverse('artwork-upload-images', args=[self.artwork.slug]),
            {'images': [img1, img2], 'caption': 'Layering process'},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 2)

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
        from io import BytesIO

        from PIL import Image

        buffer = BytesIO()
        image = Image.new('RGB', (1, 1), color='white')
        image.save(buffer, format='PNG')
        buffer.seek(0)
        return SimpleUploadedFile(name, buffer.read(), content_type='image/png')


class ArtworkContributorTests(APITestCase):
    def setUp(self):
        self.lead_artist = User.objects.create_user(username='lead_artist', email='lead@example.com', password='pass12345', is_artist=True)
        self.co_artist = User.objects.create_user(username='co_artist', email='co@example.com', password='pass12345', is_artist=True)
        self.other_user = User.objects.create_user(username='other_user', email='other@example.com', password='pass12345')

        self.artwork = Artwork.objects.create(
            artist=self.lead_artist,
            title='Collaborative Sculpture',
            slug='collaborative-sculpture',
            status=Artwork.STATUS_PUBLISHED,
        )

    def test_user_search_for_collaborators(self):
        self.client.force_authenticate(user=self.lead_artist)
        response = self.client.get(reverse('user-search-users'), {'q': 'co_artist'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'co_artist')

    def test_add_contributor_creates_pending_invitation_and_notification(self):
        self.client.force_authenticate(user=self.lead_artist)
        response = self.client.post(
            reverse('artworkcontributor-list'),
            {
                'artwork_id': str(self.artwork.id),
                'user_id': str(self.co_artist.id),
                'contribution_role': 'Ceramic Sculptor',
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        self.assertEqual(response.data['contribution_role'], 'Ceramic Sculptor')

        # Check notification was created for co_artist
        from notifications.models import Notification
        notification = Notification.objects.filter(user=self.co_artist).first()
        self.assertIsNotNone(notification)
        self.assertEqual(notification.type, 'collaboration_invite')
        self.assertIn('Collaborative Sculpture', notification.title)

    def test_cannot_add_lead_artist_or_duplicate_contributor(self):
        self.client.force_authenticate(user=self.lead_artist)

        # Cannot add lead artist
        res1 = self.client.post(
            reverse('artworkcontributor-list'),
            {'artwork_id': str(self.artwork.id), 'user_id': str(self.lead_artist.id), 'contribution_role': 'Co-Lead'},
        )
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # Add co_artist once
        self.client.post(
            reverse('artworkcontributor-list'),
            {'artwork_id': str(self.artwork.id), 'user_id': str(self.co_artist.id), 'contribution_role': 'Sculptor'},
        )

        # Cannot add co_artist twice
        res2 = self.client.post(
            reverse('artworkcontributor-list'),
            {'artwork_id': str(self.artwork.id), 'user_id': str(self.co_artist.id), 'contribution_role': 'Sculptor'},
        )
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_invitation_flow_and_profile_retrieval(self):
        self.client.force_authenticate(user=self.lead_artist)
        res = self.client.post(
            reverse('artworkcontributor-list'),
            {'artwork_id': str(self.artwork.id), 'user_id': str(self.co_artist.id), 'contribution_role': 'Photographer'},
        )
        contributor_id = res.data['id']

        # Pending contributor should NOT be in accepted_contributors on public detail
        self.client.logout()
        detail_res1 = self.client.get(reverse('artwork-detail', args=[self.artwork.slug]))
        self.assertEqual(len(detail_res1.data['accepted_contributors']), 0)

        # Co-artist accepts invitation
        self.client.force_authenticate(user=self.co_artist)
        accept_res = self.client.post(reverse('artworkcontributor-accept', args=[contributor_id]))
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)
        self.assertEqual(accept_res.data['status'], 'accepted')

        # Now accepted contributor IS visible on public detail
        self.client.logout()
        detail_res2 = self.client.get(reverse('artwork-detail', args=[self.artwork.slug]))
        self.assertEqual(len(detail_res2.data['accepted_contributors']), 1)
        self.assertEqual(detail_res2.data['accepted_contributors'][0]['user']['username'], 'co_artist')

        # Querying contributor artworks returns this artwork
        profile_res = self.client.get(reverse('artwork-list'), {'contributor': str(self.co_artist.id)})
        artworks_list = profile_res.data['results'] if isinstance(profile_res.data, dict) else profile_res.data
        self.assertEqual(len(artworks_list), 1)

    def test_decline_invitation_flow(self):
        self.client.force_authenticate(user=self.lead_artist)
        res = self.client.post(
            reverse('artworkcontributor-list'),
            {'artwork_id': str(self.artwork.id), 'user_id': str(self.co_artist.id), 'contribution_role': 'Illustrator'},
        )
        contributor_id = res.data['id']

        # Co-artist declines invitation
        self.client.force_authenticate(user=self.co_artist)
        decline_res = self.client.post(reverse('artworkcontributor-decline', args=[contributor_id]))
        self.assertEqual(decline_res.status_code, status.HTTP_200_OK)
        self.assertEqual(decline_res.data['status'], 'declined')

        # Public detail does NOT show declined contributor
        self.client.logout()
        detail_res = self.client.get(reverse('artwork-detail', args=[self.artwork.slug]))
        self.assertEqual(len(detail_res.data['accepted_contributors']), 0)

    def test_contributor_cannot_edit_or_delete_artwork(self):
        # Create accepted contributor
        from .models import ArtworkContributor
        ArtworkContributor.objects.create(
            artwork=self.artwork, user=self.co_artist, contribution_role='Co-Artist', status=ArtworkContributor.STATUS_ACCEPTED
        )

        self.client.force_authenticate(user=self.co_artist)
        # Cannot edit artwork (returns 403 or 404)
        patch_res = self.client.patch(reverse('artwork-detail', args=[self.artwork.slug]), {'title': 'Hacked Title'})
        self.assertIn(patch_res.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

        # Cannot delete artwork (returns 403 or 404)
        del_res = self.client.delete(reverse('artwork-detail', args=[self.artwork.slug]))
        self.assertIn(del_res.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
