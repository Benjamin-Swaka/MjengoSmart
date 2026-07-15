# ============================================================
# MjengoSmart — Worker URL Patterns
# Mounted at: /api/workers/
# ============================================================

from django.urls import path
from .worker_views import worker_list, worker_detail

urlpatterns = [
    path('',          worker_list,   name='worker-list'),
    path('<int:pk>/', worker_detail, name='worker-detail'),
]