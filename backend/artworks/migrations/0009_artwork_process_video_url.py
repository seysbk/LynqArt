from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('artworks', '0008_artworkcontributor_is_lead'),
    ]

    operations = [
        migrations.AddField(
            model_name='artwork',
            name='process_video_url',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]
