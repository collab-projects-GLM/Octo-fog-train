#!/usr/bin/env bash
# Run manage.py against the local (docker) or prod environment.
#
#   ./scripts/dj.sh local runserver
#   ./scripts/dj.sh prod migrate
#
# local reads .env, prod reads .env.prod (selected via APP_ENV, see config/settings.py).
# Plain `uv run manage.py ...` is always local. prod asks you to type "prod" first, and
# refuses `test`, which would create and drop a test database on the production server.
set -euo pipefail
cd "$(dirname "$0")/.."

usage() {
    echo "usage: $0 <local|prod> <manage.py args...>" >&2
    exit 2
}

[[ $# -ge 2 ]] || usage
env_name="$1"
shift

case "$env_name" in
    local) ;;
    prod)
        [[ -f .env.prod ]] || { echo ".env.prod not found" >&2; exit 1; }
        if [[ "$1" == "test" ]]; then
            echo "Refusing to run 'test' against prod." >&2
            exit 1
        fi
        echo "PRODUCTION (.env.prod): manage.py $*" >&2
        read -r -p 'Type "prod" to continue: ' answer
        [[ "$answer" == "prod" ]] || { echo "Aborted." >&2; exit 1; }
        ;;
    *) usage ;;
esac

APP_ENV="$env_name" exec uv run manage.py "$@"
