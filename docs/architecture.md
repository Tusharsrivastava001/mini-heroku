# DeployForge Architecture

```mermaid
graph TD
    %% Users & GitHub
    U[Developer / Browser] -->|HTTPS| D[Dashboard (React + Vite)]
    U -->|API Calls / SSE| A[API (Express + TS)]
    G[GitHub] -->|Webhooks| A
    
    %% Core platform services
    subgraph ControlPlane[Control Plane]
        A -->|Read/Write| DB[(PostgreSQL via Prisma)]
        A -->|Publish jobs| R[Redis (BullMQ)]
        W[Worker (Node.js)] -->|Consume jobs| R
    end

    %% Build pipeline
    subgraph BuildPipeline[Build Pipeline]
        W -->|1. Git clone| Repo[Remote Git Repo]
        W -->|2. Container build| Builder[Kaniko / BuildKit]
        Builder -->|3. Push image| Reg[(Container Registry: GHCR or Local)]
    end

    %% Kubernetes data plane
    subgraph K8s[Kubernetes Cluster]
        W -->|4. Deploy manifests| K8sAPI[K8s API Server]
        K8sAPI --> NS[Namespace per User]
        NS --> Dep[Deployment]
        NS --> Svc[Service (ClusterIP)]
        NS --> Ingress[Ingress (Traefik / NGINX) + TLS]
        NS --> HPA[HPA (autoscaling)]
        NS --> Sec[NetworkPolicy (default‑deny)]
        NS --> Quota[ResourceQuota]
        NS --> Limits[LimitRange]
        NS --> Secret[Secret (env vars)]
        NS --> Metrics[Prometheus + Grafana]
        NS --> Logs[Loki + Promtail]
    end

    Ingress -->|Route| Dep
    D -->|Calls API for logs/metrics| A
    A -->|Streams logs via SSE| D
    
    %% GitOps & CI/CD
    subgraph GitOps[GitOps / CI/CD]
        CI[GitHub Actions] -->|Build & push images| Reg
        CI -->|Trigger| Argo[ArgoCD]
        Argo -->|Sync Helm chart| K8sAPI
    end

    style ControlPlane fill:#f9f,stroke:#333,stroke-width:2px
    style BuildPipeline fill:#bbf,stroke:#333,stroke-width:2px
    style K8s fill:#bfb,stroke:#333,stroke-width:2px
    style GitOps fill:#ffb,stroke:#333,stroke-width:2px
```

The diagram captures the end‑to‑end flow:
1. A developer authenticates via GitHub OAuth.
2. Projects are created via the API.
3. The worker builds a container, pushes it, and the Kubernetes deployer provisions isolated resources.
4. Observability (Prometheus/Loki) is baked in, and ArgoCD continuously reconciles the Helm chart.
5. GitHub OIDC enables the CI pipeline to deploy without static AWS keys.
