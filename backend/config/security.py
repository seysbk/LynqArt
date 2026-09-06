import os
from uuid import uuid4
from PIL import Image
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework.exceptions import ValidationError

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
ALLOWED_IMAGE_FORMATS = {'JPEG', 'PNG', 'WEBP'}


def get_client_ip(request):
    """
    Extract the real client IP address from HTTP headers behind reverse proxies
    (Cloudflare, Render, Railway, Nginx, etc.), falling back to REMOTE_ADDR.
    """
    if not request:
        return ''

    # Cloudflare sends CF-Connecting-IP
    cf_ip = request.META.get('HTTP_CF_CONNECTING_IP')
    if cf_ip:
        return cf_ip.strip()

    # X-Forwarded-For can contain a comma-separated list of IPs: client, proxy1, proxy2
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        parts = [ip.strip() for ip in x_forwarded_for.split(',') if ip.strip()]
        if parts:
            return parts[0]

    # X-Real-IP is commonly passed by Nginx
    x_real_ip = request.META.get('HTTP_X_REAL_IP')
    if x_real_ip:
        return x_real_ip.strip()

    return request.META.get('REMOTE_ADDR', '')


def validate_and_store_upload(uploaded_file, folder, max_size_mb=10, allowed_extensions=None):
    """
    Validates uploaded image file size, extension whitelist, and magic bytes via Pillow,
    then saves it safely to default_storage with a randomized UUID filename.

    Returns:
        tuple: (saved_path, file_url)
    """
    if not uploaded_file:
        raise ValidationError('No file provided.')

    if allowed_extensions is None:
        allowed_extensions = ALLOWED_IMAGE_EXTENSIONS

    # 1. Size check before reading whole file into memory
    max_size_bytes = max_size_mb * 1024 * 1024
    file_size = getattr(uploaded_file, 'size', None)
    if file_size is not None and file_size > max_size_bytes:
        raise ValidationError(f'File size exceeds maximum allowed size of {max_size_mb} MB.')

    # 2. Whitelist file extension
    _, extension = os.path.splitext(uploaded_file.name)
    ext_lower = extension.lower()
    if ext_lower not in allowed_extensions:
        raise ValidationError(
            f'Unsupported file extension "{extension}". Allowed extensions: {", ".join(sorted(allowed_extensions))}.'
        )

    # 3. Validate image magic bytes using Pillow
    try:
        uploaded_file.seek(0)
        img = Image.open(uploaded_file)
        img.verify()
        if img.format and img.format.upper() not in ALLOWED_IMAGE_FORMATS:
            raise ValidationError(f'Invalid image format: {img.format}. Allowed formats: JPEG, PNG, WEBP.')
    except ValidationError:
        raise
    except Exception as exc:
        raise ValidationError('The uploaded file is not a valid or supported image.') from exc
    finally:
        uploaded_file.seek(0)

    # 4. Safe store with random UUID
    storage_name = f'{folder}/{uuid4().hex}{ext_lower}'
    saved_path = default_storage.save(storage_name, ContentFile(uploaded_file.read()))
    return saved_path, default_storage.url(saved_path)
