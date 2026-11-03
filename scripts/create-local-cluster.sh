#!/usr/bin/env bash
# DeployForge - Local Kubernetes Cluster Provisioner
# Creates a local K3d (default) or Kind cluster with Ingress & local registry.

set -euo pipefail

CLUSTER_TYPE="${1:-k3d}"
CLUSTER_NAME="deployforge"
REGISTRY_NAME="deployforge-registry"
REGISTRY_PORT="5001"
BASE_DOMAIN="${BASE_DOMAIN:-localtest.me}"

echo "=================================================="
echo "🚀 DeployForge Local Cluster Setup ($CLUSTER_TYPE)"
echo "=================================================="

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Preflight checks
if ! command_exists docker; then
  echo "❌ Error: Docker is required but not installed or running." >&2
  exit 1
fi

if ! command_exists kubectl; then
  echo "❌ Error: kubectl is required but not installed." >&2
  exit 1
fi

if [[ "$CLUSTER_TYPE" == "k3d" ]]; then
  if ! command_exists k3d; then
    echo "❌ Error: k3d is not installed. Install via: brew install k3d / curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash" >&2
    exit 1
  fi

  echo "📦 Checking if cluster '$CLUSTER_NAME' already exists..."
  if k3d cluster list | grep -q "$CLUSTER_NAME"; then
    echo "⚠️ Cluster '$CLUSTER_NAME' already exists. Reusing existing cluster."
  else
    echo "⚡ Creating k3d cluster with Traefik ingress & local registry on port $REGISTRY_PORT..."
    k3d cluster create "$CLUSTER_NAME" \
      --agents 1 \
      --port "80:80@loadbalancer" \
      --port "443:443@loadbalancer" \
      --registry-create "${REGISTRY_NAME}:${REGISTRY_PORT}" \
      --k3s-arg "--disable=traefik@server:0" 2>/dev/null || \
    k3d cluster create "$CLUSTER_NAME" \
      --agents 1 \
      --port "80:80@loadbalancer" \
      --port "443:443@loadbalancer" \
      --registry-create "${REGISTRY_NAME}:${REGISTRY_PORT}"
  fi

elif [[ "$CLUSTER_TYPE" == "kind" ]]; then
  if ! command_exists kind; then
    echo "❌ Error: kind is not installed. Install via: brew install kind / go install sigs.k8s.io/kind@latest" >&2
    exit 1
  fi

  # Create registry container if not running
  if [ "$(docker inspect -f '{{.State.Running}}' "${REGISTRY_NAME}" 2>/dev/null || true)" != 'true' ]; then
    echo "📦 Creating Kind local container registry: ${REGISTRY_NAME}:${REGISTRY_PORT}..."
    docker run -d --restart=always -p "127.0.0.1:${REGISTRY_PORT}:5000" --network bridge --name "${REGISTRY_NAME}" registry:2
  fi

  echo "📦 Creating Kind cluster with port mappings for ingress..."
  cat <<EOF | kind create cluster --name "$CLUSTER_NAME" --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors."localhost:${REGISTRY_PORT}"]
    endpoint = ["http://${REGISTRY_NAME}:5000"]
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF

  # Connect registry to kind network
  if [ "$(docker inspect -f='{{json .NetworkSettings.Networks.kind}}' "${REGISTRY_NAME}")" = 'null' ]; then
    docker network connect "kind" "${REGISTRY_NAME}"
  fi

  echo "🌐 Installing Ingress-NGINX controller for Kind..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
  echo "⏳ Waiting for Ingress controller pods to be ready..."
  kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=120s || true
else
  echo "❌ Unknown cluster type: $CLUSTER_TYPE (Use 'k3d' or 'kind')" >&2
  exit 1
fi

echo "✅ Kubernetes cluster '$CLUSTER_NAME' is active!"
kubectl cluster-info
echo ""
echo "🎯 Ingress Endpoint:   http://localhost (or *.${BASE_DOMAIN})"
echo "🐳 Local Registry:     localhost:${REGISTRY_PORT}"
echo ""
