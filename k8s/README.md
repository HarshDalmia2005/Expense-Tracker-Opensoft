# Spend Sense — Kubernetes + CI/CD Setup

This document covers the complete infrastructure: what was set up, how it works, the one-time setup steps you need to do, and the day-to-day developer workflow.

---

## Architecture Overview

```
Developer
  │  git push origin main
  ▼
GitHub Actions (CI)
  ├── 1. Lint (eslint + node syntax check)
  ├── 2. Build Docker images → push to GHCR with short-SHA tag
  └── 3. Update image tags in k8s/*/deployment.yaml → commit [skip ci]
             │
             │  ArgoCD polls Git every 3 min (or via webhook)
             ▼
    k3s cluster on VM (3.108.236.141)
    ┌─────────────────────────────────────────┐
    │  namespace: spend-sense                  │
    │  ┌──────────┐  ┌─────────┐  ┌────────┐ │
    │  │ MongoDB  │  │ Backend │  │Frontend│ │
    │  │ :27017   │  │  :5000  │  │  :80   │ │
    │  └──────────┘  └─────────┘  └────────┘ │
    │         Traefik Ingress (ports 80/443)   │
    │         cert-manager (Let's Encrypt TLS) │
    └─────────────────────────────────────────┘
             │
             ▼
    https://spendsense.duckdns.org
```

---

## Tools & Versions

| Tool | Purpose | Version |
|---|---|---|
| k3s | Lightweight Kubernetes | v1.36.3+k3s1 |
| Traefik | Ingress controller (ships with k3s) | built-in |
| cert-manager | Automatic TLS via Let's Encrypt | v1.17.2 |
| ArgoCD | GitOps CD — watches repo, syncs cluster | stable |
| GitHub Actions | CI — lint, build, push images | — |
| GHCR | GitHub Container Registry (free) | — |

---

## One-Time Setup (Automated via deploy.sh)

We provide a fully automated `deploy.sh` script that handles the complete infrastructure setup on a fresh VM.

### Automated Setup
1. SSH into your EC2 instance.
2. Create `deploy.sh` and paste the contents (do **not** commit `deploy.sh` to Git as it contains secrets).
3. Run the script:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
This script automatically:
- Uninstalls any broken Kubernetes state
- Installs `unzip`, `kiro` CLI, and `k3s`
- Installs `cert-manager`
- Applies your Kubernetes secrets and manifests
- Installs `ArgoCD` and prints your admin password

---

## Required Secrets

### GitHub Repository Secrets
Go to **Settings → Secrets and variables → Actions** in the GitHub repo.

| Secret | Value | Used for |
|---|---|---|
| *(none needed)* | `GITHUB_TOKEN` is automatic | Pushing images to GHCR |

That's it — GHCR uses the built-in `GITHUB_TOKEN`, so no Docker Hub account needed.

### Kubernetes Backend Secret
The file `k8s/backend/secret.yaml` is a **template** — it contains placeholder values.
Before the backend pod can start, create the real secret on the cluster:

```bash
sudo kubectl create secret generic backend-secret \
  --namespace spend-sense \
  --from-literal=PORT=5000 \
  --from-literal=mongoDBURL="mongodb://mongodb:27017/spendSense" \
  --from-literal=JWT_SECRET="<generate a random 64-char string>" \
  --from-literal=SESSION_SECRET="<generate a random 64-char string>" \
  --from-literal=FRONTEND_URL="https://spendsense.duckdns.org" \
  --from-literal=BACKEND_URL="https://spendsense.duckdns.org/api" \
  --from-literal=GOOGLE_CLIENT_ID="<from Google Cloud Console>" \
  --from-literal=GOOGLE_CLIENT_SECRET="<from Google Cloud Console>" \
  --from-literal=GEMINI_API_KEY="<from aistudio.google.com>" \
  --dry-run=client -o yaml | sudo kubectl apply -f -
```

> **Do not** put real secrets in the `k8s/backend/secret.yaml` file or commit them to Git.

---

## Updating the ClusterIssuer Email

Edit `k8s/cert-manager/cluster-issuer.yaml`, replace `your-email@example.com` with your real email, then re-apply:
```bash
sudo kubectl apply -f k8s/cert-manager/cluster-issuer.yaml
```

---

## ArgoCD UI Access

| Detail | Value |
|---|---|
| URL | `http://3.108.236.141:32577` (HTTPS NodePort) |
| Username | `admin` |
| Initial password | Run: `sudo kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" \| base64 -d` |

> Change the password after first login: **User Info → Update Password**

---

## Day-to-Day Developer Workflow

### Making a code change

