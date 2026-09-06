from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('analytics', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='artworkview',
            name='source',
            field=models.CharField(
                choices=[
                    ('qr', 'QR'),
                    ('direct', 'Direct'),
                    ('shared_link', 'Shared link'),
                    ('artist_profile', 'Artist profile'),
                    ('exhibition', 'Exhibition'),
                    ('internal_search', 'Internal search'),
                    ('unknown', 'Unknown'),
                ],
                default='unknown',
                max_length=32,
            ),
        ),
        migrations.AddIndex(
            model_name='artworkview',
            index=models.Index(fields=['artwork', 'viewed_at'], name='analytics_a_artwork_8dce1e_idx'),
        ),
        migrations.AddIndex(
            model_name='artworkview',
            index=models.Index(fields=['artwork', 'visitor_hash'], name='analytics_a_artwork_9c2ca9_idx'),
        ),
        migrations.AddIndex(
            model_name='artworkview',
            index=models.Index(fields=['source', 'viewed_at'], name='analytics_a_source_3f5d22_idx'),
        ),
    ]
