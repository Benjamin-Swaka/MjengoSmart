# ============================================================
# MjengoSmart — Material Serializers
# ============================================================

from rest_framework import serializers
from .models        import Material


class MaterialSerializer(serializers.ModelSerializer):
    supplier_name     = serializers.CharField(
        source='supplier.business_name',
        read_only=True,
    )
    supplier_location = serializers.CharField(
        source='supplier.address',
        read_only=True,
    )
    is_in_stock       = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Material
        fields = [
            'id', 'supplier', 'supplier_name', 'supplier_location',
            'name', 'description', 'category',
            'price', 'unit', 'stock_quantity',
            'is_in_stock', 'image',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']