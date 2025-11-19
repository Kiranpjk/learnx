from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .api_views import (
    RegisterView,
    ProfileView,
    LogoutView,
    MeView,
    ContactView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("token/", TokenObtainPairView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("me/", MeView.as_view()),
    path("profile/", ProfileView.as_view()),
    path("contact/", ContactView.as_view()),
]
