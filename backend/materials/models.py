# ============================================================
# MjengoSmart — Material Model
# ============================================================

from django.db      import models
from suppliers.models import Supplier


class Material(models.Model):
    CATEGORY_CHOICES = [
        ('Cement',     'Cement'),
        ('Steel',      'Steel'),
        ('Timber',     'Timber'),
        ('Sand',       'Sand'),
        ('Roofing',    'Roofing'),
        ('Tiles',      'Tiles'),
        ('Paint',      'Paint'),
        ('Electrical', 'Electrical'),
        ('Plumbing',   'Plumbing'),
        ('Other',      'Other'),
    ]

    supplier       = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name='materials',
    )
    name           = models.CharField(max_length=200)
    description    = models.TextField(blank=True)
    category       = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='Other',
    )
    price          = models.DecimalField(max_digits=10, decimal_places=2)
    unit           = models.CharField(max_length=50, default='piece')
    stock_quantity = models.PositiveIntegerField(default=0)
    image          = models.ImageField(
        upload_to='materials/',
        null=True,
        blank=True,
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table            = 'materials'
        ordering            = ['category', 'name']
        verbose_name        = 'Material'
        verbose_name_plural = 'Materials'

    def __str__(self):
        return f'{self.name} — {self.supplier.business_name}'

    @property
    def is_in_stock(self):
        return self.stock_quantity > 0