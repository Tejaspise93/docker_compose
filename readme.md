# Docker Compose Learning Project

A small 2-service project built to learn Docker Compose hands-on: a Node/Express
backend (`app-server`) and an nginx frontend (`frontend`) that serves a static
page and reverse-proxies API calls to the backend.

## Structure

```
.
├── backend/
│   ├── server.js         # Express app: /api/health, /api/message, /api/secret
│   ├── package.json
│   └── Dockerfile         # multi-stage build
├── frontend/
│   ├── html/
│   │   ├── index.html     # static page with buttons calling the API
│   │   └── style.css
│   ├── nginx.conf         # serves static files + proxies /api/ to app-server
│   └── Dockerfile
├── secrets/
│   └── app_secret.txt     # local file backing the Docker secret (create this yourself)
└── docker-compose.yml
```

## How it works

- `frontend` (nginx) is the only service exposed to the host, on port `8080`.
- `app-server` (Express) is only reachable from inside the Compose network —
  nginx forwards any `/api/...` request to it via `proxy_pass http://app-server:3000`.
- `app-server` reads a Docker secret from `/run/secrets/app_secret`, backed by
  `secrets/app_secret.txt` on the host — used to learn Docker secrets, not for
  real production use (a real app wouldn't expose secrets over an API).

## Setup

Create the local secret file (not committed to git):

```bash
mkdir -p secrets
echo "my-super-secret-value" > secrets/app_secret.txt
```

## Run

```bash
docker compose up --build
```

Add `-d` to run in the background.

## Verify

Open `http://localhost:8080` in a browser — the static page should load, and
all three buttons (Check Health, Get Message, Get Secret) should work.

Or from the command line:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/message
curl http://localhost:8080/api/secret
```

All requests go through nginx on port 8080 — `app-server` has no port exposed
to the host and can't be reached directly.

## Notes

- Windows/Git Bash users: manual `docker run -v` mounts can have their paths
  mangled by Git Bash; prefix with `MSYS_NO_PATHCONV=1` if you hit that. Plain
  `docker compose` commands aren't affected.
- `depends_on` only waits for the `app-server` container to start, not for
  Express inside it to finish booting — fine here since Express boots almost
  instantly, but worth knowing for production setups.