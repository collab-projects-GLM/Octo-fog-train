from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import (
    TokenBlacklistView,
    TokenObtainPairView,
    TokenRefreshView,
)

from .serializers import RegisterSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class: type[RegisterSerializer] = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"


class LoginView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class TokenRefreshRotatingView(TokenRefreshView):
    """Returns a new access token and a rotated refresh token; the old one is blacklisted."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "token_refresh"


class LogoutView(TokenBlacklistView):
    """Blacklists the posted refresh token. Holding the token is the credential, so no auth header."""

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "logout"
