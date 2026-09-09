from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.html import escape
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Exhibition


@api_view(['GET'])
@permission_classes([AllowAny])
def healthcheck(request):
    return Response({'status': 'ok', 'message': 'Exhibitions app is running'})


@api_view(['GET'])
@permission_classes([AllowAny])
def share_exhibition_preview(request, slug):
    exhibition = get_object_or_404(
        Exhibition.objects.select_related('organizer'),
        slug=slug,
        status__in=('published', 'completed'),
    )
    organizer_name = exhibition.organizer.get_full_name() or exhibition.organizer.username
    title = f'{exhibition.title} by {organizer_name} | LynqArt'
    description = exhibition.short_description or exhibition.markdown_description or f'Explore {exhibition.title} on LynqArt.'
    image_url = exhibition.banner_image or ''
    if image_url and not image_url.startswith(('http://', 'https://')):
        image_url = request.build_absolute_uri(image_url if image_url.startswith('/') else f'{settings.MEDIA_URL}{image_url}')
    canonical_url = f'{getattr(settings, "FRONTEND_BASE_URL", request.build_absolute_uri("/")).rstrip("/")}/exhibitions/{exhibition.slug}'
    markup = f'''<!doctype html>
<html><head>
<meta charset="utf-8"><title>{escape(title)}</title>
<meta http-equiv="refresh" content="0; url={escape(canonical_url)}">
<link rel="canonical" href="{escape(canonical_url)}">
<meta name="description" content="{escape(description[:160])}">
<meta property="og:title" content="{escape(title)}">
<meta property="og:description" content="{escape(description[:200])}">
<meta property="og:type" content="website">
<meta property="og:url" content="{escape(canonical_url)}">
<meta property="og:image" content="{escape(image_url)}">
<meta property="og:image:alt" content="{escape(exhibition.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{escape(title)}">
<meta name="twitter:description" content="{escape(description[:200])}">
<meta name="twitter:image" content="{escape(image_url)}">
</head><body><p><a href="{escape(canonical_url)}">Open {escape(title)}</a></p><script>window.location.replace({canonical_url!r})</script></body></html>'''
    return HttpResponse(markup, content_type='text/html; charset=utf-8')
