from urllib.parse import unquote, urlparse

from django.conf import settings
from django.core.files.storage import default_storage


def storage_name_from_value(value):
    """Return a default-storage name for a locally stored media value.

    Media is currently persisted in URL/string model fields. External object
    storage URLs are intentionally ignored here because deleting them requires
    provider-specific APIs and credentials.
    """
    if not value:
        return ''

    parsed = urlparse(str(value))
    path = unquote(parsed.path).lstrip('/')
    media_url = str(getattr(settings, 'MEDIA_URL', '/media/')).strip('/')

    if parsed.scheme or parsed.netloc:
        prefix = f'{media_url}/'
        return path[len(prefix):] if path.startswith(prefix) else ''

    return path


def delete_stored_file(value):
    """Delete a local/default-storage object when its path is known.

    This is safe for Cloudinary URLs: they are not mistaken for local paths.
    """
    storage_name = storage_name_from_value(value)
    if storage_name and default_storage.exists(storage_name):
        default_storage.delete(storage_name)

