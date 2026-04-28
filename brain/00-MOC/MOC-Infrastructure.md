---
type: MOC
topic: infrastructure
tags: [infra, cloud, networking, security, scalability, SRE]
updated: 2026-03-25
---

# 🗺️ MOC — Infrastructure

> พื้นฐาน infra ที่ทำให้ software ทำงานได้ — cloud, network, security, scalability

---

## Core Concepts

### Foundations
- [[../01-concepts/infra/CON-cloud-fundamentals]] — IaaS/PaaS/SaaS, AWS/GCP/Azure core services
- [[../01-concepts/infra/CON-networking-basics]] — DNS, Load Balancer, VPC, CDN, SSL/TLS
- [[../01-concepts/infra/CON-security-fundamentals]] — Least privilege, defense in depth, secrets management

### Scale & reliability
- [[../01-concepts/infra/CON-scalability-patterns]] — Horizontal vs vertical, stateless, caching, sharding
- [[../01-concepts/infra/CON-sre-fundamentals]] — SLI, SLO, SLA, error budget, incident response
- [[../01-concepts/infra/CON-disaster-recovery]] — RTO, RPO, backup strategies, failover

### Components (deep dives)
- [[../01-concepts/infra/CON-load-balancing]] — L4 vs L7, algorithms, sticky sessions, health checks
- [[../01-concepts/infra/CON-storage-types]] — Block (EBS) vs File (EFS) vs Object (S3); decision tree

## Cloud Service Model

```
IaaS (Infrastructure as a Service)
  → You manage: OS, Runtime, App, Data
  → Provider manages: Virtualization, Servers, Storage, Network
  → Examples: EC2, GCE, Azure VM

PaaS (Platform as a Service)
  → You manage: App, Data
  → Provider manages: Everything else
  → Examples: App Engine, Heroku, Azure App Service

SaaS (Software as a Service)
  → You manage: Nothing (just use it)
  → Examples: Gmail, Salesforce, Slack
```

## Scalability Decision Tree

```
Traffic increasing?
├── Stateless app? → Horizontal scale (add instances)
├── Stateful? → Vertical scale (bigger instance) or refactor
└── DB bottleneck?
    ├── Read-heavy → Read replicas + caching
    ├── Write-heavy → Sharding or CQRS
    └── Both → Consider distributed DB

Cache hit rate < 80%? → Review cache strategy
Response > 500ms? → Profile: DB query? N+1? missing index?
```

## SRE Key Metrics

| Term | Definition |
|------|-----------|
| SLI | Service Level Indicator — measurable metric (e.g. latency p99) |
| SLO | Service Level Objective — target for SLI (e.g. p99 < 200ms) |
| SLA | Service Level Agreement — contractual commitment to users |
| Error Budget | 100% - SLO = allowed downtime/errors per period |
| MTTD | Mean Time to Detect (incident) |
| MTTR | Mean Time to Resolve (incident) |

## Security Fundamentals

- **Least Privilege** — users/services get minimum permissions needed
- **Defense in Depth** — multiple security layers, not relying on one
- **Secrets Management** — never hardcode secrets, use vault/env vars
- **Zero Trust** — never trust, always verify (even internal services)
- **Encryption at Rest + In Transit** — TLS everywhere, encrypted DB

## Related MOCs

- [[MOC-DevOps]] — DevOps runs on infra
- [[MOC-Backend]] — backend deploys to infra
- [[MOC-Architecture]] — infra decisions are architectural
- [[MOC-Solution-Engineer]] — SE designs infra solutions
