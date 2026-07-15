# ============================================================
# MjengoSmart — Orders Admin Registration
# ============================================================

from django.contrib import admin
from .models        import Worker, Order, BookingRequest


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display  = [
        'user', 'skill_type', 'daily_rate',
        'experience_years', 'rating', 'is_available',
    ]
    list_filter   = ['skill_type', 'is_available']
    search_fields = ['user__username', 'user__first_name', 'skill_type']
    ordering      = ['-rating']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = [
        'id', 'client', 'material', 'quantity',
        'total_price', 'status', 'created_at',
    ]
    list_filter   = ['status']
    search_fields = ['client__username', 'material__name']
    ordering      = ['-created_at']


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display  = [
        'id', 'client', 'worker', 'start_date',
        'end_date', 'agreed_rate', 'status',
    ]
    list_filter   = ['status']
    search_fields = ['client__username', 'worker__user__username']
    ordering      = ['-created_at']