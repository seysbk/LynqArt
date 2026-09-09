import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0005_alter_user_username_contactmessage'),
    ]

    operations = [
        migrations.CreateModel(
            name='FeedbackMessage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('sender_name', models.CharField(blank=True, default='', max_length=150)),
                ('sender_email', models.EmailField(blank=True, default='', max_length=254)),
                ('category', models.CharField(choices=[('general', 'General feedback'), ('bug', 'Report a problem'), ('idea', 'Feature idea'), ('content', 'Content or accessibility feedback')], default='general', max_length=32)),
                ('message', models.TextField()),
                ('page_url', models.CharField(blank=True, default='', max_length=500)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='feedback_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ('-created_at',)},
        ),
    ]
