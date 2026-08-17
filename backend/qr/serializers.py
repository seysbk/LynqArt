from rest_framework import serializers
from django.utils.text import slugify

from artworks.models import Artwork
from exhibitions.models import Exhibition

from .models import QRCode, QRScan


class QRCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRCode
        fields = (
            'id',
            'entity_type',
            'entity_id',
            'qr_slug',
            'qr_image_path',
            'qr_image_url',
            'scans',
            'created_at',
        )
        read_only_fields = ('id', 'qr_slug', 'qr_image_path', 'scans', 'created_at')

    def create(self, validated_data):
        entity_type = validated_data['entity_type']
        model = Artwork if entity_type == QRCode.ENTITY_ARTWORK else Exhibition
        target = model.objects.get(pk=validated_data['entity_id'])
        base = f'{entity_type}-{slugify(target.slug)}'
        candidate, number = base, 1
        while QRCode.objects.filter(qr_slug=candidate).exists():
            candidate = f'{base}-{number}'
            number += 1
        validated_data['qr_slug'] = candidate
        return super().create(validated_data)

    def validate(self, attrs):
        entity_type = attrs.get('entity_type', getattr(self.instance, 'entity_type', ''))
        entity_id = attrs.get('entity_id', getattr(self.instance, 'entity_id', None))
        request = self.context.get('request')

        if not entity_type:
            raise serializers.ValidationError({'entity_type': 'This field is required.'})
        if not entity_id:
            raise serializers.ValidationError({'entity_id': 'This field is required.'})

        if request and request.method in {'POST', 'PUT', 'PATCH'}:
            user = request.user
            if entity_type == QRCode.ENTITY_EXHIBITION and not getattr(user, 'can_manage_exhibitions', False):
                raise serializers.ValidationError({'entity_type': 'Exhibition QR creation requires exhibition management permission.'})
            if entity_type == QRCode.ENTITY_ARTWORK and not getattr(user, 'is_artist', False):
                raise serializers.ValidationError({'entity_type': 'Artwork QR creation requires artist permission.'})
            if entity_type == QRCode.ENTITY_ARTWORK and not Artwork.objects.filter(pk=entity_id, artist=user).exists():
                raise serializers.ValidationError({'entity_id': 'You can only generate QR codes for your own artworks.'})
            if entity_type == QRCode.ENTITY_EXHIBITION and not Exhibition.objects.filter(pk=entity_id, organizer=user).exists() and not user.is_staff:
                raise serializers.ValidationError({'entity_id': 'You can only generate QR codes for exhibitions you manage.'})

        return attrs


class QRScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRScan
        fields = ('id', 'qr_code', 'visitor_hash', 'scanned_at')
        read_only_fields = ('id', 'scanned_at')
