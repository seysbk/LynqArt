from rest_framework import serializers

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
        read_only_fields = ('id', 'qr_image_path', 'scans', 'created_at')

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

        return attrs


class QRScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRScan
        fields = ('id', 'qr_code', 'visitor_hash', 'scanned_at')
        read_only_fields = ('id', 'scanned_at')
