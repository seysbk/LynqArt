from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('comments', '0002_report'),
        ('reviews', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='target_expert_review',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='reports',
                to='reviews.expertreview',
            ),
        ),
    ]
