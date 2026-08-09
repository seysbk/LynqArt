from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import AIGenerationViewSet
from .views import healthcheck

router = DefaultRouter()
router.register(r'generations', AIGenerationViewSet, basename='aigeneration')

urlpatterns = [
    path('', healthcheck, name='ai-healthcheck'),
]

urlpatterns += router.urls