```bash
# 1. Make your changes locally
# 2. Push to main
git add .
git commit -m "feat: your feature"
git push origin main

# That's it. The pipeline takes over:
# ├── GitHub Actions runs (~2-3 min)
# │   ├── Lints the code
# │   ├── Builds backend + frontend Docker images
# │   ├── Pushes them to GHCR with the commit SHA tag
# │   └── Updates image tags in k8s manifests, commits back
# └── ArgoCD detects the manifest update (~1-3 min)
#     └── Rolls out new pods with zero downtime
```

Total time from `git push` to live: **~4-6 minutes**

### Checking deployment status

```bash
# All pods
sudo kubectl get pods -n spend-sense

# Watch pods rolling
sudo kubectl get pods -n spend-sense -w

# Pod logs
sudo kubectl logs -n spend-sense deployment/backend -f
sudo kubectl logs -n spend-sense deployment/frontend -f

# ArgoCD sync status
sudo kubectl get application -n argocd
```

### Rolling back a bad deployment

```bash
# Option 1 — rollback via kubectl (immediate)
sudo kubectl rollout undo deployment/backend -n spend-sense
sudo kubectl rollout undo deployment/frontend -n spend-sense

# Option 2 — rollback via ArgoCD UI
# Go to http://3.108.236.141:32577 → spend-sense app → History → Rollback

# Option 3 — revert the Git commit (proper GitOps way)
git revert HEAD
git push origin main
# ArgoCD will sync the reverted manifests automatically
```

### Viewing logs
```bash
# Backend
sudo kubectl logs -n spend-sense -l app=backend --tail=100 -f

# Frontend (Nginx)
sudo kubectl logs -n spend-sense -l app=frontend --tail=50

# MongoDB
sudo kubectl logs -n spend-sense -l app=mongodb --tail=50
```

### Scaling
```bash
# Scale backend to 2 replicas
sudo kubectl scale deployment backend -n spend-sense --replicas=2

# Note: ArgoCD selfHeal will revert this to 1 (what's in Git)
# To persist the change, edit k8s/backend/deployment.yaml and push
```

---

## File Structure

```
k8s/
├── README.md                        ← this file
├── namespace.yaml                   ← spend-sense namespace
├── argocd/
│   └── argocd-app.yaml              ← ArgoCD watches k8s/ in main branch
├── cert-manager/
│   └── cluster-issuer.yaml          ← Let's Encrypt staging + prod issuers
├── mongodb/
│   ├── deployment.yaml              ← MongoDB 7.0 StatefulSet with health checks
│   └── service.yaml                 ← Headless service :27017
├── backend/
│   ├── secret.yaml                  ← TEMPLATE ONLY — do not put real values here
│   ├── deployment.yaml              ← image tag updated by CI on every push
│   └── service.yaml                 ← ClusterIP :5000
└── frontend/
    ├── deployment.yaml              ← image tag updated by CI on every push
    ├── service.yaml                 ← ClusterIP :80
    └── ingress.yaml                 ← Traefik + TLS via cert-manager
```

---

## Troubleshooting

### Pods stuck in ErrImageNeverPull or ImagePullBackOff
This happens because your EC2 is not allowed to pull the images from GitHub Container Registry. 
1. The images don't exist in GHCR yet — they get pushed on the first CI run. Push any change to `main` to trigger the pipeline.
2. **CRITICAL:** GitHub Packages are Private by default. You must go to your GitHub Profile → Packages → `spend-sense-backend` → Package Settings → Change visibility to **Public**. Repeat for the frontend.
```bash
sudo kubectl describe pod -n spend-sense <pod-name>
```

### cert-manager not issuing certificate
```bash
sudo kubectl get certificate -n spend-sense
sudo kubectl describe certificate spend-sense-tls -n spend-sense
sudo kubectl get challenges -n cert-manager
```
Make sure port 80 is open in your firewall/security group (needed for HTTP-01 challenge).

### ArgoCD shows OutOfSync
```bash
sudo kubectl get application spend-sense -n argocd -o yaml | grep -A5 conditions
```
Usually means a resource in the cluster drifts from Git. ArgoCD's `selfHeal: true` will fix it automatically within a few minutes.

### Check Traefik ingress
```bash
sudo kubectl get ingress -n spend-sense
sudo kubectl describe ingress spend-sense-ingress -n spend-sense
sudo kubectl logs -n kube-system -l app.kubernetes.io/name=traefik -f
```

### ArgoCD UI is not loading in the browser
If your browser spins and times out, AWS is blocking the connection.
1. Go to your **AWS EC2 Console** → **Security Groups**.
2. Edit Inbound Rules and add a **Custom TCP** rule for port range **30000-32767** with source `0.0.0.0/0`.
3. Ensure you are navigating to `https://` (ArgoCD enforces HTTPS) and bypass the self-signed certificate warning.
