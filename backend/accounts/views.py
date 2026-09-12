import logging

from django.db import connection
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def healthcheck(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except Exception:
        logger.exception('Health check database probe failed')
        return JsonResponse({'status': 'error', 'app': 'accounts'}, status=503)
    return JsonResponse({'status': 'ok', 'app': 'accounts', 'database': 'ok'})
