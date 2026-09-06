from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import ArtworkAnalyticsSummaryView, ArtworkViewViewSet
from .views import healthcheck

router = DefaultRouter()
router.register(r'views', ArtworkViewViewSet, basename='artworkview')

urlpatterns = [
    path('', healthcheck, name='analytics-healthcheck'),
    path('summary/', ArtworkAnalyticsSummaryView.as_view(), name='analytics-summary'),
]

urlpatterns += router.urls
