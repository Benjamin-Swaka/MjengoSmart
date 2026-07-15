from django.db    import models
from users.models import User


class Notification(models.Model):
    TYPE_CHOICES = [
        ('order_update',    'Order Update'),
        ('booking_request', 'Booking Request'),
        ('review_received', 'Review Received'),
        ('system',          'System'),
    ]

    user       = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    notif_type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default='system'
    )
    title      = models.CharField(max_length=200)
    message    = models.TextField()
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table            = 'notifications'
        ordering            = ['-created_at']
        verbose_name        = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f'[{self.notif_type}] {self.title} → {self.user.username}'