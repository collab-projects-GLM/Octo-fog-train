from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    issue_tokens,
)


class AuthEntryView(APIView):
    """Base for the unauthenticated login/register endpoints."""

    permission_classes = [AllowAny]
    # A stale or expired Authorization header must not turn a login or
    # registration attempt into a 401 before the view runs.
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def get_authenticate_header(self, request):
        # With no authentication classes DRF has no challenge to send and turns
        # AuthenticationFailed into a 403. Bad credentials should still be a 401.
        return 'Bearer realm="api"'


class RegisterView(AuthEntryView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {"user": UserSerializer(user).data, "tokens": issue_tokens(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(AuthEntryView):
    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        return Response(
            {
                "user": UserSerializer(serializer.validated_data["user"]).data,
                "tokens": serializer.validated_data["tokens"],
            }
        )


class MeView(RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
