---
type: MOC
topic: devops
tags: [devops, cicd, docker, kubernetes, deployment, monitoring]
updated: 2026-03-25
---

# 🗺️ MOC — DevOps

> Culture + practices + tools ที่ bridge ช่องว่างระหว่าง Dev และ Ops เพื่อ deliver อย่างรวดเร็วและมั่นคง

---

## Core Concepts

- [[../01-concepts/devops/CON-cicd-pipeline]] — CI/CD stages, gates, rollback strategies
- [[../01-concepts/devops/CON-containerization]] — Docker, images, containers, Dockerfile best practices
- [[../01-concepts/devops/CON-container-orchestration]] — Kubernetes fundamentals, pods, services, deployments
- [[../01-concepts/devops/CON-infrastructure-as-code]] — Terraform, Pulumi, CloudFormation
- [[../01-concepts/devops/CON-gitops]] — Git as single source of truth for infra state
- [[../01-concepts/devops/CON-monitoring-observability]] — Metrics, logs, traces (the 3 pillars)
- [[../01-concepts/devops/CON-deployment-strategies]] — Blue/Green, Canary, Rolling, Feature flags

## CI/CD Pipeline Stages

```
Code Push
    ↓
Build & Lint          ← fail fast on syntax/type errors
    ↓
Unit Tests            ← fast feedback
    ↓
Integration Tests     ← real dependencies (Docker Compose)
    ↓
Security Scan         ← SAST, dependency audit
    ↓
Build Artifact        ← Docker image, binary
    ↓
Deploy to Staging     ← auto
    ↓
E2E Tests             ← against staging
    ↓
Deploy to Production  ← manual gate or auto with canary
```

## Deployment Strategy Comparison

| Strategy | Risk | Speed | Rollback |
|----------|------|-------|---------|
| Recreate | High (downtime) | Fast | Redeploy |
| Rolling | Medium | Medium | Version rollback |
| Blue/Green | Low | Fast | Switch traffic |
| Canary | Lowest | Slow | Kill canary traffic |
| Feature Flag | Lowest | Instant | Toggle off |

## The 3 Pillars of Observability

| Pillar | Tool Examples | What It Tells You |
|--------|-------------|------------------|
| **Metrics** | Prometheus, Datadog | System health over time |
| **Logs** | Loki, ELK Stack | What happened exactly |
| **Traces** | Jaeger, Tempo | Where time was spent |

## Related MOCs

- [[MOC-Infrastructure]] — cloud + networking that CI/CD runs on
- [[MOC-Backend]] — what gets deployed
- [[MOC-QA]] — tests that run in pipeline
- [[MOC-Architecture]] — deployment topology decisions
