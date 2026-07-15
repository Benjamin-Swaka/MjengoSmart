# ============================================================
# MjengoSmart — Supplier Model
# ============================================================

from django.contrib.gis.db import models as gis_models
from django.db              import models
from users.models           import User


class Supplier(models.Model):
    user          = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='supplier_profile',
    )
    business_name = models.CharField(max_length=200)
    description   = models.TextField(blank=True)
    address       = models.CharField(max_length=300)
    latitude      = models.FloatField(default=0.0)
    longitude     = models.FloatField(default=0.0)
    location      = gis_models.PointField(
        null=True, blank=True, srid=4326
    )
    rating        = models.FloatField(default=0.0)
    phone         = models.CharField(max_length=20, blank=True)
    email         = models.EmailField(blank=True)
    opening_hours = models.CharField(
        max_length=100,
        default='Mon–Sat: 7am–6pm',
    )
    is_open_now   = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table            = 'suppliers'
        ordering            = ['-rating']
        verbose_name        = 'Supplier'
        verbose_name_plural = 'Suppliers'

    def __str__(self):
        return self.business_name

    def save(self, *args, **kwargs):
        # Keep PostGIS PointField in sync with lat/lng floats
        if self.latitude and self.longitude:
            from django.contrib.gis.geos import Point
            self.location = Point(self.longitude, self.latitude, srid=4326)
        super().save(*args, **kwargs)