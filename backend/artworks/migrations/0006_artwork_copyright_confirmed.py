from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('artworks', '0005_artwork_availability_status_artwork_copyright_holder_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='artwork',
            name='copyright_confirmed',
            field=models.BooleanField(default=False),
        ),
    ]
