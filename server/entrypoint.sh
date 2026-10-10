#!/bin/sh
set -e

# Set RUN_MIGRATIONS=0 to skip (e.g. when running several replicas).
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
    python manage.py migrate --noinput
fi
python manage.py collectstatic --noinput

exec "$@"
