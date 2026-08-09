from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ArtistProfile
from .serializers import BecomeArtistSerializer, CurrentUserSerializer, ProfileUpdateSerializer, RegisterSerializer

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(CurrentUserSerializer(user).data, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(CurrentUserSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(instance=request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CurrentUserSerializer(request.user).data)


class BecomeArtistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
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

    def get(self, request):
        profile, _ = ArtistProfile.objects.get_or_create(user=request.user)
        return Response(BecomeArtistSerializer(profile).data)

    def patch(self, request):
        profile, _ = ArtistProfile.objects.get_or_create(user=request.user)
        serializer = BecomeArtistSerializer(instance=profile, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
