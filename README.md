This repository contains three folder

_./apps_

- This folder contains all the react native code that is required for the mobile application
  Build step for this are:

```bash
cd ./apps
bun run android
bun run ios # you need to use macOS to build the iOS project
bun run web
```

_./web_

- This folder is for all the web related stuff, for future to download apks
  Build step for this are:

```bash
cd web
bun run build

```

_./server_

- This folder is for python django server
  Build steps for this are:

```bash
cd ./server
uv lock
uv sync
docker compose up -d

(check for any port conflict, if there is just map to another port)

cp .env.example .env
uv run manage.py migrate
uv run manage.py runserver

(check health using)
curl http://localhost:8000/api/v1/health/

```
