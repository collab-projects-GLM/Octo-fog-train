# Octo Travel

This repository contains three folders:

## ./apps

React Native (Expo) code for the mobile application.

```bash
cd ./apps
bun install

bun run android # needs an Android emulator or a connected device
bun run ios # needs macOS (Xcode simulator or a connected device)
bun run web
```

## ./web

Planned: a website where users can download the APKs. Not set up yet, so there is nothing to build.

## ./server

Python Django server. It needs Docker (Postgres and RustFS), [uv](https://docs.astral.sh/uv/) and Python 3.14 (uv installs it for you).

```bash
cd ./server

# 1. Create your env file and replace the placeholder values
#    (DJANGO_SECRET_KEY, POSTGRES_PASSWORD, S3_ACCESS_KEY, S3_SECRET_KEY).
#    Docker Compose reads this file too, so do this before starting the containers.
cp .env.example .env

# 2. Install dependencies
uv sync

# 3. Start Postgres (host port 5433) and RustFS (ports 9000 and 9001)
docker compose up -d

# 4. Apply migrations and start the server
uv run manage.py migrate
uv run manage.py runserver

# Check health
curl http://localhost:8000/api/v1/health/
```

If a port is already in use, change the mapping in `compose.yml` and keep `POSTGRES_PORT` in `.env` in sync with the published Postgres port.
