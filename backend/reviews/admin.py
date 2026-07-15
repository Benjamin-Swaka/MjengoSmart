from django.contrib import admin
from .models        import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = [
        'reviewer', 'target_type', 'target_id',
        'rating', 'created_at',
    ]
    list_filter   = ['target_type', 'rating']
    search_fields = ['reviewer__username', 'comment']
    ordering      = ['-created_at']