from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0007_user_is_moderator'),
        ('comments', '0003_report_target_expert_review'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='assigned_moderator',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_reports', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='report',
            name='moderator_response',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='report',
            name='resolution',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='report',
            name='resolved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_reports', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='report',
            name='resolved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='report',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='report',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending Review'), ('reviewed', 'Reviewed'), ('dismissed', 'Dismissed'), ('actioned', 'Actioned'), ('escalated', 'Escalated to Staff')], default='pending', max_length=20),
        ),
        migrations.CreateModel(
            name='ModerationAction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[('dismiss', 'Dismiss report'), ('warn', 'Warn user'), ('hide_comment', 'Hide comment'), ('remove_comment', 'Remove comment'), ('hide_artwork', 'Hide artwork'), ('request_changes', 'Request changes'), ('escalate_to_staff', 'Escalate to staff'), ('resolve', 'Resolve report')], max_length=32)),
                ('internal_note', models.TextField(blank=True, default='')),
                ('public_response', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='moderation_actions', to=settings.AUTH_USER_MODEL)),
                ('report', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='actions', to='comments.report')),
            ],
            options={'ordering': ('created_at',)},
        ),
    ]
