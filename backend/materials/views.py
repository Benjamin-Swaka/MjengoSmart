# ============================================================
# MjengoSmart — Material Views
# ============================================================

from rest_framework             import status
from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response    import Response

from .models      import Material
from .serializers import MaterialSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def material_list(request):
    """
    GET  /api/materials/ — list with optional filters
    POST /api/materials/ — create (auth required)
    """
    if request.method == 'GET':
        materials = Material.objects.all().select_related('supplier')

        # Filters
        category  = request.query_params.get('category', '').strip()
        max_price = request.query_params.get('max_price', '').strip()
        search    = request.query_params.get('search',    '').strip()
        supplier  = request.query_params.get('supplier',  '').strip()

        if category:
            materials = materials.filter(category=category)
        if max_price:
            try:
                materials = materials.filter(price__lte=float(max_price))
            except ValueError:
                pass
        if search:
            materials = materials.filter(name__icontains=search)
        if supplier:
            materials = materials.filter(supplier_id=supplier)

        serializer = MaterialSerializer(materials, many=True)
        return Response(serializer.data)

    # POST — create
    serializer = MaterialSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def material_detail(request, pk):
    """GET/PATCH/DELETE /api/materials/{id}/"""
    try:
        material = Material.objects.select_related('supplier').get(pk=pk)
    except Material.DoesNotExist:
        return Response(
            {'detail': 'Material not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        return Response(MaterialSerializer(material).data)

    if request.method == 'PATCH':
        serializer = MaterialSerializer(
            material, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(
            serializer.errors, status=status.HTTP_400_BAD_REQUEST
        )

    # DELETE
    material.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)