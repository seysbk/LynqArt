from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from comments.models import Comment, Favorite, Report
from exhibitions.models import ExhibitionArtwork
from reviews.models import ExpertReview

from .models import Notification


def _display_name(user):
    return user.get_full_name() or user.username


@receiver(post_save, sender=Comment)
def notify_on_comment(sender, instance, created, **kwargs):
    if not created:
        return
    artwork = instance.artwork
    if instance.parent_comment_id:
        recipient = instance.parent_comment.user
        if recipient != instance.user:
            Notification.objects.create(
                user=recipient,
                title=f'New reply on {artwork.title}',
                message=f'{_display_name(instance.user)} replied to your comment:\n\n"{instance.comment}"',
                type='reply',
                sender_email=getattr(instance.user, 'email', ''),
            )
        if artwork.artist != instance.user and artwork.artist != recipient:
            Notification.objects.create(
                user=artwork.artist,
                title=f'New reply on {artwork.title}',
                message=f'{_display_name(instance.user)} replied to a comment on your artwork:\n\n"{instance.comment}"',
                type='reply',
                sender_email=getattr(instance.user, 'email', ''),
            )
    elif artwork.artist != instance.user:
        Notification.objects.create(
            user=artwork.artist,
            title=f'New comment on {artwork.title}',
            message=f'{_display_name(instance.user)} left a comment on your artwork:\n\n"{instance.comment}"',
            type='comment',
            sender_email=getattr(instance.user, 'email', ''),
        )


@receiver(post_save, sender=Favorite)
def notify_on_favorite(sender, instance, created, **kwargs):
    if created and instance.artwork.artist != instance.user:
        Notification.objects.create(
            user=instance.artwork.artist,
            title=f'Artwork bookmarked: {instance.artwork.title}',
            message=f'{_display_name(instance.user)} added your artwork to their bookmarks.',
            type='favorite',
            sender_email=getattr(instance.user, 'email', ''),
        )


@receiver(post_save, sender=ExpertReview)
def notify_on_expert_review(sender, instance, created, **kwargs):
    if created and instance.artwork.artist != instance.reviewer:
        Notification.objects.create(
            user=instance.artwork.artist,
            title=f'Expert review: {instance.artwork.title}',
            message=f'{_display_name(instance.reviewer)} published an expert critique on your work:\n\n"{instance.title}"\n{instance.markdown_review}',
            type='review',
            sender_email=getattr(instance.reviewer, 'email', ''),
        )


@receiver(post_save, sender=ExhibitionArtwork)
def notify_on_exhibition_link(sender, instance, created, **kwargs):
    if created:
        artist = instance.artwork.artist
        organizer = instance.exhibition.organizer
        if artist != organizer:
            Notification.objects.create(
                user=artist,
                title=f'Included in exhibition: {instance.exhibition.title}',
                message=(
                    f"Your artwork '{instance.artwork.title}' was added to "
                    f"'{instance.exhibition.title}' by {_display_name(organizer)}."
                ),
                type='exhibition',
                sender_email=getattr(organizer, 'email', ''),
            )


@receiver(pre_save, sender=Report)
def capture_report_moderation_changes(sender, instance, **kwargs):
    if not instance.pk:
        instance._moderation_changed = False
        return

    previous = sender.objects.filter(pk=instance.pk).values('status', 'moderator_notes').first()
    instance._moderation_changed = bool(
        previous and (
            previous['status'] != instance.status
            or previous['moderator_notes'] != instance.moderator_notes
        )
    )


@receiver(post_save, sender=Report)
def notify_reporter_on_moderation(sender, instance, created, **kwargs):
    if created or not instance.reporter_id or not getattr(instance, '_moderation_changed', False):
        return

    target = instance.target_artwork or instance.target_exhibition or instance.target_comment or instance.target_expert_review or instance.target_user
    target_name = getattr(target, 'title', None) or getattr(target, 'comment', None) or _display_name(target) if target else 'reported content'
    status_label = instance.get_status_display()
    notes = instance.moderator_notes.strip() or 'No additional moderator notes were provided.'
    Notification.objects.create(
        user=instance.reporter,
        title=f'Report update: {status_label}',
        message=(
            f'Your report about {target_name} has been marked {status_label.lower()}.'
            f'\n\nModerator notes:\n{notes}'
        ),
        type='report',
    )
