# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Django 6 + DRF API. Needs `.env` copied from `.env.example` first; settings read `DJANGO_SECRET_KEY` and `POSTGRES_PASSWORD` at import time, and Docker Compose reads the same file.

## Commands

Run from `server/`:

```bash
uv sync
docker compose up -d                 # Postgres on host port 5433, RustFS on 9000/9001
uv run manage.py migrate
uv run manage.py runserver

uv run manage.py test --noinput                          # all tests
uv run manage.py test config                             # envelope tests only (no DB needed)
uv run manage.py test config.tests.ErrorEnvelopeTests.test_app_exception_uses_its_own_code_and_message   # single test
```

Tests in `config/` use `SimpleTestCase` and run without Postgres. Tests in `authentication/` hit the DB and need the compose Postgres up (Django creates and drops its own test database).

## API response contract

The envelope shape is defined in the root `CLAUDE.md`. Two pieces enforce it, wired in `REST_FRAMEWORK` in `config/settings.py`:

- `config/renderers.py` `EnvelopeJSONRenderer` (the default renderer) wraps successes. It passes 4xx/5xx through untouched.
- `config/exception_handlers.py` `custom_exception_handler` shapes every error. `ValidationError` becomes `VALIDATION_ERROR` with `details` flattened to `{field, message, code}`. Any other exception gets its own `get_codes()` uppercased as `code`, `str(detail)` as `message`, and `details: []`. Django `Http404`/`PermissionDenied` are converted first. Unhandled exceptions are logged and returned as a generic `INTERNAL_ERROR` 500 with no internals leaked.
- Types for both shapes live in `config/error.py`.

Rules when writing endpoints:

- **Raise, don't return, errors.** Subclass `AppException` in `config/exceptions.py` (set `status_code`, `default_code`, `default_detail`; the code must be UPPER_SNAKE_CASE). A hand-built `Response(..., status=4xx)` skips the handler and will not get the error envelope.
- **Success views return plain data** (`Response(serializer.data)`); never build the `{"status": "ok", ...}` wrapper by hand or it will be double-wrapped.
- **Use DRF views for new endpoints.** The plain-Django `api.views.health_check` bypasses the envelope (still `{"status": "ok", "service": ...}`), so the mobile `api` client, which trusts the envelope, would resolve it with `undefined`. Default permission is `IsAuthenticated`, so public endpoints need `permission_classes = [AllowAny]`.
- **Field-level uniqueness gotcha:** a `ModelSerializer` adds `UniqueValidator` for `unique=True` fields, and it runs *before* `validate_<field>`. A custom exception raised in `validate_<field>` for a duplicate is therefore never reached; the client gets a 400 `VALIDATION_ERROR` instead (this is why `UsernameTakenError` in `authentication/serializers.py` currently never fires). Override the field's `validators` if you want the custom code.
- `drf-spectacular` (`/api/docs/`) does not know about the envelope; the generated schema shows unwrapped bodies.

## Architecture

- `config/` — project settings, URL root, and the cross-cutting API plumbing above (renderer, exception handler, exception classes, types).
- `authentication/` — custom user model (`AUTH_USER_MODEL = "authentication.User"`), register view, and SimpleJWT login/refresh under `/api/auth/`. JWT is the only default authentication class.
- `api/` — only the health check at `/api/v1/health/`.
- Admin is skinned with Jazzmin and lives at `/admin/`.
