# ============================================================
# MjengoSmart — Booking Request Views
# ============================================================

from rest_framework             import status
from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response    import Response
from django.db.models           import Q

from .models      import BookingRequest
from .serializers import BookingRequestSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def booking_list(request):
    """
    GET  /api/bookings/ — user's bookings (client or worker)
    POST /api/bookings/ — create booking request
    """
    if request.method == 'GET':
        user = request.user

        # Clients see their own bookings
        # Workers see bookings made to them
        if user.role == 'worker':
            try:
                worker   = user.worker_profile
                bookings = BookingRequest.objects.filter(
                    worker=worker
                ).select_related('client', 'worker__user')
            except Exception:
                bookings = BookingRequest.objects.none()
        else:
            bookings = BookingRequest.objects.filter(
                client=user
            ).select_related('client', 'worker__user')

        return Response(
            BookingRequestSerializer(bookings, many=True).data
        )

    # POST — create booking
    serializer = BookingRequestSerializer(data=request.data)
    if serializer.is_valid():
        booking = serializer.save(client=request.user)

        # Notify the worker
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=booking.worker.user,
                notif_type='booking_request',
                title='New Booking Request',
                message=(
                    f'{request.user.get_full_name() or request.user.username} '
                    f'wants to book you from '
                    f'{booking.start_date} to {booking.end_date}. '
                    f'Rate: KES {booking.agreed_rate}/day.'
                ),
            )
        except Exception:
            pass

        return Response(
            BookingRequestSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def booking_detail(request, pk):
    """GET/PATCH /api/bookings/{id}/"""
    try:
        booking = BookingRequest.objects.select_related(
            'client', 'worker__user'
        ).get(
            Q(client=request.user) | Q(worker__user=request.user),
            pk=pk,
        )
    except BookingRequest.DoesNotExist:
        return Response(
            {'detail': 'Booking not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        return Response(BookingRequestSerializer(booking).data)

    serializer = BookingRequestSerializer(
        booking, data=request.data, partial=True
    )
    if serializer.is_valid():
        updated = serializer.save()

        # Notify client when worker responds
        if 'status' in request.data:
            try:
                from notifications.models import Notification
                new_status = request.data['status']
                msg_map    = {
                    'accepted':  'accepted your booking request',
                    'declined':  'declined your booking request',
                    'completed': 'marked your booking as completed',
                }
                if new_status in msg_map:
                    Notification.objects.create(
                        user=updated.client,
                        notif_type='booking_request',
                        title=f'Booking {new_status.capitalize()}',
                        message=(
                            f'{updated.worker.user.get_full_name()} '
                            f'{msg_map[new_status]}.'
                        ),
                    )
            except Exception:
                pass

        return Response(serializer.data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)