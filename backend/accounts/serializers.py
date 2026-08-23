from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import ArtistProfile

User = get_user_model()


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        login_value = attrs.get(self.username_field) or attrs.get('email')
        if login_value and '@' in login_value:
            try:
                user = User.objects.get(email__iexact=login_value)
            except User.DoesNotExist:
                pass
            else:
                attrs[self.username_field] = user.get_username()
        attrs.pop('email', None)
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'is_artist',
            'is_expert',
            'is_verified',
            'can_manage_exhibitions',
            'is_active',
            'date_joined',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'date_joined', 'created_at', 'updated_at')


class ArtistProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source='user', queryset=User.objects.all(), write_only=True)
    avatar_url = serializers.CharField(allow_blank=True, required=False, default='')
    website = serializers.CharField(allow_blank=True, required=False, default='')
    instagram = serializers.CharField(allow_blank=True, required=False, default='')
    twitter = serializers.CharField(allow_blank=True, required=False, default='')
    linkedin = serializers.CharField(allow_blank=True, required=False, default='')
    youtube = serializers.CharField(allow_blank=True, required=False, default='')
    facebook = serializers.CharField(allow_blank=True, required=False, default='')
    tiktok = serializers.CharField(allow_blank=True, required=False, default='')
    pinterest = serializers.CharField(allow_blank=True, required=False, default='')

    class Meta:
        model = ArtistProfile
        fields = (
            'id',
            'user',
            'user_id',
            'bio',
            'avatar_url',
            'website',
            'instagram',
            'twitter',
            'linkedin',
            'youtube',
            'facebook',
            'tiktok',
            'pinterest',
            'phone',
            'location',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class CurrentUserSerializer(UserSerializer):
    artist_profile = ArtistProfileSerializer(read_only=True)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ('artist_profile',)


class UserBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'full_name', 'email', 'is_artist', 'is_expert')
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    protected_fields = {'is_artist', 'is_expert', 'is_verified', 'can_manage_exhibitions', 'is_staff', 'is_superuser'}

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password', 'password_confirm')
        read_only_fields = ('id',)

    def validate(self, attrs):
        forbidden = self.protected_fields.intersection(self.initial_data.keys())
        if forbidden:
            raise serializers.ValidationError({field: 'This field cannot be set during registration.' for field in sorted(forbidden)})
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save(update_fields=['password'])
        return user


class BecomeArtistSerializer(serializers.ModelSerializer):
    protected_fields = {'is_artist', 'is_expert', 'is_verified', 'can_manage_exhibitions', 'is_staff', 'is_superuser'}
    avatar_url = serializers.CharField(allow_blank=True, required=False, default='')
    website = serializers.CharField(allow_blank=True, required=False, default='')
    instagram = serializers.CharField(allow_blank=True, required=False, default='')
    twitter = serializers.CharField(allow_blank=True, required=False, default='')
    linkedin = serializers.CharField(allow_blank=True, required=False, default='')
    youtube = serializers.CharField(allow_blank=True, required=False, default='')
    facebook = serializers.CharField(allow_blank=True, required=False, default='')
    tiktok = serializers.CharField(allow_blank=True, required=False, default='')
    pinterest = serializers.CharField(allow_blank=True, required=False, default='')

    class Meta:
        model = ArtistProfile
        fields = (
            'bio',
            'avatar_url',
            'website',
            'instagram',
            'twitter',
            'linkedin',
            'youtube',
            'facebook',
            'tiktok',
            'pinterest',
            'phone',
            'location',
        )

    def validate(self, attrs):
        forbidden = self.protected_fields.intersection(self.initial_data.keys())
        if forbidden:
            raise serializers.ValidationError({field: 'This field cannot be set through artist enrollment.' for field in sorted(forbidden)})
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        user = request.user
        if user.is_artist:
            profile, _ = ArtistProfile.objects.get_or_create(user=user, defaults=validated_data)
            return profile

        user.is_artist = True
        user.save(update_fields=['is_artist'])
        profile, created = ArtistProfile.objects.get_or_create(user=user, defaults=validated_data)
        if not created:
            for key, value in validated_data.items():
                setattr(profile, key, value)
            profile.save()
        return profile


class ProfileUpdateSerializer(serializers.ModelSerializer):
    protected_fields = {'is_artist', 'is_expert', 'is_verified', 'can_manage_exhibitions', 'is_staff', 'is_superuser', 'email', 'username'}

    class Meta:
        model = User
        fields = ('first_name', 'last_name')

    def validate(self, attrs):
        forbidden = self.protected_fields.intersection(self.initial_data.keys())
        if forbidden:
            raise serializers.ValidationError({field: 'This field cannot be changed here.' for field in sorted(forbidden)})
        return attrs
