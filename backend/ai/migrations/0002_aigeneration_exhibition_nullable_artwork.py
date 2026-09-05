from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('ai', '0001_initial'),
        ('exhibitions', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='aigeneration',
            name='artwork',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='ai_generations',
                to='artworks.artwork',
            ),
        ),
        migrations.AddField(
            model_name='aigeneration',
            name='exhibition',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='ai_generations',
                to='exhibitions.exhibition',
            ),
        ),
    ]
