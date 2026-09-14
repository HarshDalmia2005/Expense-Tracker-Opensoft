# SPEND SENSE

## Overview

SPEND SENSE is a full-stack expense tracking web application designed to help users manage their finances efficiently. Built with a React frontend and a Node.js/Express backend, it offers expense tracking, group bill splitting, AI-powered chatbot assistance, OCR receipt scanning, financial goal setting, and Google OAuth authentication.

---

## Features

### Frontend
- **React with Vite**: Fast and optimized development environment
- **Responsive Design**: Compatible across all devices
- **Dynamic Components**: Modular and reusable React components
- **State Management**: Efficient application state handling
- **Modern Styling**: Tailwind CSS for clean, modern UI

### Backend
- **Node.js with Express**: Lightweight and scalable backend
- **MongoDB**: NoSQL database for flexible data storage
- **JWT Authentication**: Secure token-based user login and registration
- **Google OAuth 2.0**: Sign in with Google via Passport.js
- **Session Management**: Persistent sessions with `express-session`
- **RESTful APIs**: Clean endpoints for all frontend operations
- **AI Chatbot**: Gemini-powered financial assistant
- **OCR Receipt Scanning**: Extract expense data from receipt images using Gemini Vision
- **Group Expense Management**: Create groups and split bills among members
- **Financial Goals**: Set and track savings/spending goals
- **Activity Logs**: Track user activity across the application
- **Health Check Endpoint**: Monitor uptime, memory, CPU, and DB response time

---

## Project Structure

```
Expense-Tracker-Opensoft/
├── Readme.md
├── docker-compose.yml
├── deploy.sh                        # One-shot EC2 setup script
├── .github/
│   └── workflows/
│       └── ci.yml                   # CI: lint → build → push to GHCR → update manifests
├── k8s/
│   ├── namespace.yaml
│   ├── argocd/
│   │   └── argocd-app.yaml
│   ├── backend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── secret.yaml              # CHANGE_ME placeholders — applied manually via deploy.sh
│   ├── cert-manager/
│   │   └── cluster-issuer.yaml      # letsencrypt-staging + letsencrypt-prod
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml             # Traefik ingress with TLS
│   │   └── redirect-middleware.yaml # HTTP → HTTPS redirect
│   └── mongodb/
│       ├── deployment.yaml          # StatefulSet with 2Gi PVC
│       └── service.yaml
├── backend/
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── src/
└── frontend/
    ├── .env.example
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    └── src/
```

---

## Technologies Used

### Frontend
- React, Vite, Tailwind CSS
- Nginx (serves built static files inside container)

### Backend
- Node.js, Express.js, MongoDB + Mongoose
- Passport.js (Google OAuth), express-session, JWT
- Google Gemini API (Chatbot + OCR)

### Infrastructure
- **k3s** — lightweight Kubernetes on EC2
- **Traefik** — ingress controller (bundled with k3s)
- **cert-manager v1.17.2** — automatic TLS via Let's Encrypt
- **ArgoCD** — GitOps continuous delivery
- **GitHub Actions** — CI pipeline (lint → build → push to GHCR)
- **GitHub Container Registry (GHCR)** — stores Docker images
- **DuckDNS** — free dynamic DNS (`spendsense.duckdns.org`)

---

## Local Development Setup

### Prerequisites
- Node.js v20+, npm
- MongoDB (local or Atlas)
- Google Cloud project (for OAuth & Gemini API)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm start
```

`.env` variables:

```env
PORT=5000
mongoDBURL=your_mongodb_connection_string
JWT_SECRET=any_random_secret_string
SESSION_SECRET=another_random_secret_string
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Free key from https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# .env only needs: VITE_BACKEND_URL=http://localhost:5000
npm run dev
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **Google+ API** and create **OAuth 2.0 credentials**.
3. Set the authorised redirect URI to:
   ```
   http://localhost:5000/api/oauth/google/callback
   ```
   For production add:
   ```
   https://spendsense.duckdns.org/api/oauth/google/callback
   ```
4. Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into your `.env`.

---

## Docker Compose (Quick Local Run)

Runs MongoDB + backend + frontend together. No Kubernetes needed.

```bash
# Ensure backend/.env is populated first
cp backend/.env.example backend/.env
# Edit backend/.env with real values

docker-compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost/api (proxied by Nginx)
- MongoDB: localhost:27017

---

## EC2 Production Deployment (Kubernetes / k3s)

This is the exact setup running at **https://spendsense.duckdns.org**.

### Architecture overview

```
Internet
   │
   ▼
EC2 (Ubuntu, ports 80 + 443 open)
   │
   ▼
k3s (single-node Kubernetes)
   │
   ├── Traefik (Ingress Controller)  ← handles TLS termination
   │       ├── /api    → backend:5000
   │       ├── /health → backend:5000
   │       └── /       → frontend:80
   │
   ├── cert-manager  ← auto-renews Let's Encrypt TLS cert
   ├── ArgoCD        ← watches GitHub repo, syncs k8s manifests
   └── spend-sense namespace
           ├── frontend  (Deployment + ClusterIP Service)
           ├── backend   (Deployment + ClusterIP Service)
           └── mongodb   (StatefulSet + Headless Service + 2Gi PVC)
