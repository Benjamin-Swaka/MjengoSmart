from rest_framework             import status
from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response    import Response

from .models      import Review
from .serializers import ReviewSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def review_list(request):
    """
    GET  /api/reviews/?target_type=supplier&target_id=3
    POST /api/reviews/
    """
    if request.method == 'GET':
        reviews = Review.objects.all().select_related('reviewer')

        target_type = request.query_params.get('target_type', '').strip()
        target_id   = request.query_params.get('target_id',   '').strip()

        if target_type:
            reviews = reviews.filter(target_type=target_type)
        if target_id:
            reviews = reviews.filter(target_id=target_id)

        return Response(ReviewSerializer(reviews, many=True).data)

    # POST
    serializer = ReviewSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(reviewer=request.user)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)