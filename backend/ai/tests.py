from unittest.mock import patch, MagicMock
from uuid import uuid4
import requests

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from artworks.models import Artwork, Category
from ai.models import AIGeneration
from ai.services import AIService, AIConfigError, AIProviderError


class AIGenerationAPITests(APITestCase):
    def setUp(self):
        self.artist = User.objects.create_user(
            username='artist_user',
            email='artist@example.com',
            password='password123',
            is_artist=True,
        )
        self.other_artist = User.objects.create_user(
            username='other_artist',
            email='other_artist@example.com',
            password='password123',
            is_artist=True,
        )
        self.regular_user = User.objects.create_user(
            username='regular_user',
            email='regular@example.com',
            password='password123',
            is_artist=False,
        )
        self.category = Category.objects.create(name='Sculpture', slug='sculpture')
        self.artwork = Artwork.objects.create(
            artist=self.artist,
            category=self.category,
            title='Bronze Reflection',
            slug='bronze-reflection',
            medium='Bronze & Wood',
        )
        self.url = reverse('aigeneration-generate-draft')

    def test_unauthenticated_user_cannot_generate_draft(self):
        response = self.client.post(self.url, {'artwork': str(self.artwork.id)})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_artist_user_cannot_generate_draft(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(self.url, {'artwork': str(self.artwork.id)})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)

    def test_artist_cannot_generate_draft_for_other_artist_artwork(self):
        self.client.force_authenticate(user=self.other_artist)
        response = self.client.post(self.url, {'artwork': str(self.artwork.id)})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_generate_draft_missing_artwork_id(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_generate_draft_invalid_artwork_id(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.post(self.url, {'artwork': str(uuid4())})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch.dict('os.environ', {'OPENROUTER_API_KEY': ''})
    def test_generate_draft_missing_api_key(self):
        self.client.force_authenticate(user=self.artist)
        response = self.client.post(self.url, {
            'artwork': str(self.artwork.id),
            'prompt': 'Exploring texture and shadow',
        })
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('not configured', response.data['error'])

    @patch('requests.post')
    @patch.dict('os.environ', {
        'OPENROUTER_API_KEY': 'sk-or-v1-test-secret-key',
        'AI_PROVIDER': 'openrouter',
        'AI_MODEL': 'openai/gpt-4o-mini',
    })
    def test_generate_draft_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'choices': [
                {
                    'message': {
                        'content': '## Artist Statement: *Bronze Reflection*\n\nThis work explores texture.'
                    }
                }
            ],
            'model': 'openai/gpt-4o-mini',
        }
        mock_post.return_value = mock_response

        self.client.force_authenticate(user=self.artist)
        response = self.client.post(self.url, {
            'artwork': str(self.artwork.id),
            'prompt': 'Exploring texture and shadow',
            'tone': 'contemplative',
            'mode': 'statement',
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('generated_text', response.data)
        self.assertEqual(response.data['model_used'], 'openai/gpt-4o-mini')
        self.assertFalse(response.data['accepted'])

        # Verify database record
        generation = AIGeneration.objects.get(id=response.data['id'])
        self.assertEqual(generation.artwork, self.artwork)
        self.assertEqual(generation.user, self.artist)
        self.assertFalse(generation.accepted)
        self.assertIn('sk-or-v1-test-secret-key', str(mock_post.call_args))
        # Ensure key is not in response
        self.assertNotIn('sk-or-v1-test-secret-key', str(response.data))

    @patch('requests.post')
    @patch.dict('os.environ', {'OPENROUTER_API_KEY': 'sk-or-v1-test-secret-key'})
    def test_generate_draft_provider_error(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = 'Internal Server Error on OpenRouter'
        mock_post.return_value = mock_response

        self.client.force_authenticate(user=self.artist)
        response = self.client.post(self.url, {
            'artwork': str(self.artwork.id),
            'prompt': 'Exploring texture and shadow',
        })
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertNotIn('sk-or-v1-test-secret-key', str(response.data))

    @patch('requests.post')
    @patch.dict('os.environ', {'OPENROUTER_API_KEY': 'sk-or-v1-test-secret-key'})
    def test_generate_draft_provider_timeout(self, mock_post):
        mock_post.side_effect = requests.exceptions.Timeout("Connection timed out")

        self.client.force_authenticate(user=self.artist)
        response = self.client.post(self.url, {
            'artwork': str(self.artwork.id),
            'prompt': 'Exploring texture and shadow',
        })
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('timed out', response.data['error'])


class AIServiceUnitTests(APITestCase):
    @patch.dict('os.environ', {'OPENROUTER_API_KEY': ''})
    def test_ai_service_raises_config_error_when_no_key(self):
        with self.assertRaises(AIConfigError):
            AIService.generate_statement("Title", "Medium")

    @patch('requests.post')
    @patch.dict('os.environ', {
        'OPENROUTER_API_KEY': 'sk-or-v1-my-key',
        'AI_MODEL': 'anthropic/claude-3.5-sonnet',
    })
    def test_ai_service_sends_correct_payload(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'choices': [{'message': {'content': 'Generated text'}}],
            'model': 'anthropic/claude-3.5-sonnet',
        }
        mock_post.return_value = mock_response

        text, model = AIService.generate_statement("My Art", "Canvas", prompt="Special note")

        self.assertEqual(text, "Generated text")
        self.assertEqual(model, "anthropic/claude-3.5-sonnet")

        # Check call arguments
        url, kwargs = mock_post.call_args
        self.assertEqual(url[0], AIService.OPENROUTER_URL)
        self.assertEqual(kwargs['headers']['Authorization'], 'Bearer sk-or-v1-my-key')
        self.assertEqual(kwargs['json']['model'], 'anthropic/claude-3.5-sonnet')
        self.assertIn('My Art', kwargs['json']['messages'][1]['content'])
