from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/artworks/', include('artworks.urls')),
    path('api/comments/', include('comments.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/qr/', include('qr.urls')),
    path('api/exhibitions/', include('exhibitions.urls')),
    path('api/notifications/', include('notifications.urls')),
]
