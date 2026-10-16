from django.test import TestCase
from rest_framework.test import APIClient


class AuthEnvelopeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.payload = {
            "username": "ayush",
            "email": "ayush@example.com",
            "password": "correct-horse-battery",
        }

    def test_register_success(self):
        response = self.client.post("/api/auth/register/", self.payload, format="json")

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
            "/api/auth/register/", {"email": "nope", "password": "short"}, format="json"
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
        self.client.post("/api/auth/register/", self.payload, format="json")
        response = self.client.post(
            "/api/auth/login/",
            {"username": "ayush", "password": self.payload["password"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(set(body["data"]), {"access", "refresh"})

    def test_login_bad_credentials(self):
        response = self.client.post(
            "/api/auth/login/", {"username": "ghost", "password": "x"}, format="json"
        )

        self.assertEqual(response.status_code, 401)
        body = response.json()
        self.assertEqual(body["status"], "error")
        self.assertEqual(body["error"]["code"], "NO_ACTIVE_ACCOUNT")