```

CI/CD flow:

```
git push → GitHub Actions (lint → build images → push to GHCR → update image tags in k8s manifests)
                                                                          │
                                                               ArgoCD detects manifest change
                                                                          │
                                                               Rolls out new pods on EC2
```

---

### Step 0 — Make GHCR images public

By default GitHub Packages creates Docker images as **Private**. The k3s cluster pulls images without authentication, so they must be public.

1. Go to your GitHub profile → **Packages**.
2. Select `spend-sense-backend` → **Package Settings**.
3. Under **Danger Zone**, change visibility to **Public**.
4. Repeat for `spend-sense-frontend`.

> You only need to do this once, after the first CI build pushes the images.

---

### Step 1 — Launch EC2 instance

- **AMI**: Ubuntu 22.04 LTS (or 24.04)
- **Instance type**: t3.medium or larger (needs ~3 GB RAM for k3s + all pods)
- **Storage**: 20 GB+
- **Security Group — inbound rules**:

| Port        | Protocol | Source     | Purpose                   |
|-------------|----------|------------|---------------------------|
| 22          | TCP      | Your IP    | SSH                        |
| 80          | TCP      | 0.0.0.0/0  | HTTP (redirects to HTTPS) |
| 443         | TCP      | 0.0.0.0/0  | HTTPS                     |
| 30000-32767 | TCP      | 0.0.0.0/0  | NodePort (ArgoCD UI)      |

---

### Step 2 — Point DuckDNS to your EC2 IP

1. Log in at https://www.duckdns.org
2. Create or update the subdomain (e.g. `spendsense`) to point to your EC2's **public IPv4**.
3. Verify:
   ```bash
   nslookup spendsense.duckdns.org
   # Should return your EC2 public IP
   ```

> DuckDNS updates can take a few minutes to propagate. cert-manager's HTTP-01 ACME challenge requires the domain to resolve correctly before it can issue a TLS certificate.

---

### Step 3 — Prepare and run the deploy script

The `deploy.sh` script at the repo root automates the entire setup from scratch. It:
1. Uninstalls any existing k3s
2. Clones a fresh copy of the repo
3. Installs k3s
4. Installs cert-manager
5. Creates the `spend-sense` namespace and injects real secrets
6. Applies all k8s manifests
7. Installs and configures ArgoCD

**Before running**, edit `deploy.sh` and fill in your real secret values in the `kubectl create secret` block:

```bash
# Copy deploy.sh to EC2
scp -i your-key.pem deploy.sh ubuntu@<EC2_PUBLIC_IP>:~/deploy.sh

# SSH in
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Edit secret values
nano ~/deploy.sh
```

Find this block and replace every placeholder:

```bash
sudo kubectl create secret generic backend-secret \
  --namespace spend-sense \
  --from-literal=PORT=5000 \
  --from-literal=mongoDBURL="mongodb://mongodb:27017/spendSense" \
  --from-literal=JWT_SECRET="<your_jwt_secret>" \
  --from-literal=SESSION_SECRET="<your_session_secret>" \
  --from-literal=FRONTEND_URL="https://spendsense.duckdns.org" \
  --from-literal=BACKEND_URL="https://spendsense.duckdns.org/api" \
  --from-literal=GOOGLE_CLIENT_ID="<your_google_client_id>" \
  --from-literal=GOOGLE_CLIENT_SECRET="<your_google_client_secret>" \
  --from-literal=GEMINI_API_KEY="<your_gemini_api_key>" \
  --dry-run=client -o yaml | sudo kubectl apply -f -
```

Generate strong random secrets with:
```bash
openssl rand -hex 32   # run twice — once for JWT_SECRET, once for SESSION_SECRET
```

Then run the script:

```bash
chmod +x ~/deploy.sh
~/deploy.sh
```

Full runtime is approximately 5–8 minutes. The ArgoCD admin password is printed at the end.

---

### Step 4 — Verify the deployment

```bash
# All pods should be Running
sudo kubectl get pods -n spend-sense

# Check ingress and TLS certificate
sudo kubectl get ingress -n spend-sense
sudo kubectl get certificate -n spend-sense

# Tail logs if a pod is not healthy
sudo kubectl logs -n spend-sense deployment/backend --tail=50
sudo kubectl logs -n spend-sense deployment/frontend --tail=50
sudo kubectl logs -n spend-sense statefulset/mongodb --tail=50

# Describe a pod for events/errors
sudo kubectl describe pod -n spend-sense -l app=backend
```

Expected output of `kubectl get pods -n spend-sense`:

```
NAME                        READY   STATUS    RESTARTS   AGE
backend-xxxx-xxxx           1/1     Running   0          2m
frontend-xxxx-xxxx          1/1     Running   0          2m
mongodb-0                   1/1     Running   0          2m
```

---

### Step 5 — Access ArgoCD UI

ArgoCD is exposed as a NodePort service.

```bash
# Find the NodePort assigned to argocd-server
sudo kubectl get svc argocd-server -n argocd
```

Open in browser: `http://<EC2_PUBLIC_IP>:<NodePort>`

