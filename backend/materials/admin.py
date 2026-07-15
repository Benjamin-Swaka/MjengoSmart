from django.contrib import admin
from .models        import Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display  = [
        'name', 'supplier', 'category',
        'price', 'unit', 'stock_quantity',
    ]
    list_filter   = ['category']
    search_fields = ['name', 'supplier__business_name']
    ordering      = ['category', 'name']