import os
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

import os
from uuid import uuid4
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import ArtistProfile
from .serializers import BecomeArtistSerializer, CurrentUserSerializer, ProfileUpdateSerializer, RegisterSerializer
from config.security import validate_and_store_upload
from config.storage import delete_stored_file

User = get_user_model()


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'login'

    def post(self, request):
        token = request.data.get('token') or request.data.get('credential')
        if not token or not isinstance(token, str):
            return Response(
                {'detail': 'Valid Google ID token (credential) is required for Google Sign-In.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if not client_id:
            return Response(
                {'detail': 'Google Sign-In is not configured on the server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            google_resp = requests.get(
                'https://oauth2.googleapis.com/tokeninfo',
                params={'id_token': token},
                timeout=5,
            )
            if google_resp.status_code != 200:
                return Response(
                    {'detail': 'Invalid or expired Google credential token.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            data = google_resp.json()
        except requests.RequestException:
            return Response(
                {'detail': 'Google token verification failed due to a network error.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValueError:
            return Response(
                {'detail': 'Google returned an invalid token verification response.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # tokeninfo validates the signature and expiry. These checks bind the
        # credential to this application and ensure the account is trustworthy.
        issuer = data.get('iss')
        if (
            data.get('aud') != client_id
            or issuer not in {'accounts.google.com', 'https://accounts.google.com'}
            or str(data.get('email_verified')).lower() != 'true'
            or not data.get('sub')
            or not data.get('email')
        ):
            return Response(
                {'detail': 'Google credential did not pass application validation.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = data['email'].lower().strip()
        first_name = data.get('given_name', '')
        last_name = data.get('family_name', '')
        picture = data.get('picture', '')
        auth_mode = request.data.get('mode', 'register')

        user = User.objects.filter(email__iexact=email).first()

        if not user and auth_mode == 'login':
            return Response(
                {'detail': 'Failed to sign in. Have you signed up?'} ,
                status=status.HTTP_404_NOT_FOUND,
            )

        if not user:
            base_username = slugify(email.split('@')[0]).replace('-', '_') or 'user'
            candidate_username = base_username
            count = 1
            while User.objects.filter(username__iexact=candidate_username).exists():
                candidate_username = f'{base_username}_{count}'
                count += 1

            user = User.objects.create_user(
                username=candidate_username,
                email=email,
                first_name=first_name,
                last_name=last_name,
            )
            user.set_unusable_password()
            user.is_verified = True
            user.save()

            if picture:
                ArtistProfile.objects.get_or_create(user=user, defaults={'avatar_url': picture})
        else:
            if not user.first_name and first_name:
                user.first_name = first_name
            if not user.last_name and last_name:
                user.last_name = last_name
            user.is_verified = True
            user.save(update_fields=['first_name', 'last_name', 'is_verified'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': CurrentUserSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_200_OK)


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
            old_avatar_url = profile.avatar_url
            _, avatar_url = validate_and_store_upload(avatar_file, 'avatars', max_size_mb=5)
            data['avatar_url'] = avatar_url
        else:
            old_avatar_url = ''
        serializer = BecomeArtistSerializer(instance=profile, data=data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if old_avatar_url and old_avatar_url != profile.avatar_url:
            delete_stored_file(old_avatar_url)
        user = request.user
        if not user.is_artist:
            user.is_artist = True
            user.save(update_fields=['is_artist'])
        return Response(serializer.data)

    def delete(self, request):
        profile, _ = ArtistProfile.objects.get_or_create(user=request.user)
        old_avatar_url = profile.avatar_url
        profile.avatar_url = ''
        profile.save(update_fields=['avatar_url', 'updated_at'])
        delete_stored_file(old_avatar_url)
        return Response(BecomeArtistSerializer(profile).data)
