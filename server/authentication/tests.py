from unittest.mock import patch

from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from authentication.models import User

REGISTER = "/api/auth/register/"
LOGIN = "/api/auth/login/"
LOGOUT = "/api/auth/logout/"
REFRESH = "/api/auth/token/refresh/"


class AuthTestCase(TestCase):
    def setUp(self):
        # Throttle counters live in the cache and would leak between tests.
        cache.clear()
        self.addCleanup(cache.clear)

        self.client = APIClient()
        self.payload = {
            "username": "ayush",
            "email": "ayush@example.com",
            "password": "correct-horse-battery",
        }

    def post(self, path, data):
        return self.client.post(path, data, format="json")

    def register(self, **overrides):
        return self.post(REGISTER, {**self.payload, **overrides})

    def login(self):
        self.register()
        response = self.post(
            LOGIN,
            {"username": self.payload["username"], "password": self.payload["password"]},
        )
        return response.json()["data"]

    def assertError(self, response, status_code, code):
        self.assertEqual(response.status_code, status_code)
        body = response.json()
        self.assertEqual(body["status"], "error")
        self.assertEqual(body["error"]["code"], code)
        return body["error"]


class AuthEnvelopeTests(AuthTestCase):
    def test_register_success(self):
        response = self.client.post(REGISTER, self.payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "data": {"username": "ayush", "email": "ayush@example.com"},
            },
        )

    def test_register_validation_error(self):
        response = self.client.post(
            REGISTER, {"email": "nope", "password": "short"}, format="json"
        )

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertEqual(body["status"], "error")
        self.assertEqual(body["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(
            {d["field"] for d in body["error"]["details"]},
            {"username", "email", "password"},
        )

    def test_login_success(self):
        self.client.post(REGISTER, self.payload, format="json")
        response = self.client.post(
            LOGIN,
            {"username": "ayush", "password": self.payload["password"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(set(body["data"]), {"access", "refresh"})

    def test_login_bad_credentials(self):
        response = self.client.post(
            LOGIN, {"username": "ghost", "password": "x"}, format="json"
        )

        self.assertEqual(response.status_code, 401)
        body = response.json()
        self.assertEqual(body["status"], "error")
        self.assertEqual(body["error"]["code"], "NO_ACTIVE_ACCOUNT")


class TokenLifecycleTests(AuthTestCase):
    def test_logout_blacklists_the_refresh_token(self):
        tokens = self.login()

        response = self.post(LOGOUT, {"refresh": tokens["refresh"]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "data": {}})

        reuse = self.post(REFRESH, {"refresh": tokens["refresh"]})
        self.assertError(reuse, 401, "TOKEN_NOT_VALID")

    def test_logout_twice_is_rejected(self):
        tokens = self.login()
        self.post(LOGOUT, {"refresh": tokens["refresh"]})

        again = self.post(LOGOUT, {"refresh": tokens["refresh"]})
        self.assertError(again, 401, "TOKEN_NOT_VALID")

    def test_logout_rejects_a_garbage_token(self):
        response = self.post(LOGOUT, {"refresh": "not-a-token"})
        self.assertError(response, 401, "TOKEN_NOT_VALID")

    def test_logout_requires_the_refresh_field(self):
        error = self.assertError(self.post(LOGOUT, {}), 400, "VALIDATION_ERROR")
        self.assertEqual(
            [(d["field"], d["code"]) for d in error["details"]],
            [("refresh", "REQUIRED")],
        )

    def test_refresh_rotates_and_blacklists_the_old_token(self):
        tokens = self.login()

        response = self.post(REFRESH, {"refresh": tokens["refresh"]})
        self.assertEqual(response.status_code, 200)
        rotated = response.json()["data"]
        self.assertEqual(set(rotated), {"access", "refresh"})
        self.assertNotEqual(rotated["refresh"], tokens["refresh"])

        replay = self.post(REFRESH, {"refresh": tokens["refresh"]})
        self.assertError(replay, 401, "TOKEN_NOT_VALID")

        # The rotated token is the live one.
        self.assertEqual(self.post(REFRESH, {"refresh": rotated["refresh"]}).status_code, 200)


class ThrottleTests(AuthTestCase):
    def test_login_is_throttled(self):
        bad_login = {"username": "ghost", "password": "x"}

        with patch.dict(SimpleRateThrottle.THROTTLE_RATES, {"login": "3/min"}):
            for _ in range(3):
                self.assertError(self.post(LOGIN, bad_login), 401, "NO_ACTIVE_ACCOUNT")

            throttled = self.post(LOGIN, bad_login)

        self.assertError(throttled, 429, "THROTTLED")
        self.assertIn("Retry-After", throttled.headers)

    def test_a_correct_password_does_not_bypass_the_throttle(self):
        self.register()
        good_login = {"username": "ayush", "password": self.payload["password"]}

        with patch.dict(SimpleRateThrottle.THROTTLE_RATES, {"login": "2/min"}):
            self.post(LOGIN, {"username": "ayush", "password": "wrong"})
            self.post(LOGIN, {"username": "ayush", "password": "wrong"})
            self.assertError(self.post(LOGIN, good_login), 429, "THROTTLED")

    def test_register_is_throttled(self):
        with patch.dict(SimpleRateThrottle.THROTTLE_RATES, {"register": "2/hour"}):
            for name in ("one", "two"):
                response = self.register(username=name, email=f"{name}@example.com")
                self.assertEqual(response.status_code, 201)

            throttled = self.register(username="three", email="three@example.com")
            self.assertError(throttled, 429, "THROTTLED")

    def test_refresh_and_logout_are_throttled(self):
        with patch.dict(
            SimpleRateThrottle.THROTTLE_RATES, {"token_refresh": "1/min", "logout": "1/min"}
        ):
            self.post(REFRESH, {"refresh": "x"})
            self.assertError(self.post(REFRESH, {"refresh": "x"}), 429, "THROTTLED")

            self.post(LOGOUT, {"refresh": "x"})
            self.assertError(self.post(LOGOUT, {"refresh": "x"}), 429, "THROTTLED")


class PasswordValidationTests(AuthTestCase):
    def password_codes(self, response):
        error = self.assertError(response, 400, "VALIDATION_ERROR")
        return [d["code"] for d in error["details"] if d["field"] == "password"]

    def test_common_password_is_rejected(self):
        response = self.register(password="password")
        self.assertIn("PASSWORD_TOO_COMMON", self.password_codes(response))

    def test_numeric_only_password_is_rejected(self):
        response = self.register(password="48291057")
        self.assertIn("PASSWORD_ENTIRELY_NUMERIC", self.password_codes(response))

    def test_password_similar_to_username_is_rejected(self):
        response = self.register(username="ayushkumar", password="ayushkumar1")
        self.assertIn("PASSWORD_TOO_SIMILAR", self.password_codes(response))

    def test_rejected_password_creates_no_user(self):
        self.register(password="password")
        self.assertFalse(User.objects.exists())

    def test_strong_password_is_accepted(self):
        self.assertEqual(self.register().status_code, 201)


class UniquenessTests(AuthTestCase):
    def assertUnique(self, response, field):
        error = self.assertError(response, 400, "VALIDATION_ERROR")
        self.assertEqual(
            [(d["field"], d["code"]) for d in error["details"]], [(field, "UNIQUE")]
        )

    def test_username_is_unique_ignoring_case(self):
        self.register()

        for taken in ("ayush", "AYUSH", "Ayush"):
            with self.subTest(username=taken):
                self.assertUnique(
                    self.register(username=taken, email=f"{taken}@other.com"), "username"
                )

        self.assertEqual(User.objects.count(), 1)

    def test_email_is_unique_ignoring_case(self):
        self.register()

        for taken in ("ayush@example.com", "AYUSH@Example.COM"):
            with self.subTest(email=taken):
                self.assertUnique(self.register(username="other", email=taken), "email")

        self.assertEqual(User.objects.count(), 1)

    def test_users_without_an_email_do_not_collide(self):
        for username in ("one", "two"):
            response = self.post(
                REGISTER, {"username": username, "password": self.payload["password"]}
            )
            self.assertEqual(response.status_code, 201)

        self.assertEqual(User.objects.filter(email="").count(), 2)

    def test_login_ignores_username_case(self):
        self.register()

        response = self.post(
            LOGIN, {"username": "AYUSH", "password": self.payload["password"]}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.json()["data"]), {"access", "refresh"})

    def test_database_enforces_the_same_rules(self):
        User.objects.create_user("Ayush", "a@example.com", "pw")

        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create_user("ayush", "b@example.com", "pw")

        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.create_user("other", "A@EXAMPLE.COM", "pw")


class InputHandlingTests(AuthTestCase):
    """What the server does with hostile or malformed input."""

    def field_errors(self, response):
        error = self.assertError(response, 400, "VALIDATION_ERROR")
        return {d["field"] for d in error["details"]}

    def test_username_whitespace_is_trimmed(self):
        response = self.register(username="  ayush  ")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["data"]["username"], "ayush")
        self.assertTrue(User.objects.filter(username="ayush").exists())

    def test_html_in_username_is_rejected(self):
        response = self.register(username="<script>alert(1)</script>")
        self.assertIn("username", self.field_errors(response))

    def test_null_byte_in_username_is_rejected_not_a_500(self):
        response = self.register(username="ay\x00ush")
        self.assertIn("username", self.field_errors(response))

    def test_overlong_username_is_rejected(self):
        response = self.register(username="a" * 151)
        self.assertIn("username", self.field_errors(response))

    def test_malformed_email_is_rejected(self):
        response = self.register(email="not-an-email")
        self.assertIn("email", self.field_errors(response))

    def test_non_string_values_are_rejected_not_a_500(self):
        for bad in (["a"], {"x": 1}, True):
            with self.subTest(value=bad):
                response = self.register(username=bad)
                self.assertIn("username", self.field_errors(response))

    def test_login_with_non_string_credentials_is_rejected(self):
        response = self.post(LOGIN, {"username": ["a"], "password": {"x": 1}})
        self.assertEqual(
            self.field_errors(response), {"username", "password"}
        )

    def test_sql_injection_string_is_just_a_wrong_login(self):
        self.register()
        response = self.post(LOGIN, {"username": "' OR '1'='1", "password": "' OR '1'='1"})
        self.assertError(response, 401, "NO_ACTIVE_ACCOUNT")

    def test_malformed_json_gets_an_envelope(self):
        response = self.client.post(REGISTER, "{not json", content_type="application/json")
        self.assertError(response, 400, "PARSE_ERROR")
