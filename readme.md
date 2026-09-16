# Docker Compose + Kubernetes Learning Project

A small 2-service project built to learn Docker Compose and Kubernetes hands-on: a
Node/Express backend (`app-server`) and an nginx frontend (`frontend`) that serves
a static page and reverse-proxies API calls to the backend. Built first with Docker
Compose, then migrated to Kubernetes as a practice exercise - same app, different
orchestration layer.

---

## Docker Compose

### Structure

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

### How it works

- `frontend` (nginx) is the only service exposed to the host, on port `8080`.
- `app-server` (Express) is only reachable from inside the Compose network -
  nginx forwards any `/api/...` request to it via `proxy_pass http://app-server:3000`.
- `app-server` reads a Docker secret from `/run/secrets/app_secret`, backed by
  `secrets/app_secret.txt` on the host - used to learn Docker secrets, not for
  real production use (a real app wouldn't expose secrets over an API).

### Setup

Create the local secret file (not committed to git):

```bash
mkdir -p secrets
echo "my-super-secret-value" > secrets/app_secret.txt
```

### Run

```bash
docker compose up --build
```

Add `-d` to run in the background.

### Verify

Open `http://localhost:8080` in a browser - the static page should load, and
all three buttons (Check Health, Get Message, Get Secret) should work.

Or from the command line:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/message
curl http://localhost:8080/api/secret
```

All requests go through nginx on port 8080 - `app-server` has no port exposed
to the host and can't be reached directly.

### Notes

- Windows/Git Bash users: manual `docker run -v` mounts can have their paths
  mangled by Git Bash; prefix with `MSYS_NO_PATHCONV=1` if you hit that. Plain
  `docker compose` commands aren't affected.
- `depends_on` only waits for the `app-server` container to start, not for
  Express inside it to finish booting - fine here since Express boots almost
  instantly, but worth knowing for production setups.

---

## Kubernetes

### Structure

```
k8s/
├── app-server-deployment.yaml
├── app-server-service.yaml
├── frontend-deployment.yaml
└── frontend-service.yaml
```

### How it works

- Everything runs in its own namespace: `docker-app`.
- `app-server` and `frontend` each get a **Deployment** (self-healing, replaces
  `docker compose up`'s container-per-service) and a **ClusterIP Service**
  (internal DNS name, replaces the Compose network's automatic service discovery).
- `nginx.conf` is unchanged - the `app-server` Service gives the same
  `app-server` hostname on port `3000` that Compose provided, so
  `proxy_pass http://app-server:3000;` works as-is.
- The Docker secret is replaced by a Kubernetes **Secret** (`app-secret`),
  mounted at `/run/secrets` inside the `app-server` pod so the app can keep
  reading `/run/secrets/app_secret` unchanged.
- Images are pushed to Docker Hub and pulled from there (not loaded via
  `minikube image load`).
- No Ingress - kept to the simplest exposure method for local practice
  (`kubectl port-forward`).

### Setup

```bash
kubectl create namespace docker-app

docker build -t <dockerhub-username>/app-server:v1 ./backend
docker push <dockerhub-username>/app-server:v1

docker build -t <dockerhub-username>/frontend:v1 ./frontend
docker push <dockerhub-username>/frontend:v1

kubectl create secret generic app-secret \
  --from-file=app_secret=./secrets/app_secret.txt \
  -n docker-app
```

### Run

```bash
kubectl apply -f k8s/app-server-deployment.yaml
kubectl apply -f k8s/app-server-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

### Verify

```bash
kubectl get pods -n docker-app
kubectl get svc -n docker-app

kubectl port-forward svc/frontend 8080:80 -n docker-app
```

Open `http://localhost:8080` - same buttons, same behavior as the Compose version.

### Notes

- `automountServiceAccountToken: false` is set on the `app-server` pod spec.
  It's required because the Secret volume is mounted at `/run/secrets` - the
  same parent path Kubernetes uses to auto-mount the pod's service account
  token. Without disabling that auto-mount, the container fails to start with
  a `read-only file system` error.
- `kubectl create secret --from-file=path` uses the filename as the key unless
  you pass `--from-file=key=path` explicitly. A key/mountPath mismatch shows up
  as `ENOENT` on the file inside the pod - recreate the secret with the
  explicit key name if that happens.