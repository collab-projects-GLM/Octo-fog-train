# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Django 6 + DRF API. Needs `.env` copied from `.env.example` first; settings read `DJANGO_SECRET_KEY` and `POSTGRES_PASSWORD` at import time, and Docker Compose reads the same file. `.env` is the local (docker) environment; production lives in the gitignored `.env.prod` (see Environments).

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

Tests in `config/` use `SimpleTestCase` and run without Postgres. Tests in `authentication/` hit the DB and need the compose Postgres up (Django creates and drops its own test database). After pulling auth changes, run `uv run manage.py migrate` so the dev database gets the `token_blacklist` tables.

## Environments

`APP_ENV` (`local` by default, or `prod`) picks the env file `config/settings.py` loads: `.env` or `.env.prod`. Plain `uv run manage.py ...` is therefore always local. To run against prod, use the wrapper, which asks you to type `prod` first and refuses `test` (it would create a test database on the production Neon server):

```bash
./scripts/dj.sh local runserver
./scripts/dj.sh prod migrate
```

`.env.prod` holds `DATABASE_URL` (Neon; wins over `POSTGRES_*` when set), the Backblaze B2 `S3_*` values, `DJANGO_DEBUG=False` and the Vercel host. On Vercel there is no `.env.prod`; set the same variables in the project settings. Static files are served by WhiteNoise (`WHITENOISE_USE_FINDERS`), so the deploy needs no `collectstatic` step.

## API response contract

The envelope shape is defined in the root `CLAUDE.md`. Two pieces enforce it, wired in `REST_FRAMEWORK` in `config/settings.py`:

- `config/renderers.py` `EnvelopeJSONRenderer` (the default renderer) wraps successes. It passes 4xx/5xx through untouched.
- `config/exception_handlers.py` `custom_exception_handler` shapes every error. `ValidationError` becomes `VALIDATION_ERROR` with `details` flattened to `{field, message, code}`. Any other exception gets its own `get_codes()` uppercased as `code`, `str(detail)` as `message`, and `details: []`; a dict `detail` (SimpleJWT's `InvalidToken`) is unwrapped to its `detail` entry first, so a bad or expired token is `TOKEN_NOT_VALID`, not a stringified dict. Django `Http404`/`PermissionDenied` are converted first. Unhandled exceptions are logged and returned as a generic `INTERNAL_ERROR` 500 with no internals leaked.
- Types for both shapes live in `config/error.py`.

Rules when writing endpoints:

- **Raise, don't return, errors.** Subclass `AppException` in `config/exceptions.py` (set `status_code`, `default_code`, `default_detail`; the code must be UPPER_SNAKE_CASE). A hand-built `Response(..., status=4xx)` skips the handler and will not get the error envelope.
- **Success views return plain data** (`Response(serializer.data)`); never build the `{"status": "ok", ...}` wrapper by hand or it will be double-wrapped.
- **Use DRF views for new endpoints.** The plain-Django `api.views.health_check` bypasses the envelope (still `{"status": "ok", "service": ...}`), so the mobile `api` client, which trusts the envelope, would resolve it with `undefined`. Default permission is `IsAuthenticated`, so public endpoints need `permission_classes = [AllowAny]`.
- **Field-level uniqueness gotcha:** a `ModelSerializer` adds `UniqueValidator` for `unique=True` fields, and it runs *before* `validate_<field>`. A custom exception raised in `validate_<field>` for a duplicate is therefore never reached; the client gets a 400 `VALIDATION_ERROR` instead (this is why `UsernameTakenError` in `authentication/serializers.py` currently never fires). Override the field's `validators` if you want the custom code.
- `drf-spectacular` (`/api/docs/`) does not know about the envelope; the generated schema shows unwrapped bodies.

## Architecture

- `config/` — project settings, URL root, and the cross-cutting API plumbing above (renderer, exception handler, exception classes, types).
- `authentication/` — custom user model (`AUTH_USER_MODEL = "authentication.User"`), and `register/`, `login/`, `logout/`, `token/refresh/` under `/api/auth/`. JWT is the only default authentication class, so there are no cookies and no CSRF surface on the API (CSRF middleware still covers `/admin/`). If you ever add `SessionAuthentication` or cookie tokens, CSRF needs handling.

## Auth: tokens, throttling, passwords

- **Tokens.** Access lives 5 min, refresh 1 day (SimpleJWT defaults). `token_blacklist` is installed and refresh tokens rotate: `/token/refresh/` returns a new `{access, refresh}` and blacklists the old refresh, so the client must store the new one. `POST /api/auth/logout/` with `{refresh}` blacklists it (no auth header; holding the token is the credential). Access tokens are stateless and stay valid until they expire (max 5 min) after logout. Needs `uv run manage.py migrate` for the blacklist tables (and `authentication.0002` for the uniqueness constraints below).
- **Throttling.** `REST_FRAMEWORK` sets a baseline (`anon`/`user`) and each auth view overrides it with `ScopedRateThrottle` (`login`, `register`, `token_refresh`, `logout`; rates in `DEFAULT_THROTTLE_RATES`). Rejections are 429 `THROTTLED` with `Retry-After`. Counters live in Django's cache, which is a per-process `LocMemCache` by default: point `CACHES` at a shared backend before running more than one worker. Limits are per IP; set `NUM_PROXIES` behind a proxy. Tests must `cache.clear()` in `setUp` (see `AuthTestCase`) and patch `SimpleRateThrottle.THROTTLE_RATES` to test a limit.
- **Uniqueness.** Usernames are unique ignoring case and so is email (blank emails excluded, so users may have none). Both are enforced twice: DB `UniqueConstraint(Lower(...))` constraints on `User`, and iexact `UniqueValidator`s in `RegisterSerializer` that return a 400 on the field with code `UNIQUE`. Login is case-insensitive too, via `CaseInsensitiveUserManager.get_by_natural_key`. A request that loses a race past the serializer check hits the constraint and surfaces as a 500. Keep any new user-creating path (admin, scripts) going through `User.objects.create_user`.
- **Passwords.** `RegisterSerializer.validate` runs `AUTH_PASSWORD_VALIDATORS` and reports failures on `password` with Django's codes (`PASSWORD_TOO_COMMON`, ...). It is object-level, so it only runs once the individual fields are valid.
- `api/` — only the health check at `/api/v1/health/`.
- Admin is skinned with Jazzmin and lives at `/admin/`.
