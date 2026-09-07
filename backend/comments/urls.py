from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import CommentViewSet, FavoriteViewSet, ReportViewSet
from .views import healthcheck

router = DefaultRouter()
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'', CommentViewSet, basename='comment')

urlpatterns = [
    path('health/', healthcheck, name='comments-healthcheck'),
]

urlpatterns += router.urls
