# DeployForge Runbook

## 1️⃣ Local Development

1️⃣ **Start platform services**
```bash
make up   # docker‑compose: postgres, redis, local registry, API, dashboard
```
2️⃣ **Create a local K3d (or Kind) cluster**
```bash
bash scripts/create-local-cluster.sh k3d   # or: bash scripts/create-local-cluster.sh kind
```
3️⃣ **Install the Helm chart**
```bash
helm upgrade --install deployforge ./infra/helm/deployforge \
  --namespace deployforge --create-namespace
```
4️⃣ **Verify**
```bash
# Dashboard UI
open http://localhost:3000
# Health endpoint
curl http://localhost:4000/api/health
```

## 2️⃣ Cloud Deployment (AWS)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit values (region, admin_cidr, letsencrypt_email, github_repo)
# 1️⃣ Remote‑state bucket & DynamoDB lock (run once)
terraform apply -target=module.state
# 2️⃣ Initialise backend
terraform init
# 3️⃣ Full stack provision
terraform apply
```
*Output:* `k3s_public_ip` – create an **A record** in your DNS provider pointing to this Elastic IP. Cert‑manager (installed by the bootstrap script) will issue Let’s Encrypt certificates for `*.your‑domain.com`.

## 3️⃣ Operational Checklist

```bash
# Check all pods are running
kubectl get pods -A
# Verify Ingress controller
kubectl get pods -n ingress-nginx
# Verify cert‑manager issued certs
kubectl get certificates -A
# Tail platform logs
kubectl logs -f -n deployforge -l app=deployforge-api
```

## 4️⃣ Troubleshooting

- **Ingress not routing** – ensure `localtest.me` resolves (or your DNS A record) and that the Ingress resource has a `Ready` address.
- **Registry errors** – `docker compose logs registry`; test with `curl http://localhost:5001/v2/_catalog`.
- **K3s API unreachable** – verify the security group allows port 6443 from your admin CIDR.
- **ArgoCD sync fails** – check the OIDC role ARN in ArgoCD and that the role has `sts:AssumeRoleWithWebIdentity` permission.

---

# Demo Script (3‑minute video)

Save as `docs/demo.sh` and run it while recording your screen.
```bash
#!/usr/bin/env bash
set -euo pipefail

# ------------------------------------------------------------
# 0️⃣ Prereqs – ensure Docker, kubectl, helm are available.
# ------------------------------------------------------------
echo "💡 Starting DeployForge demo…"

# ------------------------------------------------------------
# 1️⃣ Spin up local stack & cluster
# ------------------------------------------------------------
make up > /dev/null
bash scripts/create-local-cluster.sh k3d > /dev/null
helm upgrade --install deployforge ./infra/helm/deployforge \
  --namespace deployforge --create-namespace > /dev/null

# ------------------------------------------------------------
# 2️⃣ Create a test project via the API (dev‑login shortcut)
# ------------------------------------------------------------
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"demo-$(date +%s)\"}" | jq -r .token)

PROJECT=$(curl -s -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo App","slug":"demo-app","repoUrl":"https://github.com/deployforge/sample-node-express","branch":"main","port":3000}' | jq -r .project.id)

echo "✅ Created project $PROJECT"

# ------------------------------------------------------------
# 3️⃣ Trigger a deployment
# ------------------------------------------------------------
DEPLOY=$(curl -s -X POST http://localhost:4000/api/projects/$PROJECT/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branch":"main"}' | jq -r .deployment.id)

echo "🚀 Deployment queued (ID=$DEPLOY)… waiting for ready"
# poll until status=LIVE
while true; do
  STATUS=$(curl -s http://localhost:4000/api/deployments/$DEPLOY -H "Authorization: Bearer $TOKEN" | jq -r .deployment.status)
  if [[ $STATUS == "LIVE" ]]; then break; fi
  echo "⏳ status=$STATUS"; sleep 5
done

echo "🎉 Deployment LIVE!"

# ------------------------------------------------------------
# 4️⃣ Show the live URL (Ingress routes *.localtest.me)
# ------------------------------------------------------------
URL="http://demo-app.localtest.me"
echo "🌐 Visiting $URL"
curl -s $URL | head -n 5

# ------------------------------------------------------------
# 5️⃣ Wrap‑up – clean resources
# ------------------------------------------------------------
curl -s -X DELETE http://localhost:4000/api/projects/$PROJECT \
  -H "Authorization: Bearer $TOKEN" > /dev/null
make down > /dev/null
kubectl delete namespace deployforge --ignore-not-found

echo "✅ Demo complete – resources cleaned."
```
**Tips for filming**: start recording, run `bash docs/demo.sh`, narrate each step (e.g., "Creating a project… triggering a build… waiting for it to become LIVE… accessing the URL"). The script runs in ~45 seconds, leaving time for explanation.

