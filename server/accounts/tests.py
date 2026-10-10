from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User

PASSWORD = "correct-horse-battery"


class AuthTestCase(APITestCase):
    def setUp(self):
        # Throttle counters live in the cache and would leak between tests.
        cache.clear()

    def make_user(self, username="alice", email="alice@example.com", **extra):
        return User.objects.create_user(
            username=username, email=email, password=PASSWORD, **extra
        )

    def register(self, **overrides):
        payload = {
            "username": "alice",
            "email": "alice@example.com",
            "password": PASSWORD,
        }
        payload.update(overrides)

        return self.client.post(reverse("register"), payload, format="json")

    def login(self, identifier, password=PASSWORD):
        return self.client.post(
            reverse("login"),
            {"identifier": identifier, "password": password},
            format="json",
        )

    def authenticate(self, access):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")


class RegisterTests(AuthTestCase):
    def test_creates_user_and_returns_session(self):
        response = self.register()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["username"], "alice")
        self.assertEqual(response.data["user"]["email"], "alice@example.com")
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])

        user = User.objects.get(username="alice")
        self.assertTrue(user.check_password(PASSWORD))

    def test_never_returns_the_password(self):
        response = self.register()

        self.assertNotIn("password", response.data["user"])
        self.assertNotIn(PASSWORD, response.content.decode())

    def test_returned_access_token_works(self):
        response = self.register()
        self.authenticate(response.data["tokens"]["access"])

        me = self.client.get(reverse("me"))

        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["username"], "alice")

    def test_email_is_required(self):
        response = self.register(email="")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_email_is_normalised_to_lowercase(self):
        self.register(email="  Alice@Example.COM ")

        self.assertEqual(User.objects.get().email, "alice@example.com")

    def test_rejects_duplicate_email_in_any_case(self):
        self.make_user(username="first", email="alice@example.com")

        response = self.register(username="second", email="ALICE@example.com")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_rejects_duplicate_username_in_any_case(self):
        self.make_user(username="Alice", email="one@example.com")

        response = self.register(username="alice", email="two@example.com")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_rejects_at_sign_in_username(self):
        response = self.register(username="alice@example.com")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_rejects_weak_passwords(self):
        for password in ["short", "12345678", "password"]:
            with self.subTest(password=password):
                response = self.register(password=password)

                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("password", response.data)

        self.assertFalse(User.objects.exists())

    def test_rejects_password_similar_to_username(self):
        response = self.register(username="traveller", password="traveller1")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_cannot_set_privileged_fields(self):
        self.register(is_staff=True, is_superuser=True)

        user = User.objects.get()
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_ignores_an_invalid_authorization_header(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-real-token")

        response = self.register()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class LoginTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        self.user = self.make_user()

    def test_login_with_email(self):
        response = self.login("alice@example.com")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["id"], self.user.id)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])

    def test_login_with_username(self):
        response = self.login("alice")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["id"], self.user.id)

    def test_identifier_is_case_insensitive_and_trimmed(self):
        for identifier in ["ALICE", "Alice@Example.com", "  alice  "]:
            with self.subTest(identifier=identifier):
                response = self.login(identifier)

                self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_password_is_case_sensitive(self):
        response = self.login("alice", PASSWORD.upper())

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_wrong_password_and_unknown_user_look_identical(self):
        wrong_password = self.login("alice", "not-the-password")
        unknown_user = self.login("nobody", PASSWORD)

        self.assertEqual(wrong_password.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(unknown_user.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(wrong_password.data, unknown_user.data)
        self.assertEqual(
            wrong_password.data["detail"], "Invalid username/email or password."
        )

    def test_inactive_user_cannot_log_in(self):
        self.user.is_active = False
        self.user.save()

        response = self.login("alice")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_fields_are_validation_errors(self):
        response = self.client.post(reverse("login"), {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("identifier", response.data)
        self.assertIn("password", response.data)

    def test_ignores_an_invalid_authorization_header(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer expired-or-garbage")

        response = self.login("alice")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_is_throttled(self):
        # 20/min, see DEFAULT_THROTTLE_RATES["auth"].
        codes = [self.login("alice", "wrong").status_code for _ in range(21)]

        self.assertEqual(set(codes[:20]), {status.HTTP_401_UNAUTHORIZED})
        self.assertEqual(codes[20], status.HTTP_429_TOO_MANY_REQUESTS)


class SessionTests(AuthTestCase):
    def setUp(self):
        super().setUp()
        self.make_user()
        self.tokens = self.login("alice").data["tokens"]

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("me"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_the_current_user(self):
        self.authenticate(self.tokens["access"])

        response = self.client.get(reverse("me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(response.data), {"id", "username", "email", "avatar"}
        )

    def test_me_is_read_only(self):
        self.authenticate(self.tokens["access"])

        response = self.client.patch(reverse("me"), {"username": "mallory"})

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_refresh_rotates_and_blacklists_the_old_token(self):
        first = self.client.post(
            reverse("token-refresh"), {"refresh": self.tokens["refresh"]}
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertIn("access", first.data)
        self.assertNotEqual(first.data["refresh"], self.tokens["refresh"])

        reused = self.client.post(
            reverse("token-refresh"), {"refresh": self.tokens["refresh"]}
        )

        self.assertEqual(reused.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_the_refresh_token(self):
        logout = self.client.post(
            reverse("logout"), {"refresh": self.tokens["refresh"]}
        )

        self.assertEqual(logout.status_code, status.HTTP_200_OK)

        refresh = self.client.post(
            reverse("token-refresh"), {"refresh": self.tokens["refresh"]}
        )

        self.assertEqual(refresh.status_code, status.HTTP_401_UNAUTHORIZED)
