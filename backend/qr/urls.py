from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import QRCodeViewSet, QRScanViewSet
from .views import healthcheck

router = DefaultRouter()
router.register(r'codes', QRCodeViewSet, basename='qrcode')
router.register(r'scans', QRScanViewSet, basename='qrscan')

urlpatterns = [
    path('', healthcheck, name='qr-healthcheck'),
]

urlpatterns += router.urls
