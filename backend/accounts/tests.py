from django.core.exceptions import FieldDoesNotExist
from django.test import TestCase

from .models import User


from rest_framework.test import APITestCase
from rest_framework import status


class UserPermissionFlagsTests(TestCase):
    def test_user_uses_permission_flags_instead_of_role(self):
        self.assertTrue(hasattr(User, 'is_artist'))
        self.assertTrue(hasattr(User, 'is_expert'))

        with self.assertRaises(FieldDoesNotExist):
            User._meta.get_field('role')


class ProfileUpdateAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            first_name='First',
            last_name='Last',
            password='password123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            first_name='Other',
            last_name='User',
            password='password123'
        )
        self.client.force_authenticate(user=self.user)

    def test_update_profile_first_last_and_email(self):
        response = self.client.patch('/api/accounts/profile/', {
            'first_name': 'UpdatedFirst',
            'last_name': 'UpdatedLast',
            'email': 'newemail@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'UpdatedFirst')
        self.assertEqual(self.user.last_name, 'UpdatedLast')
        self.assertEqual(self.user.email, 'newemail@example.com')

    def test_update_profile_duplicate_email_fails(self):
        response = self.client.patch('/api/accounts/profile/', {
            'email': 'other@example.com'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
