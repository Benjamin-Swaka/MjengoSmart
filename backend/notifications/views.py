from rest_framework             import status
from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response    import Response

from .models      import Notification
from .serializers import NotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """GET /api/notifications/"""
    notifications = Notification.objects.filter(user=request.user)
    return Response(
        NotificationSerializer(notifications, many=True).data
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """POST /api/notifications/mark_all_read/"""
    Notification.objects.filter(
        user=request.user, is_read=False
    ).update(is_read=True)
    return Response({'detail': 'All notifications marked as read.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_one_read(request, pk):
    """POST /api/notifications/{id}/mark_read/"""
    try:
        notif = Notification.objects.get(pk=pk, user=request.user)
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'detail': 'Marked as read.'})
    except Notification.DoesNotExist:
        return Response(
            {'detail': 'Notification not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )