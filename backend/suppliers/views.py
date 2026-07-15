# ============================================================
# MjengoSmart — Supplier Views
# Supports GIS radius query: ?lat=&lng=&radius=
# ============================================================

import math
from rest_framework             import status
from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response    import Response

from .models      import Supplier
from .serializers import SupplierSerializer, SupplierDetailSerializer


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two lat/lng points."""
    R    = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a    = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


@api_view(['GET'])
@permission_classes([AllowAny])
def supplier_list(request):
    """
    GET /api/suppliers/
    Optional query params: ?lat=&lng=&radius= (radius in metres)
    """
    suppliers = Supplier.objects.all().select_related('user')

    # Search filter
    search = request.query_params.get('search', '').strip()
    if search:
        suppliers = suppliers.filter(business_name__icontains=search)

    # GIS distance filter
    lat    = request.query_params.get('lat')
    lng    = request.query_params.get('lng')
    radius = request.query_params.get('radius')

    if lat and lng:
        try:
            user_lat    = float(lat)
            user_lng    = float(lng)
            radius_km   = float(radius) / 1000 if radius else 50.0

            # Attach distance to each supplier
            results = []
            for s in suppliers:
                if s.latitude and s.longitude:
                    dist = haversine_distance(
                        user_lat, user_lng,
                        s.latitude, s.longitude
                    )
                    if dist <= radius_km:
                        s.distance_km = round(dist, 2)
                        results.append(s)

            # Sort by distance
            results.sort(key=lambda x: x.distance_km)
            serializer = SupplierSerializer(results, many=True)
            return Response(serializer.data)

        except (ValueError, TypeError):
            pass

    serializer = SupplierSerializer(suppliers, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def supplier_detail(request, pk):
    """GET /api/suppliers/{id}/"""
    try:
        supplier = Supplier.objects.select_related('user').get(pk=pk)
    except Supplier.DoesNotExist:
        return Response(
            {'detail': 'Supplier not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = SupplierDetailSerializer(supplier)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def supplier_inventory(request, pk):
    """GET /api/suppliers/{id}/inventory/?category="""
    try:
        supplier = Supplier.objects.get(pk=pk)
    except Supplier.DoesNotExist:
        return Response(
            {'detail': 'Supplier not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    from materials.models      import Material
    from materials.serializers import MaterialSerializer

    materials = Material.objects.filter(supplier=supplier)

    category = request.query_params.get('category', '').strip()
    if category:
        materials = materials.filter(category=category)

    serializer = MaterialSerializer(materials, many=True)
    return Response(serializer.data)