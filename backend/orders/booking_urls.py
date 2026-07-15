from django.urls    import path
from .booking_views import booking_list, booking_detail

urlpatterns = [
    path('',         booking_list,   name='booking-list'),
    path('<int:pk>/', booking_detail, name='booking-detail'),
]