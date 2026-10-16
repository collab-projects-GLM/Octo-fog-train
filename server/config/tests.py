import json
from datetime import datetime, timedelta, timezone

from django.http import Http404
from django.test import SimpleTestCase
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import AccessToken

from config.exceptions import UsernameTakenError


class ItemSerializer(serializers.Serializer):
    qty = serializers.IntegerField()


class PayloadSerializer(serializers.Serializer):
    email = serializers.EmailField()
    items = ItemSerializer(many=True)


class _View(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]


class OkView(_View):
    def get(self, request):
        return Response({"id": 1})


class ListView(_View):
    def get(self, request):
        return Response([1, 2])


class EmptyView(_View):
    def get(self, request):
        return Response()


class NoContentView(_View):
    def delete(self, request):
        return Response(status=204)


class ValidationView(_View):
    def post(self, request):
        PayloadSerializer(data=request.data).is_valid(raise_exception=True)
        return Response()


class AppErrorView(_View):
    def get(self, request):
        raise UsernameTakenError()


class NotFoundView(_View):
    def get(self, request):
        raise Http404


class CrashView(_View):
    def get(self, request):
        raise RuntimeError("boom")


class AuthRequiredView(APIView):
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return Response()


factory = APIRequestFactory()


def call(view, method="get", path="/", data=None, **extra):
    request = getattr(factory, method)(path, data, format="json", **extra)
    response = view.as_view()(request)
    response.render()
    response.json = lambda: json.loads(response.content)
    return response


class SuccessEnvelopeTests(SimpleTestCase):
    def test_object_is_wrapped(self):
        response = call(OkView)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "data": {"id": 1}})

    def test_list_is_wrapped(self):
        self.assertEqual(call(ListView).json(), {"status": "ok", "data": [1, 2]})

    def test_empty_body_becomes_empty_object(self):
        self.assertEqual(call(EmptyView).json(), {"status": "ok", "data": {}})

    def test_no_content_stays_empty(self):
        response = call(NoContentView, "delete")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")


class ErrorEnvelopeTests(SimpleTestCase):
    def test_validation_error_details_are_a_flat_list(self):
        response = call(
            ValidationView,
            "post",
            data={"email": "nope", "items": [{"qty": 1}, {"qty": "x"}]},
        )
        self.assertEqual(response.status_code, 400)

        body = response.json()
        self.assertEqual(body["status"], "error")
        self.assertNotIn("data", body)
        self.assertEqual(body["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(body["error"]["message"], "Validation failed.")
        self.assertEqual(
            [(d["field"], d["code"]) for d in body["error"]["details"]],
            [("email", "INVALID"), ("items.1.qty", "INVALID")],
        )
        for detail in body["error"]["details"]:
            self.assertEqual(set(detail), {"field", "message", "code"})

    def test_missing_fields_are_reported(self):
        body = call(ValidationView, "post", data={}).json()
        self.assertEqual(
            sorted((d["field"], d["code"]) for d in body["error"]["details"]),
            [("email", "REQUIRED"), ("items", "REQUIRED")],
        )

    def test_app_exception_uses_its_own_code_and_message(self):
        response = call(AppErrorView)
        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json(),
            {
                "status": "error",
                "error": {
                    "code": "USERNAME_TAKEN",
                    "message": "This username is already taken.",
                    "details": [],
                },
            },
        )

    def test_django_404_is_converted(self):
        response = call(NotFoundView)
        self.assertEqual(response.status_code, 404)
        error = response.json()["error"]
        self.assertEqual(error["code"], "NOT_FOUND")
        self.assertEqual(error["details"], [])

    def test_drf_builtin_codes_are_uppercased(self):
        response = call(AuthRequiredView)  # default IsAuthenticated, no credentials
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["code"], "NOT_AUTHENTICATED")

    def assert_token_not_valid(self, response):
        self.assertEqual(response.status_code, 401)
        error = response.json()["error"]
        # SimpleJWT's InvalidToken has a dict detail; code and message must stay plain strings.
        self.assertEqual(error["code"], "TOKEN_NOT_VALID")
        self.assertNotIn("{", error["message"])
        self.assertEqual(error["details"], [])

    def test_invalid_token_has_a_stable_code(self):
        response = call(AuthRequiredView, HTTP_AUTHORIZATION="Bearer not-a-real-token")
        self.assert_token_not_valid(response)

    def test_expired_token_has_a_stable_code(self):
        token = AccessToken()
        token.set_exp(
            from_time=datetime(2020, 1, 1, tzinfo=timezone.utc),
            lifetime=timedelta(minutes=5),
        )

        response = call(AuthRequiredView, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assert_token_not_valid(response)

    def test_unhandled_exception_hides_internals(self):
        with self.assertLogs("config.exception_handlers", level="ERROR"):
            response = call(CrashView)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.json(),
            {
                "status": "error",
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Internal server error.",
                    "details": [],
                },
            },
        )
