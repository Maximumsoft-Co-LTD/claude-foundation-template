---
type: concept
tags: [devops, gitops, kubernetes, argocd, flux, infrastructure-as-code]
related: [CON-cicd-pipeline, CON-container-orchestration, CON-infrastructure-as-code, CON-deployment-strategies]
updated: 2026-03-25
---

# GitOps

## Core Principle

**Git is the single source of truth for infrastructure and application deployment.**

Instead of manually running `kubectl apply` or pushing images through a pipeline, you:
1. Commit desired state to Git
2. A GitOps controller continuously reconciles the cluster to match Git
3. All changes are auditable, reversible, and version-controlled

## Traditional CI/CD vs. GitOps

### Traditional CI/CD (Push Model)
```
Developer → Git → CI Pipeline → Builds image → Pushes to Registry →
Pipeline triggers kubectl apply → Cluster updates
```

**Problems:**
- Pipeline must have cluster credentials (security risk)
- Cluster state can drift from what's in Git
- Multi-cluster deployments require multiple pipeline runs
- Rollbacks require manual intervention or rerunning old builds

### GitOps (Pull Model)
```
Developer → Git (commits desired state) →
GitOps controller (ArgoCD/Flux) polls Git →
Controller applies manifests → Cluster updates automatically
```

**Benefits:**
- Cluster pulls state from Git (no credentials in pipeline)
- Git history = full audit trail and easy rollbacks
- Declarative: "This is what should be running"
- Multi-cluster: Single Git repo, multiple controllers sync independently

## GitOps Principles

1. **Declarative Infrastructure:** All infrastructure and app config in Git as YAML/Kustomize/Helm
2. **Git as Source of Truth:** Cluster state should always match Git
3. **Automated Reconciliation:** Controller continuously watches Git and cluster, fixing drift
4. **Immutable Artifacts:** Built images are immutable; versioned by Git tag or commit hash
5. **Observability:** Easy to see what's deployed, when, and why (full Git history)

## Push vs. Pull Model

### Push Model (Traditional CD)
- Pipeline initiates deployment
- Pipeline has access to production credentials
- If cluster is unreachable, pipeline fails
- Example: Jenkins → Docker build → Push image → kubectl apply

### Pull Model (GitOps)
- Cluster/controller initiates the pull
- Controller has limited, scoped credentials
- Works even if external services are temporarily unavailable
- Example: Developer pushes YAML → ArgoCD/Flux reads Git → Applies to cluster

**GitOps always uses the pull model.**

## ArgoCD (Popular GitOps Tool)

### What ArgoCD Does
ArgoCD is a Kubernetes controller that:
- Watches a Git repository
- Continuously compares desired state (Git) with actual state (cluster)
- Automatically syncs or alerts on drift

### Basic ArgoCD Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/my-app-config
    targetRevision: HEAD
    path: manifests/  # Kubernetes manifests in this path
  destination:
    server: https://kubernetes.default.svc  # This cluster
    namespace: production
  syncPolicy:
    automated:
      prune: true      # Delete resources not in Git
      selfHeal: true   # Auto-sync if cluster drifts
```

**Workflow:**
1. Developer commits Kubernetes manifests to Git
2. ArgoCD detects the change
3. ArgoCD compares Git state with cluster state
4. ArgoCD syncs; cluster state now matches Git

### Manual Sync Example
```bash
argocd app sync my-app           # Sync this app to Git state
argocd app sync my-app --prune   # Sync + delete resources not in Git
argocd app history my-app        # See all syncs (full audit trail)
argocd app rollback my-app 2     # Rollback to 2 commits ago
```

## Flux (Alternative GitOps Tool)

Flux is a lightweight, Kubernetes-native GitOps controller:

```yaml
apiVersion: source.toolkit.fluxcd.io/v1
kind: GitRepository
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 1m
  url: https://github.com/myorg/my-app-config
  ref:
    branch: main

---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: my-app
  namespace: flux-system
spec:
  interval: 10m
  prune: true
  sourceRef:
    kind: GitRepository
    name: my-app
  path: ./kustomize/
```

**Flux advantages:** Minimal dependencies, tight Kubernetes integration, multi-tenancy support.

## GitOps Workflow

### 1. Infrastructure as Code
All resources (Deployments, Services, ConfigMaps, Secrets) live in Git:

```
my-app-config/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── replicas.yaml
│   └── production/
│       ├── kustomization.yaml
│       └── replicas.yaml
└── argocd/
    ├── staging-app.yaml
    └── production-app.yaml
