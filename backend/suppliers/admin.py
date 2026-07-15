from django.contrib import admin
from .models        import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display  = [
        'business_name', 'user', 'address',
        'rating', 'is_open_now',
    ]
    list_filter   = ['is_open_now']
    search_fields = ['business_name', 'address', 'user__username']
    ordering      = ['-rating']