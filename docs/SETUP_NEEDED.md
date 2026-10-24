# DeployForge: External Configuration & Setup Checklist

DeployForge is designed to run locally right out of the box using mock authentication and local containers. When graduating to cloud production (AWS EC2 / K3s or EKS), provide the values listed below.

---

## 1. Local Development (Ready Out-of-the-Box)
For local testing, no cloud credentials or GitHub OAuth apps are required:
- **Authentication**: Local Dev Mode provides an instant 1-click test user login (`dev-user`).
- **Domain**: Uses `localtest.me` (resolves wildcard subdomains `*.localtest.me` to `127.0.0.1` by standard DNS RFC).
- **Registry**: Built-in Docker registry running at `localhost:5001`.
- **Database & Cache**: Spun up automatically via Docker Compose (`postgres:16-alpine`, `redis:7-alpine`).

---

## 2. GitHub OAuth App (For Live GitHub Login & Webhooks)
To enable real GitHub user login and automated repository webhooks:

1. Navigate to: **GitHub Settings** -> **Developer Settings** -> **OAuth Apps** -> **New OAuth App**.
2. Fill in:
   - **Application name**: `DeployForge`
   - **Homepage URL**: `https://deployforge.<YOUR_DOMAIN>` (or `http://localhost:3000`)
   - **Authorization callback URL**: `https://api.<YOUR_DOMAIN>/api/auth/github/callback` (or `http://localhost:4000/api/auth/github/callback`)
3. Copy **Client ID** and generate a **Client Secret**.
4. Set in your `.env` or K8s Secrets:
   ```env
   GITHUB_CLIENT_ID=gh_client_id_here
   GITHUB_CLIENT_SECRET=gh_client_secret_here
   GITHUB_WEBHOOK_SECRET=generate_a_random_32char_string_here
   ```

---

## 3. Custom Domain & DNS
To route traffic dynamically to deployed user applications (`https://<app-name>.<YOUR_DOMAIN>`):

1. **Base Domain**: Set `BASE_DOMAIN=yourdomain.com`
2. **Wildcard DNS Record**: Create a wildcard DNS A-record pointing to your Traefik/Ingress load balancer IP or Elastic IP:
   - Name: `*.<YOUR_DOMAIN>` -> Value: `<PUBLIC_IP_OR_ALB_DNS>`
   - Name: `api.<YOUR_DOMAIN>` -> Value: `<PUBLIC_IP_OR_ALB_DNS>`
   - Name: `deployforge.<YOUR_DOMAIN>` -> Value: `<PUBLIC_IP_OR_ALB_DNS>`

---

## 4. Container Registry (Production)
For production builds pushed to GitHub Container Registry (GHCR) or AWS ECR:
- **GHCR**:
  ```env
  REGISTRY_URL=ghcr.io/<your-github-username>
  REGISTRY_USERNAME=<your-github-username>
  REGISTRY_PASSWORD=<github-personal-access-token-with-package-write-perms>
  ```
- **AWS ECR**:
  ```env
  REGISTRY_URL=<account_id>.dkr.ecr.<region>.amazonaws.com/deployforge
  ```

---

## 5. AWS Cloud Deployment (Terraform)
When applying `infra/terraform`:
- **AWS Credentials**: Configured via AWS CLI (`aws configure`) or GitHub Actions OIDC role ARN.
- **Variables**: Configure `infra/terraform/terraform.tfvars`:
  - `aws_region`: e.g. `us-east-1`
  - `domain_name`: e.g. `yourdomain.com`
  - `instance_type`: `t3.medium` (recommended minimum for K3s single node)
  - `ssh_public_key`: Path to your SSH public key for EC2 emergency access.
  - `letsencrypt_email`: Email for Let's Encrypt TLS certificate notifications.
