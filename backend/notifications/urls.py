from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import NotificationViewSet
from .views import healthcheck

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('health/', healthcheck, name='notifications-healthcheck'),
]

urlpatterns += router.urls
