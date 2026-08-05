from django.core.exceptions import FieldDoesNotExist
from django.test import TestCase

from .models import User


class UserPermissionFlagsTests(TestCase):
    def test_user_uses_permission_flags_instead_of_role(self):
        self.assertTrue(hasattr(User, 'is_artist'))
        self.assertTrue(hasattr(User, 'is_expert'))

        with self.assertRaises(FieldDoesNotExist):
            User._meta.get_field('role')
