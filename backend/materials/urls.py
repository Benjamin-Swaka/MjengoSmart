from django.urls import path
from .views      import material_list, material_detail

urlpatterns = [
    path('',         material_list,   name='material-list'),
    path('<int:pk>/', material_detail, name='material-detail'),
]