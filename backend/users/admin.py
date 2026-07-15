from django.contrib              import admin
from django.contrib.auth.admin   import UserAdmin as BaseUserAdmin
from .models                     import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = [
        'username', 'email', 'first_name',
        'last_name', 'role', 'is_verified',
    ]
    list_filter   = ['role', 'is_verified', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    fieldsets     = BaseUserAdmin.fieldsets + (
        ('MjengoSmart', {
            'fields': (
                'role', 'phone', 'location_name',
                'latitude', 'longitude', 'is_verified',
            )
        }),
    )