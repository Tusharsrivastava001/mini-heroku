# DeployForge 🚀

**Production‑grade self‑service developer platform (Mini‑Heroku / Vercel)** built as a high-performance monorepo on Kubernetes.

DeployForge allows developers to push code to GitHub and automatically build, containerize, deploy, auto-scale, and observe their applications in isolated Kubernetes namespaces with automated TLS, Traefik ingress, real-time log streaming, and zero-downtime rollbacks.

---

## 🌟 Web Console & Dashboard Features

The web frontend (`apps/dashboard`) is a modern React 18 + Vite + Tailwind CSS console:

### 1. 🔐 Frictionless Developer Authentication
- **1-Click Instant Dev Login**: Start developing and testing locally without configuring third-party GitHub OAuth keys.
- **GitHub OAuth 2.0 Integration**: Production-ready GitHub OAuth authentication flow.
- **JWT Session Management**: Secure Bearer token storage with automatic session renewal and unauthorized interceptor redirects.

### 2. 📊 Platform Overview & Metrics
- **Live Workload Tracking**: Real-time polling (every 4s) of live deployment statuses (`QUEUED`, `BUILDING`, `DEPLOYING`, `LIVE`, `FAILED`, `ROLLED_BACK`).
- **Cluster Infrastructure Indicators**:
  - Total registered applications and active live workloads.
  - Ingress gateway health (Traefik + automatic TLS certificate provisioning).
  - Multi-tenancy status (per-project Kubernetes `NetworkPolicy` isolation).

### 3. 🚀 New Deployment Wizard (`CreateProjectModal`)
- One-click modal to register and provision a new application workload:
  - Git repository URL & target branch selection.
  - Custom internal port binding (defaults to `3000`).
  - Optional custom build and start commands.
  - Horizontal Pod Autoscaler (HPA) limits: min replicas, max replicas, target CPU utilization percentage.
  - Initial environment variable injection.

### 4. 🎛️ Interactive Application Management Console (`ProjectDetailPage`)
Divided into 4 specialized management tabs:

#### A. 📜 Deployments & Live Log Streaming
- **Deployment Lineage**: Interactive chronological list showing commit hashes, trigger sources, branch names, and status badges.
- **Live SSE Log Terminal (`LogTerminal`)**: High-performance streaming terminal that captures stdout/stderr build and container startup logs in real time with ANSI color formatting.
- **1-Click Rollback (`useRollback`)**: Revert an unhealthy or broken production deployment to any previous stable container image with zero-downtime traffic switching.

#### B. 📈 Telemetry & Resource Charts (`MetricsChart`)
- Interactive charts powered by Recharts visualizing runtime telemetry:
  - **CPU Utilization (%)**: Real-time CPU consumption plotted against the configured HPA autoscale threshold line.
  - **Memory Usage (MB)**: Active memory footprint across active application replicas.
  - **HTTP Request Volume & Latency**: Scraped from Prometheus metrics.

#### C. 🔑 Encrypted Secrets & Environment Variables (`EnvVarsManager`)
- Key-value configuration interface backed by **AES-256-GCM** encryption.
- Safe masking and toggling of sensitive API tokens, database connection strings, and application credentials.
- Automatic Kubernetes `Secret` generation and deployment injection.

#### D. ⚙️ Application Settings & Danger Zone
- Update active listening port, target Git branch, and autoscaling thresholds (`replicasMin`, `replicasMax`, `targetCpuPercent`).
- **One-Click Project Teardown**: Deletes the workload and cleans up all associated Kubernetes namespaces, Services, Ingresses, HPAs, and Secrets.

---

## 🏗️ Architecture & Monorepo Structure

