# ============================================================
# MjengoSmart — User / Auth Views
# ============================================================

from rest_framework                     import status, generics
from rest_framework.decorators          import api_view, permission_classes
from rest_framework.permissions         import IsAuthenticated, AllowAny
from rest_framework.response            import Response
from rest_framework_simplejwt.views     import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models       import User
from .serializers  import (
    UserSerializer,
    RegisterSerializer,
    TokenResponseSerializer,
)
from orders.models         import Order, BookingRequest
from notifications.models  import Notification


# ── Custom Login — returns user object alongside tokens ───────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ── Register ──────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user   = serializer.save()
    tokens = TokenResponseSerializer.get_tokens_for_user(user)

    return Response(tokens, status=status.HTTP_201_CREATED)


# ── Current User Profile ──────────────────────────────────────

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me_view(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    serializer = UserSerializer(
        request.user,
        data=request.data,
        partial=True,
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Dashboard Analytics ───────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    user = request.user

    # Orders
    orders          = Order.objects.filter(client=user)
    total_orders    = orders.count()
    pending_orders  = orders.filter(status='pending').count()
    delivered       = orders.filter(status='delivered').count()
    total_spent     = sum(
        o.total_price for o in orders.filter(status='delivered')
    )

    # Bookings
    bookings         = BookingRequest.objects.filter(client=user)
    total_bookings   = bookings.count()
    active_bookings  = bookings.filter(status='accepted').count()
    completed_bookings = bookings.filter(status='completed').count()

    # Notifications
    unread = Notification.objects.filter(user=user, is_read=False).count()

    data = {
        'total_orders':        total_orders,
        'pending_orders':      pending_orders,
        'delivered_orders':    delivered,
        'total_spent':         float(total_spent),
        'total_bookings':      total_bookings,
        'active_bookings':     active_bookings,
        'completed_bookings':  completed_bookings,
        'unread_notifications':unread,
    }

    # Extra stats for suppliers
    if user.role == 'supplier':
        try:
            from suppliers.models import Supplier
            supplier = Supplier.objects.get(user=user)
            supplier_orders = Order.objects.filter(
                material__supplier=supplier
            )
            revenue = sum(
                o.total_price
                for o in supplier_orders.filter(status='delivered')
            )
            data['total_revenue']   = float(revenue)
            data['avg_rating']      = float(supplier.rating)
            from reviews.models import Review
            data['reviews_count']   = Review.objects.filter(
                target_type='supplier',
                target_id=supplier.id,
            ).count()
        except Exception:
            pass

    # Extra stats for workers
    if user.role == 'worker':
        try:
            from orders.models import Worker
            worker = Worker.objects.get(user=user)
            worker_bookings = BookingRequest.objects.filter(worker=worker)
            data['total_bookings']   = worker_bookings.count()
            data['active_bookings']  = worker_bookings.filter(
                status='accepted'
            ).count()
            data['avg_rating']       = float(worker.rating)
            from reviews.models import Review
            data['reviews_count']    = Review.objects.filter(
                target_type='worker',
                target_id=worker.id,
            ).count()
        except Exception:
            pass

    return Response(data)