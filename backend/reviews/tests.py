from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from artworks.models import Artwork

from .models import ExpertReview


class ExpertReviewApiTests(APITestCase):
    def setUp(self):
        self.expert = User.objects.create_user(
            username='expert1',
            email='expert1@example.com',
            password='pass12345',
            is_expert=True,
        )
        self.other_expert = User.objects.create_user(
            username='expert2',
            email='expert2@example.com',
            password='pass12345',
            is_expert=True,
        )
        self.visitor = User.objects.create_user(
            username='visitor1',
            email='visitor1@example.com',
            password='pass12345',
        )
        self.artwork = Artwork.objects.create(
            artist=self.visitor,
            title='Test Artwork',
            slug='test-artwork',
        )
        self.url = reverse('expertreview-list')

    def test_public_users_can_read_reviews(self):
        response = self.client.get(self.url, {'artwork': self.artwork.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_only_experts_can_create_reviews(self):
        payload = {
            'artwork': self.artwork.id,
            'title': 'A considered critique',
            'markdown_review': 'The composition creates a strong visual rhythm.',
            'rating': 4,
        }

        self.client.force_authenticate(user=self.visitor)
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.expert)
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['reviewer']['id'], str(self.expert.id))

    def test_experts_can_only_edit_their_own_reviews(self):
        review = ExpertReview.objects.create(
            artwork=self.artwork,
            reviewer=self.expert,
            title='Original title',
            markdown_review='Original review',
            rating=3,
        )

        self.client.force_authenticate(user=self.other_expert)
        response = self.client.patch(
            reverse('expertreview-detail', args=[review.id]),
            {'title': 'Attempted edit'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        review.refresh_from_db()
        self.assertEqual(review.title, 'Original title')