---

# Interview Notes (`docs/INTERVIEW_NOTES.md`)

## Resume‑style bullets (use on your CV)
- **Designed & built DeployForge**, a self‑service PaaS (Mini‑Heroku/Vercel) in a monorepo with React dashboard, Express API, and a container‑builder worker.
- **Implemented GitHub OAuth & OIDC‑based CI/CD**: secure GitHub Actions workflow that builds multi‑arch images, scans with Trivy & Gitleaks, pushes to GHCR, and triggers ArgoCD sync – no static cloud credentials.
- **Automated Kubernetes provisioning** (K3s on a single EC2) using Terraform (VPC, SG, IAM, remote‑state S3/DynamoDB) and Helm for GitOps.
- **Built a robust build pipeline** leveraging BullMQ, Kaniko, and Buildpacks; streamed real‑time build logs via SSE.
- **Delivered full observability**: Prometheus metrics, Loki logs, Grafana dashboards, auto‑scaling HPA, and readiness‑based rollback.
- **Ensured tenant isolation** with per‑user namespaces, default‑deny NetworkPolicies, ResourceQuotas, LimitRanges, and encrypted K8s Secrets.
- **Optimized cost**: production runs on a single `t3.medium` EC2 (~$30/mo) with auto‑shutdown scripts for idle periods.
- **Auth & audit**: JWT sessions, role‑based access, and an audit‑log table persisted via Prisma.
- **Documented end‑to‑end flow** with Mermaid architecture diagram, runbook, and a 3‑minute demo script.

## 25 Interview Questions & Model Answers
1. **Q:** *Why choose K3s over a full‑size Kubernetes distribution?*  
   **A:** K3s is lightweight, fast to provision, and consumes far fewer resources – ideal for a single‑node dev/preview environment while remaining fully CNCF‑compatible.
2. **Q:** *How does the worker build Docker images without privileged Docker daemon access?*  
   **A:** It uses **Kaniko** (rootless) which builds images inside an unprivileged container, reading the Dockerfile or falling back to Buildpacks, then pushes to the registry.
3. **Q:** *Explain the security benefits of using GitHub OIDC for CI/CD.*  
   **A:** OIDC eliminates static AWS keys; the workflow obtains short‑lived tokens from GitHub, assumes an IAM role with least‑privilege policies, and automatically revokes access when the job ends.
4. **Q:** *What prevents a malicious repository from gaining cluster privileges?*  
   **A:** The worker runs in a confined Docker container, the resulting pod runs under a non‑root security context with a read‑only filesystem, and the deployed namespace is sandboxed by a default‑deny NetworkPolicy.
5. **Q:** *How does DeployForge enforce resource quotas per tenant?*  
   **A:** When a new namespace is created, the deployer applies a **ResourceQuota** (CPU, memory, PVC) and a **LimitRange** (default requests/limits) based on the Project spec.
6. **Q:** *Describe the GitHub webhook flow for auto‑redeploy.*  
   **A:** GitHub sends a signed `push` event → API validates HMAC → webhook service enqueues a build job with the commit SHA → worker rebuilds and redeploys; PR events trigger preview namespaces that auto‑expire.
7. **Q:** *Why use both Trivy and Gitleaks in the CI pipeline?*  
   **A:** Trivy scans built images for known CVEs (runtime risk), while Gitleaks searches source history for accidental credential leaks (static risk).
