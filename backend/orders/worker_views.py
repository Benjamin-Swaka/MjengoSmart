# ============================================================
# MjengoSmart — Worker Views
# GET /api/workers/        — list all workers (with GIS filter)
# GET /api/workers/{id}/   — single worker detail
# ============================================================

import math
from rest_framework.decorators  import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response    import Response
from rest_framework             import status

from .models      import Worker
from .serializers import WorkerSerializer


def haversine_distance(lat1: float, lon1: float,
                       lat2: float, lon2: float) -> float:
    """
    Return the great-circle distance in kilometres between
    two points on Earth given their lat/lng in decimal degrees.
    """
    R    = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a    = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(max(0, a)))


@api_view(['GET'])
@permission_classes([AllowAny])
def worker_list(request):
    """
    GET /api/workers/

    Optional query parameters:
        lat      — user latitude  (float)
        lng      — user longitude (float)
        skill    — skill type string (e.g. Mason)
        available— 'true' to show only available workers
        search   — partial name / skill search
    """
    workers = Worker.objects.all().select_related('user')

    # ── Skill filter ──────────────────────────────────────────
    skill = request.query_params.get('skill', '').strip()
    if skill:
        workers = workers.filter(skill_type__iexact=skill)

    # ── Availability filter ───────────────────────────────────
    available = request.query_params.get('available', '').strip().lower()
    if available == 'true':
        workers = workers.filter(is_available=True)

    # ── Text search ───────────────────────────────────────────
    search = request.query_params.get('search', '').strip()
    if search:
        from django.db.models import Q
        workers = workers.filter(
            Q(skill_type__icontains=search)
            | Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
            | Q(location_name__icontains=search)
            | Q(bio__icontains=search)
        )

    # ── GIS distance filter ───────────────────────────────────
    lat_param = request.query_params.get('lat', '').strip()
    lng_param = request.query_params.get('lng', '').strip()

    if lat_param and lng_param:
        try:
            user_lat  = float(lat_param)
            user_lng  = float(lng_param)
            radius_km = 50.0  # default search radius

            results = []
            for w in workers:
                if w.latitude is not None and w.longitude is not None:
                    dist = haversine_distance(
                        user_lat, user_lng,
                        w.latitude, w.longitude,
                    )
                    if dist <= radius_km:
                        w.distance_km = round(dist, 2)
                        results.append(w)

            # Sort closest first
            results.sort(key=lambda x: getattr(x, 'distance_km', 999))
            serializer = WorkerSerializer(results, many=True)
            return Response(serializer.data)

        except (ValueError, TypeError):
            pass  # fall through to unfiltered list

    serializer = WorkerSerializer(workers, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def worker_detail(request, pk):
    """GET /api/workers/{id}/"""
    try:
        worker = Worker.objects.select_related('user').get(pk=pk)
    except Worker.DoesNotExist:
        return Response(
            {'detail': 'Worker not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(WorkerSerializer(worker).data)