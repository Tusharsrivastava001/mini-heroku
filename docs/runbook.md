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
