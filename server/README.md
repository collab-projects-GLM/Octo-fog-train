# Octo Travel server

```sh
docker compose up -d      # Postgres + S3-compatible storage (RustFS), bucket is created automatically
cp .env.example .env      # Django settings (same defaults as compose.yml)
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

Useful:

```sh
docker compose ps
docker compose logs rustfs
```

- Postgres: `127.0.0.1:${POSTGRES_PORT:-5432}`
- S3 API: `http://127.0.0.1:9000`, web console: `http://127.0.0.1:9001`
