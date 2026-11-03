# DeployForge Runbook

This runbook covers local bootstrapping, cluster setup, and a minimal operational workflow for the platform.

## Local startup

```bash
make up
```

This brings up:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Local Docker registry on `localhost:5001`
- API on `http://localhost:4000`
- Dashboard on `http://localhost:3000`

## Local cluster setup (K3d/kind)

### Create local cluster

```bash
# Create a k3d cluster (default) with Ingress and local registry
scripts/create-local-cluster.sh k3d

# Or create a kind cluster
scripts/create-local-cluster.sh kind
```

The script will:
- Spin up a single‑node k3d/kind cluster named `deployforge`
- Expose ports 80/443 on the host
- Start a local container registry on port 5001
- Install the NGINX Ingress controller (for both k3d and kind)

### Deploy platform Helm chart

```bash
helm upgrade --install deployforge ./infra/helm/deployforge \
  --namespace deployforge --create-namespace
```

### Verify Ingress controller

```bash
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

## Deploy a sample app manually

```bash
# Create a dedicated namespace for the demo app
kubectl create namespace demo-app

# Deploy the sample app (uses the Docker image from the local registry)
kubectl apply -f scripts/k8s-manifests/deployment.yaml -n demo-app -l APP_NAME=demo-app,NAMESPACE=demo-app,IMAGE=localhost:5001/sample-node-express:latest,PORT=80
kubectl apply -f scripts/k8s-manifests/service.yaml -n demo-app -l APP_NAME=demo-app,NAMESPACE=demo-app,PORT=80
kubectl apply -f scripts/k8s-manifests/ingress.yaml -n demo-app -l APP_NAME=demo-app,NAMESPACE=demo-app,BASE_DOMAIN=localtest.me,PORT=80
kubectl apply -f scripts/k8s-manifests/hpa.yaml -n demo-app -l APP_NAME=demo-app,NAMESPACE=demo-app,MIN_REPLICAS=1,MAX_REPLICAS=3,TARGET_CPU_PERCENT=80,TARGET_MEMORY_PERCENT=80
```

### Verify the app is reachable

```bash
# Should resolve to http://demo-app.localtest.me
curl http://demo-app.localtest.me
```

If you see the response from the sample Node.js app, the local cluster and manifests are working.

## Operational checks

```bash
kubectl get pods -A
kubectl get deployments -A
kubectl get ingress -A
kubectl logs -n deployforge deployforge-api
```

## Troubleshooting

### Ingress not routing

```bash
# Ensure the host entry resolves (localtest.me points to 127.0.0.1 by default)
nslookup demo-app.localtest.me

# Check Ingress resource status
kubectl describe ingress -n demo-app demo-app-ingress
```

### Registry errors

```bash
docker compose logs registry
curl http://localhost:5001/v2/_catalog
```

---

## Cloud deployment notes

For AWS, use the Terraform under `infra/terraform` with a single EC2 + K3s node. The default cost assumption is a `t3.medium` instance and remote state in S3 + DynamoDB. See `docs/SETUP_NEEDED.md` for required values and DNS setup.


```bash
make up
```

This brings up:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Local Docker registry on `localhost:5001`
- API on `http://localhost:4000`
- Dashboard on `http://localhost:3000`

## Local cluster setup (K3d/kind)

### K3d

```bash
k3d cluster create deployforge-local --agents 1 --port 80:80@loadbalancer --port 443:443@loadbalancer --registry-create deployforge-registry:5001
kubectl get nodes
kubectl get pods -A
```

### Helm install (platform)

```bash
helm upgrade --install deployforge ./infra/helm/deployforge \
  --namespace deployforge --create-namespace
```

### Ingress validation

```bash
kubectl get ingress -A
kubectl get svc -n kube-system
```

## Deploy a sample app manually

```bash
kubectl create namespace demo-app
kubectl create deployment demo-app --image=nginx:latest -n demo-app
kubectl expose deployment demo-app --port=80 --target-port=80 -n demo-app
kubectl create ingress demo-app --rule='demo.localtest.me/=demo-app:80' -n demo-app
```

Then access:

```text
http://demo.localtest.me
```

## Operational checks

```bash
kubectl get pods -A
kubectl get deployments -A
kubectl get ingress -A
kubectl logs -n deployforge deployforge-api
```

## Rollback flow

1. Open the dashboard or API project detail page.
2. Select a previous successful deployment from history.
3. Trigger rollback.
4. Confirm the app comes back healthy and the public URL remains active.

## Troubleshooting

### API cannot reach Postgres

```bash
docker compose logs postgres
```

### Registry errors

```bash
docker compose logs registry
curl http://localhost:5001/v2/_catalog
```

### Kubernetes readiness issues

```bash
kubectl get events -A --sort-by=.lastTimestamp
kubectl describe deployment <app-name> -n <namespace>
kubectl logs deploy/<app-name> -n <namespace>
```

## Cloud deployment notes

For AWS, use the Terraform under `infra/terraform` with a single EC2 + K3s node. The default cost assumption is a `t3.medium` instance and remote state in S3 + DynamoDB. See `docs/SETUP_NEEDED.md` for required values and DNS setup.
