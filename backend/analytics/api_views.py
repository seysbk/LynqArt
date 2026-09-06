import hashlib
from datetime import timedelta

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ArtworkView
from .serializers import ArtworkViewSerializer


class ArtworkViewViewSet(viewsets.ModelViewSet):
    queryset = ArtworkView.objects.select_related('artwork').all().order_by('-viewed_at')
    serializer_class = ArtworkViewSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ['post', 'head', 'options']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('artwork__title', 'visitor_hash', 'viewed_from')
    filterset_fields = ('artwork', 'viewed_from')
    ordering_fields = ('viewed_at',)

    def create(self, request, *args, **kwargs):
        if not request.data.get('artwork'):
            return Response({'artwork': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
        from artworks.models import Artwork
        artwork = Artwork.objects.filter(pk=request.data.get('artwork'), status=Artwork.STATUS_PUBLISHED).first()
        if not artwork:
            return Response({'artwork': 'Published artwork not found.'}, status=status.HTTP_404_NOT_FOUND)
        visitor_hash = hashlib.sha256(
            f"{request.META.get('REMOTE_ADDR', '')}:{request.META.get('HTTP_USER_AGENT', '')}".encode()
        ).hexdigest()
        if ArtworkView.objects.filter(
            artwork=artwork,
            visitor_hash=visitor_hash,
            viewed_at__gte=timezone.now() - timedelta(seconds=30),
        ).exists():
            return Response({'detail': 'View already recorded.'}, status=status.HTTP_200_OK)
        source = request.data.get('source', 'unknown')
        if source not in {choice[0] for choice in ArtworkView.SOURCE_CHOICES}:
            source = 'unknown'
        view = ArtworkView.objects.create(
            artwork=artwork,
            visitor_hash=visitor_hash,
            viewed_from=request.data.get('viewed_from', '')[:255],
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            source=source,
        )
        return Response(self.get_serializer(view).data, status=201)

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return ArtworkView.objects.none()
        if self.request.user.is_staff or self.request.user.is_superuser:
            return super().get_queryset()
        return super().get_queryset().filter(artwork__artist=self.request.user)


class ArtworkAnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from artworks.models import Artwork
        from exhibitions.models import Exhibition
        from qr.models import QRCode, QRScan

        queryset = ArtworkView.objects.all()
        if not request.user.is_staff and not request.user.is_superuser:
            queryset = queryset.filter(artwork__artist=request.user)
        qr_queryset = QRScan.objects.all()
        if not request.user.is_staff and not request.user.is_superuser:
            artwork_ids = Artwork.objects.filter(artist=request.user).values('id')
            exhibition_ids = Exhibition.objects.filter(organizer=request.user).values('id')
            qr_queryset = qr_queryset.filter(
                Q(qr_code__entity_type=QRCode.ENTITY_ARTWORK, qr_code__entity_id__in=artwork_ids)
                | Q(qr_code__entity_type=QRCode.ENTITY_EXHIBITION, qr_code__entity_id__in=exhibition_ids)
            )
        per_artwork = queryset.values('artwork').annotate(
            views=Count('id'),
            unique_visitors=Count('visitor_hash', distinct=True),
        )
        source_counts = queryset.values('source').annotate(total=Count('id')).order_by('-total')
        daily = queryset.annotate(day=TruncDate('viewed_at')).values('day').annotate(total=Count('id')).order_by('day')
        artwork_ids = [row['artwork'] for row in per_artwork]
        titles = dict(Artwork.objects.filter(id__in=artwork_ids).values_list('id', 'title'))
        return Response({
            'total_views': queryset.count(),
            'unique_visitors': queryset.values('visitor_hash').distinct().count(),
            'total_qr_scans': qr_queryset.count(),
            'unique_qr_visitors': qr_queryset.values('visitor_hash').distinct().count(),
            'exhibition_qr_scans': qr_queryset.filter(qr_code__entity_type=QRCode.ENTITY_EXHIBITION).count(),
            'source_breakdown': [{'source': row['source'], 'total': row['total']} for row in source_counts],
            'views_over_time': [{'date': row['day'], 'total': row['total']} for row in daily],
            'artworks': [
                {
                    'artwork': row['artwork'],
                    'title': titles.get(row['artwork'], 'Artwork'),
                    'views': row['views'],
                    'unique_visitors': row['unique_visitors'],
                }
                for row in per_artwork
            ],
        })