```text
DeployForge/
├── apps/
│   ├── api/          # Control Plane REST API (Express, Prisma, TypeScript, JWT, Prometheus)
│   ├── worker/       # Build & Deploy Engine (BullMQ, Redis, Kaniko, K8s Client)
│   └── dashboard/    # Web Console UI (React 18, Vite, Tailwind CSS, TanStack Query, Recharts)
├── infra/
│   ├── helm/         # Production Helm charts for DeployForge control plane
│   ├── k8s/          # Baseline Kubernetes manifests (RBAC, Ingress, NetworkPolicy)
│   └── terraform/    # AWS Infrastructure (VPC, EC2 K3s host, GitHub OIDC role)
├── scripts/
│   ├── smoke-test.mjs           # Automated end-to-end smoke test suite
│   └── create-local-cluster.sh  # Local K3d / Kind cluster provisioning script
└── docs/
    ├── architecture.md          # System architecture and data flow diagrams
    ├── runbook.md               # SRE runbook & operational checklist
    └── INTERVIEW_NOTES.md       # Design choices, tradeoffs, and system design notes
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (Node 20 or 22 recommended)
- `pnpm` (or `npm`)
- Optional: PostgreSQL & Redis (the API includes resilient local fallback for instant zero-dependency testing)

### 1. Install Dependencies & Build Monorepo
```bash
# Install workspace packages
pnpm install

# Build all packages (API, Worker, Dashboard)
pnpm -r run build
```

### 2. Start the Applications
Open three terminal windows:

#### Terminal 1: API Server (Port 4000)
```bash
pnpm --filter @deployforge/api run dev
```

#### Terminal 2: Background Build Worker
```bash
pnpm --filter @deployforge/worker run dev
```

#### Terminal 3: Web Dashboard (Port 3000)
```bash
pnpm --filter @deployforge/dashboard run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser and click **Instant Dev Login** to explore the console.

---

## 📡 API Endpoints Reference

### Authentication & User
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/dev-login` | 1-Click Instant developer login for local development |
| `GET` | `/api/auth/github` | GitHub OAuth 2.0 redirection |
| `GET` | `/api/auth/github/callback` | OAuth callback & JWT token generation |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `POST` | `/api/auth/logout` | Clear session cookie and invalidate token |

### Projects & Workloads
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects` | List all projects belonging to the current user |
| `POST` | `/api/projects` | Provision a new project and initialize Git settings |
| `GET` | `/api/projects/:id` | Fetch project details, configuration, and latest status |
| `PATCH` | `/api/projects/:id` | Update project configuration (port, branch, HPA limits) |
| `DELETE` | `/api/projects/:id` | Tear down project and clean up Kubernetes namespace |
| `GET` | `/api/projects/:id/metrics` | Retrieve real-time CPU, memory, and latency metrics |
| `PUT` | `/api/projects/:id/env` | Upsert AES-256-GCM encrypted environment variables |

### Deployments & Builds
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects/:id/deployments` | List deployment history for a project |
| `POST` | `/api/projects/:id/deploy` | Trigger a new build and deployment |
| `POST` | `/api/projects/:id/deployments/:depId/rollback` | Perform zero-downtime rollback to a past deployment |
| `GET` | `/api/deployments/:id/logs` | Stream live build logs via Server-Sent Events (SSE) |

### Health & Observability
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Platform and database readiness health check |
| `GET` | `/api/metrics` | Prometheus metrics scrape endpoint (`deployforge_*`) |

---

## 🛡️ Security & Multi-Tenancy

- **Namespace Isolation**: Each user workload runs in a dedicated Kubernetes namespace with scoped service accounts.
- **Default-Deny Network Policies**: Cross-namespace pod communication is blocked by default; only ingress traffic via Traefik and DNS egress are permitted.
- **Non-Root Containers**: Enforces `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, and drops `ALL` Linux capabilities.
- **Zero Static AWS Secrets**: Terraform provisions a **GitHub OIDC IAM role**, allowing GitHub Actions CI/CD to authenticate without static credentials.
- **Encrypted Secrets**: All user environment variables are encrypted at rest with **AES-256-GCM**.

---

## 🧪 Testing & Verification

Run the full automated test suite across all packages:
```bash
# Typecheck all packages
pnpm -r run typecheck

# Lint all packages
pnpm -r run lint

# Run unit tests
pnpm test

# Run end-to-end smoke test suite against live API
node scripts/smoke-test.mjs
```

---

## 📜 License

Licensed under the [Apache-2.0 License](LICENSE).
