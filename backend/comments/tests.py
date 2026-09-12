from uuid import uuid4

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from artworks.models import Artwork
from notifications.models import Notification

from .models import ModerationAction, Report


class ReportModerationTests(APITestCase):
    def setUp(self):
        self.reporter = User.objects.create_user(
            username='reporter',
            email='reporter@example.com',
            password='pass12345',
        )
        self.moderator = User.objects.create_user(
            username='moderator',
            email='moderator@example.com',
            password='pass12345',
            is_moderator=True,
        )
        self.staff = User.objects.create_user(
            username='staff',
            email='staff@example.com',
            password='pass12345',
            is_staff=True,
        )
        self.artwork = Artwork.objects.create(
            artist=self.reporter,
            title='Reported work',
            slug=f'reported-work-{uuid4().hex[:8]}',
            status=Artwork.STATUS_PUBLISHED,
        )
        self.report = Report.objects.create(
            reporter=self.reporter,
            target_artwork=self.artwork,
            reason='spam',
            details='Please review this work.',
        )

    def test_moderator_update_notifies_reporter_with_notes(self):
        self.client.force_authenticate(user=self.moderator)
        response = self.client.patch(
            reverse('report-detail', args=[self.report.id]),
            {'status': 'actioned', 'moderator_notes': 'The content was reviewed and actioned.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'actioned')
        self.assertEqual(response.data['moderator_notes'], 'The content was reviewed and actioned.')
        notification = Notification.objects.get(user=self.reporter, type='report')
        self.assertIn('actioned', notification.message)
        self.assertIn('The content was reviewed and actioned.', notification.message)

    def test_non_moderator_cannot_update_report(self):
        self.client.force_authenticate(user=self.reporter)
        response = self.client.patch(
            reverse('report-detail', args=[self.report.id]),
            {'status': 'dismissed', 'moderator_notes': 'Not a violation.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Notification.objects.filter(user=self.reporter, type='report').exists())

    def test_moderator_can_create_audited_action(self):
        self.client.force_authenticate(user=self.moderator)
        response = self.client.post(
            reverse('report-moderate', args=[self.report.id]),
            {
                'action': 'request_changes',
                'internal_note': 'Ask the artist for provenance evidence.',
                'public_response': 'Please provide evidence supporting this report.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.report.refresh_from_db()
        self.assertEqual(self.report.assigned_moderator, self.moderator)
        self.assertEqual(self.report.moderator_response, 'Please provide evidence supporting this report.')
        self.assertEqual(ModerationAction.objects.get(report=self.report).actor, self.moderator)

    def test_staff_can_view_moderation_history(self):
        ModerationAction.objects.create(
            report=self.report,
            actor=self.moderator,
            action='dismiss',
            internal_note='No violation found.',
        )
        self.client.force_authenticate(user=self.staff)
        response = self.client.get(reverse('report-detail', args=[self.report.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['actions']), 1)
        self.assertEqual(response.data['actions'][0]['action'], 'dismiss')
