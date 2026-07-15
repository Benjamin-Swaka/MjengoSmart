

from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response    import Response
from rest_framework             import status

from .models      import Order
from .serializers import OrderSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def order_list(request):
    """
    GET  /api/orders/ — returns current user's orders
    POST /api/orders/ — place a new material order
    """
    if request.method == 'GET':
        orders = (
            Order.objects
            .filter(client=request.user)
            .select_related('material', 'material__supplier', 'client')
            .order_by('-created_at')
        )
        return Response(OrderSerializer(orders, many=True).data)

    # ── POST: create order ────────────────────────────────────
    serializer = OrderSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    order = serializer.save(client=request.user)

    # Notify the supplier
    _notify_supplier_new_order(order, request.user)

    return Response(
        OrderSerializer(order).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    """
    GET   /api/orders/{id}/ — order detail
    PATCH /api/orders/{id}/ — update (e.g. cancel, change status)
    """
    try:
        order = (
            Order.objects
            .select_related('material', 'material__supplier', 'client')
            .get(pk=pk, client=request.user)
        )
    except Order.DoesNotExist:
        return Response(
            {'detail': 'Order not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        return Response(OrderSerializer(order).data)

    # ── PATCH ─────────────────────────────────────────────────
    serializer = OrderSerializer(order, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    updated = serializer.save()

    # Notify client if status changed by supplier/admin
    if 'status' in request.data:
        _notify_client_order_update(updated)

    return Response(OrderSerializer(updated).data)


# ── Notification helpers ──────────────────────────────────────

def _notify_supplier_new_order(order, client):
    """Send a notification to the supplier when a new order is placed."""
    try:
        from notifications.models import Notification
        Notification.objects.create(
            user=order.material.supplier.user,
            notif_type='order_update',
            title='New Order Received',
            message=(
                f'{client.get_full_name() or client.username} ordered '
                f'{order.quantity} {order.material.unit} of '
                f'"{order.material.name}". '
                f'Total: KES {order.total_price:,.0f}.'
            ),
        )
    except Exception:
        pass


def _notify_client_order_update(order):
    """Send status-change notification to the client."""
    try:
        from notifications.models import Notification
        status_messages = {
            'confirmed':  'Your order has been confirmed by the supplier.',
            'dispatched': 'Your materials have been dispatched and are on the way.',
            'delivered':  'Your materials have been delivered. Enjoy your build!',
            'cancelled':  'Your order has been cancelled.',
        }
        msg = status_messages.get(order.status)
        if msg:
            Notification.objects.create(
                user=order.client,
                notif_type='order_update',
                title=f'Order {order.status.capitalize()}',
                message=msg,
            )
    except Exception:
        pass