- **Username**: `admin`
- **Password**: printed at end of `deploy.sh`, or retrieve with:
  ```bash
  sudo kubectl -n argocd get secret argocd-initial-admin-secret \
    -o jsonpath="{.data.password}" | base64 -d && echo
  ```

> After first login, change the default password via ArgoCD UI → User Info → Update Password.

---

### Step 6 — Verify TLS certificate

cert-manager provisions a Let's Encrypt certificate via HTTP-01 challenge through Traefik. It takes 1–3 minutes after the ingress is created.

```bash
# Watch certificate status
sudo kubectl get certificate -n spend-sense -w

# Should eventually show:
# NAME              READY   SECRET            AGE
# spend-sense-tls   True    spend-sense-tls   3m
```

Once `READY = True`, https://spendsense.duckdns.org is live with a valid certificate.

---

### How CI/CD works (GitHub Actions → ArgoCD)

1. **Push to `main`** triggers `.github/workflows/ci.yml`.
2. **Lint job** — runs ESLint on frontend, syntax check on backend.
3. **Build & Push job** (push to main only, not PRs):
   - Builds both Docker images
   - Pushes to GHCR (`ghcr.io/harshdalmia2005/spend-sense-backend:<sha>` and `spend-sense-frontend:<sha>`)
   - `VITE_BACKEND_URL=https://spendsense.duckdns.org/api` is baked into the frontend image at build time
4. **Update Manifests job**:
   - Updates image tags in `k8s/backend/deployment.yaml` and `k8s/frontend/deployment.yaml`
   - Commits and pushes those changes back to `main` with `[skip ci]`
5. **ArgoCD** (running on EC2) detects the manifest change and automatically rolls out new pods.

> `k8s/backend/secret.yaml` is **excluded** from ArgoCD sync (see `argocd-app.yaml`). Secrets are applied manually via `deploy.sh` and never overwritten by GitOps.

---

### Updating secrets after deployment

If you need to rotate a secret (e.g. new Gemini API key):

```bash
sudo kubectl create secret generic backend-secret \
  --namespace spend-sense \
  --from-literal=PORT=5000 \
  --from-literal=mongoDBURL="mongodb://mongodb:27017/spendSense" \
  --from-literal=JWT_SECRET="<new_or_existing_value>" \
  --from-literal=SESSION_SECRET="<new_or_existing_value>" \
  --from-literal=FRONTEND_URL="https://spendsense.duckdns.org" \
  --from-literal=BACKEND_URL="https://spendsense.duckdns.org/api" \
  --from-literal=GOOGLE_CLIENT_ID="<value>" \
  --from-literal=GOOGLE_CLIENT_SECRET="<value>" \
  --from-literal=GEMINI_API_KEY="<new_value>" \
  --dry-run=client -o yaml | sudo kubectl apply -f -

# Restart backend to pick up new secret
sudo kubectl rollout restart deployment/backend -n spend-sense
```

---

### Re-deploying from scratch

If you need to wipe everything and start fresh on the same EC2 instance:

```bash
# This destroys k3s and all cluster data (including MongoDB PVC)
sudo /usr/local/bin/k3s-uninstall.sh

# Then re-run the deploy script
~/deploy.sh
```

> **Warning**: This deletes all MongoDB data. Back up the database first if needed:
> ```bash
> sudo kubectl exec -n spend-sense statefulset/mongodb -- \
>   mongodump --out /tmp/backup
> sudo kubectl cp spend-sense/mongodb-0:/tmp/backup ./mongodb-backup
> ```

---

### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Pods stuck in `ImagePullBackOff` | Image is private or not yet built | Make GHCR packages public (Step 0); push to `main` to trigger CI |
| `CrashLoopBackOff` on backend | Bad secret value or MongoDB not ready | `sudo kubectl logs -n spend-sense deployment/backend` |
| Certificate stuck in `False` / pending | DuckDNS not pointing to EC2, or port 80 blocked | Verify DNS resolves to EC2; check security group allows port 80 |
| ArgoCD shows `OutOfSync` on `secret.yaml` | Expected — secret is excluded from sync | Safe to ignore; secret is managed manually |
| Site loads but API calls fail | `VITE_BACKEND_URL` baked incorrectly | Check the build-arg value in CI logs |
| MongoDB PVC stuck in `Pending` | Storage class issue | `sudo kubectl get pods -n kube-system` — verify `local-path` provisioner is running |

---

## API Health Check

```
GET /health
```

Returns server uptime, memory usage, CPU load, and database response time. Used by Kubernetes liveness and readiness probes.

---

## Team Members

| Name |
|------|
| Shivam Kumar |
| Madhav Samdani |
| Harsh Dalmia |
| Ranveer Raj |
| Nikhil Patel |

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

Special thanks to the OpenSoft team for their support and guidance.
