---
type: concept
tags: [devops, cicd, pipeline, automation, deployment]
related: [CON-containerization, CON-deployment-strategies, CON-monitoring-observability]
updated: 2026-03-25
source: template
---

# CI/CD Pipeline

## Continuous Integration (CI)

**Goal:** Every code push is automatically built, linted, and tested

```
Developer pushes to feature branch
    ↓
Trigger: on push / on PR

Stage 1 — Fast checks (< 2 min)
  ├── Checkout code
  ├── Install dependencies (cached)
  ├── Lint + format check
  └── Type check (tsc --noEmit)

Stage 2 — Tests (< 10 min)
  ├── Unit tests
  ├── Integration tests (with Docker services)
  └── Generate coverage report

Stage 3 — Build
  ├── Build artifact (Docker image / binary)
  └── Security scan (Trivy, Snyk, Dependabot)

Stage 4 — Preview (optional)
  └── Deploy to ephemeral preview environment

→ PR can merge only if all stages pass ✅
```

## Continuous Delivery vs Deployment

```
Continuous Delivery:
  → Automated pipeline to staging
  → Manual approval gate before production
  → "Always shippable, not always shipped"

Continuous Deployment:
  → Automated all the way to production
  → No manual gates
  → Requires high test confidence
```

## CD Pipeline (to Production)

```
After merge to main:

Stage 1 — Deploy to Staging
  ├── Run DB migrations
  ├── Deploy application
  ├── Smoke tests (ping health endpoint)
  └── E2E tests against staging

Stage 2 — Production Gate
  ├── Manual approval (Continuous Delivery)
  │   or automatic (Continuous Deployment)
  └── Canary or blue/green deploy

Stage 3 — Post-Deploy
  ├── Monitor error rate for 10-15 min
  ├── Auto-rollback if error rate spikes
  └── Notify team (Slack, PagerDuty)
```

## CI/CD Best Practices

| Practice | Why |
|----------|-----|
| Fail fast — lint first | Cheapest to fix |
| Cache dependencies | Pipeline faster (3x+) |
| Parallel test execution | Cut test time |
| Immutable artifacts | Same image in staging = in prod |
| GitOps: Git is source of truth | Reproducible deployments |
| Keep pipeline < 10 min | Developers won't wait |

## Popular Tools

| Stage | Tools |
|-------|-------|
| CI/CD Platform | GitHub Actions, GitLab CI, Jenkins, CircleCI |
| Container Registry | ECR, GCR, Docker Hub, ghcr.io |
| Secret Management | Vault, AWS Secrets Manager, GitHub Secrets |
| Security Scan | Trivy, Snyk, Dependabot |

## Related

- [[CON-containerization]] — artifacts are Docker images
- [[CON-deployment-strategies]] — how to deploy
- [[CON-monitoring-observability]] — what to watch after deploy
- [[../../../00-MOC/MOC-DevOps]]
