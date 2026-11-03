# DeployForge 🚀

**Production‑grade self‑service deployment platform** (Mini‑Heroku / Vercel) built as a monorepo.  It provides:
- GitHub OAuth login
- Build queue (BullMQ) that clones a repo, builds a Docker image (Dockerfile or Buildpacks) with Kaniko, pushes to GHCR or a local registry
- Kubernetes deployer that creates a per‑user namespace, Deployment, Service, Ingress, HPA, ResourceQuota, LimitRange, and a default‑deny NetworkPolicy
- Real‑time build logs via SSE, runtime metrics (Prometheus) and logs (Loki)
- One‑click rollback, autoscaling, and GitHub webhook auto‑deploy
- Full GitOps via Helm + ArgoCD
- IaC on AWS (single EC2 + K3s) using Terraform with **GitHub OIDC** – no static cloud credentials

## Quick start (local)
```bash
# 1️⃣ Bring up the supporting stack (Postgres, Redis, local registry, API, dashboard)
make up

# 2️⃣ Create a local K3d (or Kind) cluster with ingress
bash scripts/create-local-cluster.sh k3d   # or kind

# 3️⃣ Install the platform Helm chart into the cluster
helm upgrade --install deployforge ./infra/helm/deployforge \
  --namespace deployforge --create-namespace
```
Open the dashboard at <http://localhost:3000> and start deploying sample apps (see `sample-apps/`).

## Cloud deployment (AWS)
```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit values (region, admin CIDR, etc.)
terraform apply -target=module.state   # create remote‑state bucket & DynamoDB lock
terraform init                         # enable the backend
terraform apply                         # full stack – VPC, EC2‑K3s, OIDC role, etc.
```
The output `k3s_public_ip` is the Elastic IP for your platform. Point your domain (A record) to it – cert‑manager will issue Let’s Encrypt certificates automatically.

## CI/CD pipeline (GitHub Actions)
The workflow (`.github/workflows/ci.yml`) performs:
1. Lint, type‑check, unit & smoke tests
2. Multi‑arch Docker builds for API, Worker, Dashboard (push to GHCR)
3. Security scans – Trivy (critical only) and Gitleaks
4. Assumes the **GitHub OIDC IAM role** created by Terraform (no static keys)
5. Triggers an ArgoCD sync so the new images are deployed instantly.

## Documentation
- Architecture diagram: `docs/architecture.md`
- Runbook & operational checklist: `docs/runbook.md`
- Interview prep & resume bullets: `docs/INTERVIEW_NOTES.md`

## Cost estimate
Running the whole stack on a single `t3.medium` EC2 (plus minimal storage) costs **≈ $30 / month** in us‑east‑1. Remote state + DynamoDB locks are negligible.

## Clean up
```bash
# Local
make down   # stops docker‑compose stack
kubectl delete namespace deployforge
# Cloud
cd infra/terraform && terraform destroy
```

---

*Ready for a 3‑minute demo video – see `docs/demo.sh` for the script.*
