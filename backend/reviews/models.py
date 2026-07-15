# ============================================================
# MjengoSmart — Review Model
# Automatically updates Supplier/Worker rating on save
# ============================================================

from django.db    import models
from users.models import User


class Review(models.Model):
    TARGET_CHOICES = [
        ('supplier', 'Supplier'),
        ('worker',   'Worker'),
    ]

    reviewer    = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_given',
    )
    target_type = models.CharField(max_length=10, choices=TARGET_CHOICES)
    target_id   = models.PositiveIntegerField()
    rating      = models.PositiveSmallIntegerField()  # 1–5
    comment     = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table            = 'reviews'
        ordering            = ['-created_at']
        verbose_name        = 'Review'
        verbose_name_plural = 'Reviews'
        unique_together     = ['reviewer', 'target_type', 'target_id']

    def __str__(self):
        return (
            f'{self.reviewer.username} → '
            f'{self.target_type} #{self.target_id} '
            f'({self.rating}★)'
        )

    def save(self, *args, **kwargs):
        # Validate rating range
        if not (1 <= self.rating <= 5):
            raise ValueError('Rating must be between 1 and 5.')

        super().save(*args, **kwargs)
        self._update_target_rating()

        # Send notification to the reviewed target
        self._notify_target()

    def _update_target_rating(self):
        """Recalculate and persist the denormalised rating."""
        reviews = Review.objects.filter(
            target_type=self.target_type,
            target_id=self.target_id,
        )
        avg = reviews.aggregate(
            avg=models.Avg('rating')
        )['avg'] or 0.0

        if self.target_type == 'supplier':
            from suppliers.models import Supplier
            Supplier.objects.filter(pk=self.target_id).update(
                rating=round(avg, 2)
            )
        elif self.target_type == 'worker':
            from orders.models import Worker
            Worker.objects.filter(pk=self.target_id).update(
                rating=round(avg, 2)
            )

    def _notify_target(self):
        """Notify the supplier/worker that they received a review."""
        try:
            from notifications.models import Notification

            if self.target_type == 'supplier':
                from suppliers.models import Supplier
                target_user = Supplier.objects.get(pk=self.target_id).user
            else:
                from orders.models import Worker
                target_user = Worker.objects.get(pk=self.target_id).user

            Notification.objects.create(
                user=target_user,
                notif_type='review_received',
                title='New Review Received',
                message=(
                    f'{self.reviewer.get_full_name() or self.reviewer.username} '
                    f'gave you {self.rating}★: '
                    f'"{self.comment[:80]}{"…" if len(self.comment) > 80 else ""}"'
                ),
            )
        except Exception:
            pass