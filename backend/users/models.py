# ============================================================
# MjengoSmart — Custom User Model
# ============================================================

from django.contrib.auth.models import AbstractUser
from django.db                  import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('client',   'Client / Homebuilder'),
        ('supplier', 'Hardware Supplier'),
        ('worker',   'Skilled Worker (Fundi)'),
        ('admin',    'Administrator'),
    ]

    role          = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    phone         = models.CharField(max_length=20, blank=True)
    location_name = models.CharField(max_length=200, blank=True)
    latitude      = models.FloatField(null=True, blank=True)
    longitude     = models.FloatField(null=True, blank=True)
    is_verified   = models.BooleanField(default=False)

    class Meta:
        db_table = 'users'
        verbose_name        = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.role})'