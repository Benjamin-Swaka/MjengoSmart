# ============================================================
# MjengoSmart — Orders, Workers, Booking Requests
# Fixed: all fields have explicit defaults for clean migrations
# ============================================================

from django.db        import models
from django.utils     import timezone
from users.models     import User
from materials.models import Material


class Worker(models.Model):
    SKILL_CHOICES = [
        ('Mason',          'Mason'),
        ('Plumber',        'Plumber'),
        ('Electrician',    'Electrician'),
        ('Carpenter',      'Carpenter'),
        ('Painter',        'Painter'),
        ('Welder',         'Welder'),
        ('Tiler',          'Tiler'),
        ('Roofer',         'Roofer'),
        ('General Labour', 'General Labour'),
        ('Supervisor',     'Supervisor'),
    ]

    user             = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='worker_profile',
    )
    skill_type       = models.CharField(
        max_length=30,
        choices=SKILL_CHOICES,
        default='Mason',
    )
    bio              = models.TextField(blank=True, default='')
    daily_rate       = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
    )
    experience_years = models.PositiveIntegerField(default=0)
    latitude         = models.FloatField(null=True, blank=True)
    longitude        = models.FloatField(null=True, blank=True)
    location_name    = models.CharField(
        max_length=200,
        blank=True,
        default='',
    )
    rating           = models.FloatField(default=0.0)
    is_available     = models.BooleanField(default=True)
    portfolio_url    = models.URLField(
        blank=True,
        default='',        # ← explicit default prevents migration prompt
    )
    created_at       = models.DateTimeField(
        default=timezone.now,  # ← explicit default prevents migration prompt
    )

    class Meta:
        db_table            = 'workers'
        ordering            = ['-rating']
        verbose_name        = 'Worker'
        verbose_name_plural = 'Workers'

    def __str__(self):
        return (
            f'{self.user.get_full_name() or self.user.username} '
            f'— {self.skill_type}'
        )


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending',    'Pending'),
        ('confirmed',  'Confirmed'),
        ('dispatched', 'Dispatched'),
        ('delivered',  'Delivered'),
        ('cancelled',  'Cancelled'),
    ]

    client           = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders',
    )
    material         = models.ForeignKey(
        Material,
        on_delete=models.CASCADE,
        related_name='orders',
    )
    quantity         = models.PositiveIntegerField(default=1)
    total_price      = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )
    status           = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
    )
    delivery_address = models.CharField(
        max_length=300,
        default='',
    )
    notes            = models.TextField(blank=True, default='')
    created_at       = models.DateTimeField(default=timezone.now)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table            = 'orders'
        ordering            = ['-created_at']
        verbose_name        = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return (
            f'Order #{self.id} — '
            f'{self.material.name} x{self.quantity} '
            f'({self.status})'
        )

    def save(self, *args, **kwargs):
        # Auto-calculate total price from quantity × unit price
        if self.quantity and self.material_id:
            self.total_price = self.quantity * self.material.price
        super().save(*args, **kwargs)


class BookingRequest(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('accepted',  'Accepted'),
        ('declined',  'Declined'),
        ('completed', 'Completed'),
    ]

    client      = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings_as_client',
    )
    worker      = models.ForeignKey(
        Worker,
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    start_date  = models.DateField()
    end_date    = models.DateField()
    description = models.TextField(default='')
    agreed_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,              # ← explicit default prevents migration prompt
    )
    status      = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
    )
    created_at  = models.DateTimeField(default=timezone.now)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table            = 'booking_requests'
        ordering            = ['-created_at']
        verbose_name        = 'Booking Request'
        verbose_name_plural = 'Booking Requests'

    def __str__(self):
        return (
            f'Booking #{self.id} — '
            f'{self.client.username} → '
            f'{self.worker} ({self.status})'
        )