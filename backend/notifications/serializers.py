from rest_framework import serializers

from accounts.serializers import UserBriefSerializer
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'user', 'title', 'message', 'type', 'is_read', 'created_at')
        read_only_fields = ('id', 'created_at')
