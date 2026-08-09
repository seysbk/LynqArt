import io
import os
from uuid import uuid4

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import FileResponse
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import QRCode, QRScan
from .serializers import QRCodeSerializer, QRScanSerializer


class QRCodeViewSet(viewsets.ModelViewSet):
    queryset = QRCode.objects.all().order_by('-created_at')
    serializer_class = QRCodeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('qr_slug', 'entity_type')
    filterset_fields = ('entity_type',)
    ordering_fields = ('created_at', 'scans')

    def _store_qr_image(self, qr_slug, image_bytes):
        filename = f'qr-codes/{qr_slug}-{uuid4().hex}.png'
        saved_path = default_storage.save(filename, ContentFile(image_bytes))
        return saved_path, default_storage.url(saved_path)

    def perform_create(self, serializer):
        qr_code = serializer.save()
        try:
            import qrcode
        except ModuleNotFoundError as exc:
            raise RuntimeError(
                'QR generation requires the qrcode package. Install backend requirements to enable this endpoint.'
            ) from exc

        qr = qrcode.QRCode(border=2, box_size=10)
        qr.add_data(qr_code.qr_slug)
        qr.make(fit=True)
        image = qr.make_image(fill_color='black', back_color='white')

        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        qr_code.qr_image_path, qr_code.qr_image_url = self._store_qr_image(qr_code.qr_slug, buffer.getvalue())
        qr_code.save(update_fields=['qr_image_path', 'qr_image_url'])

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        qr_code = self.get_object()
        if not qr_code.qr_image_path and not qr_code.qr_image_url:
            return Response({'detail': 'QR image has not been generated yet.'}, status=status.HTTP_404_NOT_FOUND)

        if qr_code.qr_image_path and hasattr(default_storage, 'path'):
            file_path = default_storage.path(qr_code.qr_image_path)
            if os.path.exists(file_path):
                return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))

        return Response({'qr_image_url': qr_code.qr_image_url}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def generate_qr(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class QRScanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = QRScan.objects.select_related('qr_code').all().order_by('-scanned_at')
    serializer_class = QRScanSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('qr_code__qr_slug', 'visitor_hash')
    filterset_fields = ('qr_code',)
    ordering_fields = ('scanned_at',)
