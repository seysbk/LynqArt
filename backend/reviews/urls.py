from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import ExpertReviewViewSet
from .views import healthcheck

router = DefaultRouter()
router.register(r'', ExpertReviewViewSet, basename='expertreview')

urlpatterns = [
    path('health/', healthcheck, name='reviews-healthcheck'),
]

urlpatterns += router.urls
