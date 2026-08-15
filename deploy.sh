#!/bin/bash
set -e

echo "Starting deployment setup..."

# 1. Install unzip and Kiro CLI
sudo apt-get update -y
sudo apt-get install -y unzip
curl -sL https://kiro.sh/install | bash

# 2. Install k3s
curl -sfL https://get.k3s.io | sh -
echo "Waiting for k3s to be ready..."
sleep 15
sudo kubectl get nodes

# 3. Install cert-manager
sudo kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.17.2/cert-manager.yaml
echo "Waiting for cert-manager pods to be ready..."
sudo kubectl wait --for=condition=ready pod -l app=cert-manager -n cert-manager --timeout=120s

# 4. Apply namespace
sudo kubectl apply -f k8s/namespace.yaml

# 5. Create backend secret
# IMPORTANT: Secrets should be set via environment variables or external secret management
# Example: export JWT_SECRET="your-secret-here" before running this script
echo "Creating backend secret from environment variables..."
sudo kubectl create secret generic backend-secret \
  --namespace spend-sense \
  --from-literal=PORT=5000 \
  --from-literal=mongoDBURL="mongodb://mongodb:27017/spendSense" \
  --from-literal=JWT_SECRET="${JWT_SECRET:-change-me-in-production}" \
  --from-literal=SESSION_SECRET="${SESSION_SECRET:-change-me-in-production}" \
  --from-literal=FRONTEND_URL="https://spendsense.duckdns.org" \
  --from-literal=BACKEND_URL="https://spendsense.duckdns.org/api" \
  --from-literal=GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}" \
  --from-literal=GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}" \
  --from-literal=GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
  --dry-run=client -o yaml | sudo kubectl apply -f -

# 6. Apply application manifests
sudo kubectl apply -f k8s/mongodb/
sudo kubectl apply -f k8s/backend/deployment.yaml
sudo kubectl apply -f k8s/backend/service.yaml
sudo kubectl apply -f k8s/frontend/
sudo kubectl apply -f k8s/cert-manager/cluster-issuer.yaml

# 7. Install ArgoCD
sudo kubectl create namespace argocd || true
sudo kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
echo "Waiting for ArgoCD pods to be ready..."
sudo kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=180s

# 8. Expose ArgoCD UI via NodePort
sudo kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "NodePort"}}'

# 9. Get ArgoCD admin password
echo "ArgoCD Admin Password:"
sudo kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
echo ""

# 10. Apply ArgoCD Application
sudo kubectl apply -f k8s/argocd/argocd-app.yaml

echo "Deployment setup complete."
