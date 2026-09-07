from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

import os
from uuid import uuid4
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import ArtistProfile
from .serializers import BecomeArtistSerializer, CurrentUserSerializer, ProfileUpdateSerializer, RegisterSerializer
from config.security import validate_and_store_upload

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(CurrentUserSerializer(user).data, status=status.HTTP_201_CREATED)


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_scope = 'login'


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(instance=request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CurrentUserSerializer(request.user).data)

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({'detail': 'Account permanently deleted.'}, status=status.HTTP_204_NO_CONTENT)


class BecomeArtistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if 'first_name' in request.data or 'last_name' in request.data:
            user = request.user
            if 'first_name' in request.data:
                user.first_name = request.data['first_name']
            if 'last_name' in request.data:
                user.last_name = request.data['last_name']
            user.save(update_fields=['first_name', 'last_name'])
        serializer = BecomeArtistSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        user = request.user
        user.refresh_from_db()
        return Response(
            {
                'user': CurrentUserSerializer(user).data,
                'artist_profile': BecomeArtistSerializer(profile).data,
            },
            status=status.HTTP_200_OK,
        )


class ArtistProfileSelfView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, permissions.serializers if hasattr(permissions, 'serializers') else APIView.parser_classes[0]]

    def get(self, request):
        profile = ArtistProfile.objects.filter(user=request.user).first()
        return Response(BecomeArtistSerializer(profile).data)

    def patch(self, request):
        profile, _ = ArtistProfile.objects.get_or_create(user=request.user)
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        avatar_file = request.FILES.get('avatar')
        if avatar_file:
            _, avatar_url = validate_and_store_upload(avatar_file, 'avatars', max_size_mb=5)
            data['avatar_url'] = avatar_url
        serializer = BecomeArtistSerializer(instance=profile, data=data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        user = request.user
        if not user.is_artist:
            user.is_artist = True
            user.save(update_fields=['is_artist'])
        return Response(serializer.data)

    def delete(self, request):
        profile, _ = ArtistProfile.objects.get_or_create(user=request.user)
        profile.avatar_url = ''
        profile.save(update_fields=['avatar_url', 'updated_at'])
        return Response(BecomeArtistSerializer(profile).data)
