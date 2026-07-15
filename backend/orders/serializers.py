# ============================================================
# MjengoSmart — Orders & Bookings Serializers
# ============================================================

from rest_framework import serializers
from .models        import Worker, Order, BookingRequest


class WorkerSerializer(serializers.ModelSerializer):
    full_name     = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    distance_km   = serializers.SerializerMethodField()

    class Meta:
        model  = Worker
        fields = [
            'id', 'user', 'full_name',
            'skill_type', 'bio',
            'daily_rate', 'experience_years',
            'latitude', 'longitude', 'location_name',
            'rating', 'is_available',
            'portfolio_url',
            'reviews_count', 'distance_km',
            'created_at',
        ]
        read_only_fields = ['id', 'rating', 'created_at']

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_reviews_count(self, obj):
        from reviews.models import Review
        return Review.objects.filter(
            target_type='worker', target_id=obj.id
        ).count()

    def get_distance_km(self, obj):
        return getattr(obj, 'distance_km', None)


class OrderSerializer(serializers.ModelSerializer):
    material_name  = serializers.CharField(
        source='material.name', read_only=True
    )
    material_unit  = serializers.CharField(
        source='material.unit', read_only=True
    )
    supplier_name  = serializers.CharField(
        source='material.supplier.business_name', read_only=True
    )
    client_name    = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            'id', 'client', 'client_name',
            'material', 'material_name', 'material_unit',
            'supplier_name',
            'quantity', 'total_price', 'status',
            'delivery_address', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'client', 'total_price',
            'created_at', 'updated_at',
        ]

    def get_client_name(self, obj):
        return obj.client.get_full_name() or obj.client.username


class BookingRequestSerializer(serializers.ModelSerializer):
    client_name  = serializers.SerializerMethodField()
    worker_name  = serializers.SerializerMethodField()
    worker_skill = serializers.CharField(
        source='worker.skill_type', read_only=True
    )
    total_days   = serializers.SerializerMethodField()
    total_cost   = serializers.SerializerMethodField()

    class Meta:
        model  = BookingRequest
        fields = [
            'id', 'client', 'client_name',
            'worker', 'worker_name', 'worker_skill',
            'start_date', 'end_date',
            'description', 'agreed_rate', 'status',
            'total_days', 'total_cost',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'client', 'created_at', 'updated_at'
        ]

    def get_client_name(self, obj):
        return obj.client.get_full_name() or obj.client.username

    def get_worker_name(self, obj):
        return (
            obj.worker.user.get_full_name()
            or obj.worker.user.username
        )

    def get_total_days(self, obj):
        delta = obj.end_date - obj.start_date
        return max(1, delta.days + 1)

    def get_total_cost(self, obj):
        delta = obj.end_date - obj.start_date
        days  = max(1, delta.days + 1)
        return float(obj.agreed_rate) * days