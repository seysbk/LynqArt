from django.urls import reverse
from unittest.mock import Mock, patch
from rest_framework import status
from rest_framework.test import APITestCase

from .models import ArtistProfile, User


class AuthSecurityTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='artist1', email='artist1@example.com', password='pass12345')
        self.other_user = User.objects.create_user(username='viewer1', email='viewer1@example.com', password='pass12345')

    def test_register_rejects_protected_flags(self):
        response = self.client.post(
            reverse('register'),
            {
                'username': 'newuser',
                'email': 'new@example.com',
                'first_name': 'New',
                'last_name': 'User',
                'password': 'pass12345',
                'password_confirm': 'pass12345',
                'is_artist': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('is_artist', response.data)

    def test_current_user_endpoint_requires_auth(self):
        response = self.client.get(reverse('current-user'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_current_user_profile_is_self_only(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('current-user'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'artist1')
        self.assertNotIn('viewer1', str(response.data))

    def test_profile_update_rejects_protected_fields(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            reverse('current-user'),
            {'is_expert': True, 'first_name': 'Changed'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('is_expert', response.data)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_expert)
        self.assertEqual(self.user.first_name, '')

    def test_become_artist_only_affects_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(reverse('become-artist'), {'bio': 'Hello'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_artist)
        self.assertTrue(ArtistProfile.objects.filter(user=self.user).exists())
        self.assertFalse(ArtistProfile.objects.filter(user=self.other_user).exists())

    def test_artist_profile_is_self_only(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('artist-profile-self'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], '')

    def test_google_auth_creates_or_logs_in_user(self):
        google_response = Mock(status_code=200)
        google_response.json.return_value = {
            'aud': 'test-google-client-id',
            'iss': 'https://accounts.google.com',
            'email_verified': 'true',
            'sub': 'google-subject-1',
            'email': 'googleuser@example.com',
            'given_name': 'Google',
            'family_name': 'User',
        }
        with self.settings(GOOGLE_CLIENT_ID='test-google-client-id'):
            with patch('accounts.auth_views.requests.get', return_value=google_response):
                response = self.client.post(
                    reverse('google-auth'),
                    {'credential': 'google-id-token'},
                    format='json',
                )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'googleuser@example.com')

    def test_google_auth_rejects_frontend_profile_data(self):
        response = self.client.post(
            reverse('google-auth'),
            {'email': 'spoofed@example.com', 'first_name': 'Spoofed'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_google_login_rejects_unregistered_user(self):
        google_response = Mock(status_code=200)
        google_response.json.return_value = {
            'aud': 'test-google-client-id',
            'iss': 'https://accounts.google.com',
            'email_verified': 'true',
            'sub': 'unregistered-google-subject',
            'email': 'unregistered@example.com',
        }
        with self.settings(GOOGLE_CLIENT_ID='test-google-client-id'):
            with patch('accounts.auth_views.requests.get', return_value=google_response):
                response = self.client.post(
                    reverse('google-auth'),
                    {'credential': 'google-id-token', 'mode': 'login'},
                    format='json',
                )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Failed to sign in. Have you signed up?')
