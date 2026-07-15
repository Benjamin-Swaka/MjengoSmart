# ============================================================
# MjengoSmart — Auth URL Patterns
# ============================================================

from django.urls                        import path
from rest_framework_simplejwt.views     import TokenRefreshView

from .views import LoginView, register_view, me_view, analytics_view

urlpatterns = [
    path('login/',     LoginView.as_view(),  name='auth-login'),
    path('refresh/',   TokenRefreshView.as_view(), name='auth-refresh'),
    path('register/',  register_view,        name='auth-register'),
    path('me/',        me_view,              name='auth-me'),
    path('analytics/', analytics_view,       name='auth-analytics'),
]