```

### 2. Developer Workflow
```bash
# Developer makes a change
git checkout -b feature/new-feature
# Edit base/deployment.yaml (e.g., update environment vars)
git commit -m "Update API_KEY for new service"
git push origin feature/new-feature

# Create PR; team reviews
# Once merged to main:
# → ArgoCD/Flux detects commit
# → Automatically syncs staging environment
# → After manual approval in ArgoCD UI, promote to production
```

### 3. Rollback via Git
```bash
# Something broke in production
# Simple rollback: revert the commit
git revert abc123def456

# Push the revert
git push origin main

# ArgoCD/Flux detects the revert
# Cluster automatically rolls back to previous state
```

## Environments-as-Branches Pattern

Use Git branches to represent environments:

```
Branches:
├── main (production)
├── staging
└── dev

Each branch has an ArgoCD Application pointing to it:
- ArgoCD Application "prod" → watches main branch
- ArgoCD Application "staging" → watches staging branch
- ArgoCD Application "dev" → watches dev branch

Deployment flow:
dev commit → Dev cluster updates immediately
  ↓ (manual promotion)
staging branch → Staging cluster updates
  ↓ (manual promotion or auto-promoted after tests)
main branch → Production cluster updates
```

## Image Updates with GitOps

Two approaches:

### Manual: Developer Commits Image Tag Change
```yaml
# manifest.yaml
image: myapp:v1.2.3  # Developer updates this tag
```
→ Commit to Git → ArgoCD syncs → New version deployed

### Automated: Image Update Operator
Use tools like **Flux Image Reflector** or **ArgoCD Image Updater** to automatically commit image tag updates:

```yaml
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: my-app
spec:
  imageRepositoryRef:
    name: my-app
  policy:
    semver:
      range: ^v1.0  # Only use v1.x tags
```

When a new image is built and pushed:
1. Image update controller detects new tag
2. Controller commits updated manifest to Git
3. Flux detects the commit
4. Cluster syncs to new version

## Benefits and Trade-offs

### Benefits ✅
- **Audit trail:** Every change in Git history
- **Rollback:** `git revert` to go back
- **Multi-cluster:** Same Git repo, multiple controllers
- **Security:** No pipeline credentials in cluster
- **Declarative:** Easier to reason about desired state
- **Self-healing:** Cluster auto-corrects drift

### Challenges ⚠️
- **Learning curve:** Requires Git + Kubernetes expertise
- **Git state must stay accurate:** If secrets are leaked, entire history is compromised
- **Delayed feedback:** Changes sync every 1-5 minutes (not immediate)
- **Complexity:** Adds another layer (GitOps controller) to manage

## GitOps vs. Traditional CI/CD

| Aspect | Traditional CD | GitOps |
|--------|----------------|--------|
| Deployment trigger | Manually run pipeline or webhook | Git commit (automatic reconciliation) |
| Credentials | Pipeline has cluster access | Controller has cluster access |
| Single source of truth | Code repo + running cluster | Git repo only |
| Rollback | Rerun old pipeline or manual restore | `git revert` |
| Multi-cluster | Requires separate pipelines | Single Git repo, multiple controllers |
| Audit trail | Pipeline logs (may be lost) | Git history (permanent) |

**When to use GitOps:** Kubernetes-native deployments, multi-cluster setups, strong compliance requirements.

**When traditional CD is fine:** Simple apps, non-Kubernetes deployments, rapid experimentation.

## Secrets Management in GitOps

Never commit plaintext secrets to Git. Solutions:

1. **Sealed Secrets** — Encrypt secrets; store encrypted in Git; controller decrypts in cluster
2. **External Secrets Operator** — Store secrets in vault; controller fetches at sync time
3. **Kustomize + separate secret file** — Keep secret files in `.gitignore`; load via Kustomize patches

Example with Sealed Secrets:

```bash
# Encrypt a secret
echo -n "password123" | kubeseal -o yaml > sealed-secret.yaml

# Commit encrypted secret to Git
git add sealed-secret.yaml
git commit -m "Add sealed db password"

# ArgoCD syncs; cluster controller decrypts sealed secret
```

## See Also

- [[CON-container-orchestration]] — Kubernetes core concepts
- [[CON-cicd-pipeline]] — Traditional CI/CD workflows
- [[CON-infrastructure-as-code]] — IaC principles and tools
- [[CON-deployment-strategies]] — Blue-green, canary, rolling updates
