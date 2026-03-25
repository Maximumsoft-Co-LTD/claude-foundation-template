---
type: MOC
topic: solution-engineer
tags: [solution-engineer, SE, solution-design, integration, presales, technical-consulting]
updated: 2026-03-25
---

# 🗺️ MOC — Solution Engineer (SE)

> SE bridge ช่องว่างระหว่าง business problem กับ technical solution — ออกแบบ, พิสูจน์, และ handoff ให้ทีม implement

---

## Core Concepts

- [[../01-concepts/solution-engineer/CON-solution-design-process]] — Discovery → Analysis → Design → Validate → Handoff
- [[../01-concepts/solution-engineer/CON-technical-requirements]] — Functional vs Non-functional requirements
- [[../01-concepts/solution-engineer/CON-system-integration-patterns]] — API, Webhook, Message Queue, ETL, ESB
- [[../01-concepts/solution-engineer/CON-architecture-diagrams]] — C4 Model, sequence, component, deployment diagrams
- [[../01-concepts/solution-engineer/CON-rfp-rfi-response]] — Technical sections of proposals

## Solution Design Process

```
1. Discovery
   → Understand business problem, current state, pain points
   → Stakeholder interviews, process mapping

2. Requirements Analysis
   → Functional requirements (what it must do)
   → Non-functional requirements (how well it must do it)
   → Constraints (tech stack, budget, timeline, compliance)

3. Solution Design
   → Options analysis (at least 2 approaches)
   → Architecture decision with trade-offs
   → Integration design
   → Data flow & security model

4. Validation
   → PoC / Prototype
   → Technical review with team
   → Cost estimation

5. Handoff
   → Architecture doc
   → API specs / data contracts
   → Runbook / implementation guide
```

## Non-Functional Requirements (NFR) Categories

| Category | Example Metrics |
|----------|----------------|
| Performance | Response p99 < 200ms, throughput > 1000 req/s |
| Scalability | Handle 10x traffic with < 2x cost |
| Availability | 99.9% uptime = < 8.7h downtime/year |
| Security | SOC2, ISO27001, GDPR compliance |
| Maintainability | MTTR < 1h, deploy frequency > 1/day |
| Data | Retention 7 years, RPO < 1h, RTO < 4h |

## Integration Pattern Selection

| Pattern | When to Use |
|---------|------------|
| REST API | Synchronous request-response |
| Webhook | Event notification (server to server) |
| Message Queue | Async, decoupled, reliable delivery |
| GraphQL | Flexible querying, multiple consumers |
| gRPC | High-performance, internal services |
| ETL/ELT | Batch data migration or sync |
| ESB | Legacy enterprise integration |

## C4 Model (Architecture Diagrams)

```
Level 1 — System Context: Your system + users + external systems
Level 2 — Container:      Web app, API, DB, queue (deployable units)
Level 3 — Component:      Controllers, services, repos inside a container
Level 4 — Code:           Classes, functions (rarely needed)
```

## Related MOCs

- [[MOC-Architecture]] — SE outputs feed architecture decisions
- [[MOC-Infrastructure]] — SE designs infra topology
- [[MOC-Backend]] — SE defines API contracts
- [[MOC-Product-Manager]] — PM + SE collaborate on feasibility