8. **Q:** *What is the purpose of the `ClusterIssuer` created by the bootstrap script?*  
   **A:** It configures **cert‑manager** to obtain Let’s Encrypt certificates for all Ingress hosts automatically.
9. **Q:** *How does the platform achieve zero‑downtime rollbacks?*  
   **A:** Deployments are immutable – each successful build creates a new image tag. The UI can point the Deployment back to a previous tag, and Kubernetes rolls out the change without traffic loss.
10. **Q:** *Explain the role of BullMQ in the architecture.*  
    **A:** BullMQ provides a reliable, Redis‑backed job queue for build tasks, enabling retries, concurrency control, and progress events streamed via SSE.
11. **Q:** *What does the `apiLimiter` middleware do?*  
    **A:** It rate‑limits incoming API requests (e.g., 100 req/min per IP) to protect against abuse and DoS attacks.
12. **Q:** *Why store JWT secrets and encryption keys in a Helm `Secret` rather than environment variables?*  
    **A:** Kubernetes Secrets are stored encrypted at rest (AES‑256) and can be mounted as files, reducing the risk of exposure in process listings.
13. **Q:** *How does the Helm chart make the platform configurable for different environments?*  
    **A:** All tunable parameters (replica counts, image tags, domain, resource limits) are exposed via `values.yaml`; overrides can be passed with `--set`.
14. **Q:** *What is the advantage of using a single Helm chart versus separate charts per component?*  
    **A:** A single chart simplifies versioning and ensures all components are deployed atomically, guaranteeing compatibility across API, worker, and dashboard.
15. **Q:** *What happens if the readiness probe of a new deployment fails?*  
    **A:** ArgoCD marks the rollout as unhealthy; the platform can auto‑rollback based on the `PostStart` health check in the Deployment spec.
16. **Q:** *How does the platform support multi‑tenant isolation at the network level?*  
    **A:** Each namespace gets a **default‑deny NetworkPolicy** that only allows inbound traffic from the Ingress controller, preventing pods from communicating across tenants.
17. **Q:** *Why use Terraform remote state with S3 & DynamoDB?*  
    **A:** It enables state locking to avoid concurrent updates, stores state durably, and works across CI agents without local file sharing.
18. **Q:** *What is the purpose of the `helm repo add jetstack` step in the EC2 bootstrap?*  
    **A:** It adds the official Jetstack Helm repository to install **cert‑manager**, which handles automated TLS certificates.
19. **Q:** *How does the platform expose runtime metrics to the dashboard?*  
    **A:** The API queries Prometheus for per‑app CPU/memory metrics and returns them to the React dashboard, which visualises them with Recharts.
20. **Q:** *Explain the use of `aws_iam_role_policy_attachment` for the OIDC role.*  
    **A:** It attaches managed policies (ECR read‑only, S3 full) so the CI workflow can push images and update Terraform state without granting excess permissions.
21. **Q:** *Why is the EC2 instance given an Elastic IP?*  **A:** A static public IP is required for the Kubernetes API endpoint and for Let’s Encrypt DNS‑01 challenges when using the `ingress‑class`.
22. **Q:** *How does the platform handle secret rotation for JWT keys?*  
    **A:** Secrets are stored in a K8s `Secret` that can be updated via `helm upgrade`; the API watches the secret and reloads keys without downtime.
23. **Q:** *What is the role of `aws_iam_instance_profile` in the compute module?*  
    **A:** It attaches the IAM role to the EC2 instance, granting it permission to interact with SSM, ECR, and other AWS services securely.
24. **Q:** *Why do we use `ssh_public_key` as an optional variable?*  
    **A:** It enables direct SSH access for debugging when needed, but the primary management is via SSM (no open SSH ports required for production).
25. **Q:** *How would you scale DeployForge to handle multiple concurrent builds?*  
    **A:** Increase the Redis instance size, horizontally scale the Worker service via the HPA, and optionally add a second EC2 node to the K3s cluster (joining via `k3s server` join token). The job queue will distribute work automatically.

---

*All documentation files (`README.md`, `docs/architecture.md`, `docs/runbook.md`, `docs/demo.sh`, `docs/INTERVIEW_NOTES.md`) are now up‑to‑date and ready for presentation.*
