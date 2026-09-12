import io
import hashlib
import os
from datetime import timedelta
from uuid import uuid4

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from config.storage import delete_stored_file
from django.db.models import F, Q
from django.http import FileResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from config.security import get_client_ip

from .models import QRCode, QRScan
from .serializers import QRCodeSerializer, QRScanSerializer


class QRCodeViewSet(viewsets.ModelViewSet):
    queryset = QRCode.objects.all().order_by('-created_at')
    serializer_class = QRCodeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('qr_slug', 'entity_type')
    filterset_fields = ('entity_type', 'entity_id')
    ordering_fields = ('created_at', 'scans')

    @action(detail=False, methods=['get'])
    def resolve(self, request):
        code = self.get_queryset().filter(qr_slug=request.query_params.get('slug', '')).first()
        if not code:
            return Response({'detail': 'QR code not found.'}, status=status.HTTP_404_NOT_FOUND)
        visitor_hash = hashlib.sha256(
            f"{get_client_ip(request)}:{request.META.get('HTTP_USER_AGENT', '')}".encode()
        ).hexdigest()
        recent_scan = code.qr_scans.filter(
            visitor_hash=visitor_hash,
            scanned_at__gte=timezone.now() - timedelta(seconds=30),
        ).exists()
        if not recent_scan:
            QRScan.objects.create(qr_code=code, visitor_hash=visitor_hash)
            QRCode.objects.filter(pk=code.pk).update(scans=F('scans') + 1)
            code.refresh_from_db(fields=['scans'])
        payload = self.get_serializer(code).data
        try:
            from artworks.models import Artwork
            from exhibitions.models import Exhibition
            model = Artwork if code.entity_type == QRCode.ENTITY_ARTWORK else Exhibition
            target = model.objects.filter(pk=code.entity_id).values('slug').first()
            payload['target_slug'] = target['slug'] if target else None
        except (ImportError, TypeError):
            payload['target_slug'] = None
        return Response(payload)

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

        try:
            from PIL import Image, ImageDraw, ImageFont
        except ImportError:
            Image = None

        qr = qrcode.QRCode(
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            border=2,
            box_size=8,
        )
        frontend_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173').rstrip('/')
        qr.add_data(f'{frontend_url}/q/{qr_code.qr_slug}')
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color='#0F172A', back_color='white').convert('RGB')

        # Fetch entity title for inscription
        entity_title = qr_code.qr_slug
        try:
            from artworks.models import Artwork
            from exhibitions.models import Exhibition
            if qr_code.entity_type == QRCode.ENTITY_ARTWORK:
                target = Artwork.objects.filter(pk=qr_code.entity_id).first()
            else:
                target = Exhibition.objects.filter(pk=qr_code.entity_id).first()
            if target and getattr(target, 'title', None):
                entity_title = target.title
        except Exception:
            pass

        if Image:
            qr_w, qr_h = qr_img.size
            padding = 20
            header_h = 28
            footer_h = 32
            card_w = qr_w + (padding * 2)
            card_h = qr_h + header_h + footer_h + (padding * 2)

            card = Image.new('RGB', (card_w, card_h), '#0D0F14')
            draw = ImageDraw.Draw(card)

            # Draw top inscription (Entity Title)
            display_title = entity_title if len(entity_title) <= 24 else f'{entity_title[:21]}...'
            draw.text((padding, padding), display_title, fill='#F4F4F5')

            # Paste QR code in center
            card.paste(qr_img, (padding, padding + header_h))

            # Keep the complete LynqArt wordmark in the QR's quiet center area.
            # Error correction H leaves enough recovery capacity for this small plaque.
            brand_font_size = max(12, int(qr_w * 0.055))
            try:
                brand_font = ImageFont.truetype('DejaVuSans-Bold.ttf', brand_font_size)
            except OSError:
                brand_font = ImageFont.load_default()
            brand_text = 'LynqArt'
            text_box = draw.textbbox((0, 0), brand_text, font=brand_font)
            brand_text_w = text_box[2] - text_box[0]
            brand_text_h = text_box[3] - text_box[1]
            plaque_padding_x = max(8, int(qr_w * 0.025))
            plaque_padding_y = max(5, int(qr_w * 0.012))
            plaque_w = brand_text_w + (plaque_padding_x * 2)
            plaque_h = brand_text_h + (plaque_padding_y * 2)
            plaque_left = padding + (qr_w - plaque_w) // 2
            plaque_top = padding + header_h + (qr_h - plaque_h) // 2
            draw.rounded_rectangle(
                (plaque_left, plaque_top, plaque_left + plaque_w, plaque_top + plaque_h),
                radius=max(4, plaque_h // 4),
                fill='white',
            )
            draw.text(
                (plaque_left + plaque_padding_x, plaque_top + plaque_padding_y - text_box[1]),
                brand_text,
                fill='#4F46E5',
                font=brand_font,
            )

            # Draw bottom branding "LynqArt"
            draw.text((padding, padding + header_h + qr_h + 8), 'LynqArt', fill='#818CF8')

            buffer = io.BytesIO()
            card.save(buffer, format='PNG')
        else:
            buffer = io.BytesIO()
            qr_img.save(buffer, format='PNG')
        old_qr_image_path = qr_code.qr_image_path
        qr_code.qr_image_path, qr_code.qr_image_url = self._store_qr_image(qr_code.qr_slug, buffer.getvalue())
        qr_code.save(update_fields=['qr_image_path', 'qr_image_url'])
        delete_stored_file(old_qr_image_path)

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

    @action(detail=False, methods=['post'], parser_classes=[JSONParser, MultiPartParser, FormParser])
    def generate_qr(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class QRScanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = QRScan.objects.select_related('qr_code').all().order_by('-scanned_at')
    serializer_class = QRScanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('qr_code__qr_slug', 'visitor_hash')
    filterset_fields = ('qr_code',)
    ordering_fields = ('scanned_at',)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return queryset
        from artworks.models import Artwork
        from exhibitions.models import Exhibition

        artwork_ids = Artwork.objects.filter(artist=user).values('id')
        exhibition_ids = Exhibition.objects.filter(organizer=user).values('id')
        return queryset.filter(
            Q(qr_code__entity_type=QRCode.ENTITY_ARTWORK, qr_code__entity_id__in=artwork_ids)
            | Q(qr_code__entity_type=QRCode.ENTITY_EXHIBITION, qr_code__entity_id__in=exhibition_ids)
        )
