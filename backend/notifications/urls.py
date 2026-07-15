from django.urls import path
from .views      import notification_list, mark_all_read, mark_one_read

urlpatterns = [
    path('',                      notification_list, name='notification-list'),
    path('mark_all_read/',        mark_all_read,     name='notification-mark-all'),
    path('<int:pk>/mark_read/',   mark_one_read,     name='notification-mark-one'),
]