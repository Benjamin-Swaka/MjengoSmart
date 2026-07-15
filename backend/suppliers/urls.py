from django.urls import path
from .views      import supplier_list, supplier_detail, supplier_inventory

urlpatterns = [
    path('',                    supplier_list,      name='supplier-list'),
    path('<int:pk>/',           supplier_detail,    name='supplier-detail'),
    path('<int:pk>/inventory/', supplier_inventory, name='supplier-inventory'),
]