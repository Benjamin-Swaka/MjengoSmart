# ============================================================
# MjengoSmart — Supplier Serializers
# ============================================================

from rest_framework import serializers
from .models        import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    owner_name      = serializers.SerializerMethodField()
    distance_km     = serializers.SerializerMethodField()
    materials_count = serializers.SerializerMethodField()

    class Meta:
        model  = Supplier
        fields = [
            'id', 'user', 'owner_name',
            'business_name', 'description',
            'address', 'latitude', 'longitude',
            'rating', 'phone', 'email',
            'opening_hours', 'is_open_now',
            'distance_km', 'materials_count',
            'created_at',
        ]
        read_only_fields = ['id', 'rating', 'created_at']

    def get_owner_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_distance_km(self, obj):
        # Attached by the view when GIS query runs
        return getattr(obj, 'distance_km', None)

    def get_materials_count(self, obj):
        return obj.materials.filter(stock_quantity__gt=0).count()


class SupplierDetailSerializer(SupplierSerializer):
    """Includes full material list for the detail view."""
    from materials.serializers import MaterialSerializer
    materials = serializers.SerializerMethodField()

    class Meta(SupplierSerializer.Meta):
        fields = SupplierSerializer.Meta.fields + ['materials']

    def get_materials(self, obj):
        from materials.serializers import MaterialSerializer
        return MaterialSerializer(
            obj.materials.all(), many=True
        ).data