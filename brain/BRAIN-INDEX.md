# 🧠 Claude Brain — Master Index

> **Entry point for Claude Code.**
> When starting any session, read this file first to orient yourself.
> Then dive into the relevant MOC for your task.

---

## What is this?

This is the **project brain** — an Obsidian-style knowledge vault that captures everything the team has learned, decided, and discovered across all sprints. It complements `docs/` (which holds per-sprint output) by storing **durable, reusable knowledge**.

Think of it as: `docs/` = *what we built* · `brain/` = *what we learned*

---

## 🗺️ Maps of Content — Workflow

| MOC | When to open |
|-----|--------------|
| [[00-MOC/MOC-Workflow]] | Sprint lifecycle, commands, `/discovery` through `/retro-sprint` |
| [[00-MOC/MOC-Architecture]] | Project structure, rules, hooks, conventions |
| [[00-MOC/MOC-Patterns]] | Reusable code patterns & implementation approaches |
| [[00-MOC/MOC-Decisions]] | ADR registry — all architectural & team decisions |
| [[00-MOC/MOC-Lessons]] | Retrospective learnings across sprints |
| [[00-MOC/MOC-Glossary]] | Project-specific terms & definitions |

---

## 🗺️ Maps of Content — Engineering Domains

| MOC | Domain |
|-----|--------|
| [[00-MOC/MOC-Developer-Fundamentals]] | SOLID, clean code, design patterns, algorithms, code review |
| [[00-MOC/MOC-SDLC]] | Software lifecycle phases, models, DoD, DoR |
| [[00-MOC/MOC-Agile-Scrum]] | Agile values, Scrum roles, ceremonies, artifacts |
| [[00-MOC/MOC-Architecture-Patterns]] | Clean Arch, DDD, Event-Driven, Microservices patterns |
| [[00-MOC/MOC-Backend]] | API design, layered architecture, DB, auth, security, real-time |
| [[00-MOC/MOC-Data]] | SQL, data modeling, schema design, NoSQL patterns |
| [[00-MOC/MOC-Frontend]] | Components, state, performance, accessibility |
| [[00-MOC/MOC-DevOps]] | CI/CD, containers, deployment strategies, monitoring |
| [[00-MOC/MOC-QA]] | Testing pyramid, bug lifecycle, test types |
| [[00-MOC/MOC-Product-Owner]] | Backlog management, user stories, ACs, sprint planning |
| [[00-MOC/MOC-Product-Manager]] | Vision, strategy, OKRs, roadmap, metrics |
| [[00-MOC/MOC-Infrastructure]] | Cloud, networking, security, scalability, SRE |
| [[00-MOC/MOC-Solution-Engineer]] | Solution design, integration patterns, NFRs, C4 |
| [[00-MOC/MOC-Team]] | Team topologies, Conway's Law, technical writing |
| [[00-MOC/MOC-AI]] | LLM integration, prompt engineering, RAG |

---

## 📦 Concepts Quick Reference

### Workflow & Process
- [[01-concepts/CON-sprint-lifecycle]] — Discovery → Retro full flow
- [[01-concepts/CON-story-points]] — Sizing rules & 13-point limit
- [[01-concepts/CON-vertical-slice]] — E2E testable task definition
- [[01-concepts/CON-tdd-rules]] — Test-first, real deps, no mocks
- [[01-concepts/CON-branch-commit-format]] — Branch & commit naming
- [[01-concepts/CON-task-id-format]] — Global IDs that never reset
- [[01-concepts/CON-document-structure]] — Where docs live & why

### SDLC & Agile
- [[01-concepts/sdlc/CON-sdlc-phases]] — 7 phases of software development
- [[01-concepts/sdlc/CON-sdlc-models]] — Waterfall vs Agile vs V-Model
- [[01-concepts/sdlc/CON-definition-of-done]] — "Done" criteria per phase
- [[01-concepts/sdlc/CON-definition-of-ready]] — Pre-sprint readiness checklist
- [[01-concepts/sdlc/CON-technical-debt]] — Types, quadrant, management strategy
- [[01-concepts/agile/CON-agile-manifesto]] — 4 values, 12 principles
- [[01-concepts/agile/CON-scrum-roles]] — PO / SM / Dev Team
- [[01-concepts/agile/CON-scrum-ceremonies]] — Planning, Daily, Review, Retro, Refinement
- [[01-concepts/agile/CON-scrum-artifacts]] — Product Backlog, Sprint Backlog, Increment
- [[01-concepts/agile/CON-sprint-mechanics]] — Velocity, capacity, burndown
- [[01-concepts/agile/CON-estimation-techniques]] — Planning Poker, T-shirt sizing, PERT
- [[01-concepts/agile/CON-user-story-format]] — INVEST, SPIDR, good vs bad stories

### Developer Fundamentals
- [[01-concepts/developer/CON-solid-principles]] — S.O.L.I.D. with examples
- [[01-concepts/developer/CON-clean-code]] — DRY, KISS, YAGNI, naming, comments
- [[01-concepts/developer/CON-code-review-checklist]] — Full PR review checklist
- [[01-concepts/developer/CON-design-patterns]] — Creational, Structural, Behavioral (GoF)
- [[01-concepts/developer/CON-version-control-git]] — Branching, merging, rebase, workflows
- [[01-concepts/developer/CON-refactoring]] — Code smells, safe refactoring, when/how
- [[01-concepts/developer/CON-algorithms-data-structures]] — Big O, DS cheat sheet, sorting, searching

### Architecture Patterns
- [[01-concepts/architecture/CON-clean-architecture]] — Clean/Hexagonal/Onion, Dependency Rule, folder structure
- [[01-concepts/architecture/CON-domain-driven-design]] — Strategic DDD (BC, Context Map) + Tactical (Aggregate, Entity, VO)
- [[01-concepts/architecture/CON-event-driven-architecture]] — EDA, CQRS, Event Sourcing, Saga, broker comparison
- [[01-concepts/architecture/CON-microservices-patterns]] — API Gateway, Circuit Breaker, Service Mesh, Strangler Fig

### Backend
- [[01-concepts/backend/CON-api-design-principles]] — REST, HTTP codes, pagination, versioning
- [[01-concepts/backend/CON-backend-layers]] — Handler → Service → Repository → DB
- [[01-concepts/backend/CON-authentication-authorization]] — JWT, OAuth2, RBAC
- [[01-concepts/backend/CON-database-patterns]] — Migrations, indexing, N+1, transactions
- [[01-concepts/backend/CON-caching-strategies]] — Cache-aside, write-through, TTL, Redis
- [[01-concepts/backend/CON-async-patterns]] — Message queues, async/await, event-driven
- [[01-concepts/backend/CON-error-handling]] — Error types, HTTP codes, logging patterns
- [[01-concepts/backend/CON-rate-limiting]] — Token Bucket, Sliding Window, Redis, 429 headers
- [[01-concepts/backend/CON-api-security]] — OAuth flows, CORS, CSRF, JWT security, API keys
- [[01-concepts/backend/CON-websockets-realtime]] — WS vs SSE vs Polling, Socket.IO, horizontal scaling

### Data
- [[01-concepts/data/CON-sql-fundamentals]] — JOINs, CTEs, Window functions, indexes, ACID, anti-patterns
- [[01-concepts/data/CON-data-modeling]] — ER diagrams, normalization 1NF→3NF, NoSQL patterns, Star schema

### Frontend
- [[01-concepts/frontend/CON-component-architecture]] — Atomic design, composability
- [[01-concepts/frontend/CON-state-management]] — Server state, form state, global state
- [[01-concepts/frontend/CON-accessibility-a11y]] — WCAG 2.1 AA, ARIA, keyboard nav
- [[01-concepts/frontend/CON-api-integration]] — REST/GraphQL client, SWR, React Query
- [[01-concepts/frontend/CON-performance-frontend]] — Bundle size, lazy loading, Core Web Vitals
- [[01-concepts/frontend/CON-responsive-design]] — Mobile-first, breakpoints, fluid layouts

### DevOps
- [[01-concepts/devops/CON-cicd-pipeline]] — CI stages, CD strategies, best practices
- [[01-concepts/devops/CON-deployment-strategies]] — Blue/Green, Canary, Rolling, Feature flags
- [[01-concepts/devops/CON-monitoring-observability]] — Metrics, logs, traces, alerting, SLI/SLO
- [[01-concepts/devops/CON-containerization]] — Docker, image best practices, multi-stage builds
- [[01-concepts/devops/CON-infrastructure-as-code]] — Terraform, IaC principles, state management
- [[01-concepts/devops/CON-container-orchestration]] — Kubernetes, Helm, HPA, namespaces
- [[01-concepts/devops/CON-gitops]] — Git as source of truth, ArgoCD, Flux, pull model

### QA
- [[01-concepts/qa/CON-testing-pyramid]] — Unit / Integration / E2E ratios and examples
- [[01-concepts/qa/CON-bug-lifecycle]] — Severity, priority, bug report template
- [[01-concepts/qa/CON-test-types]] — Unit, integration, E2E, contract, performance, security
- [[01-concepts/qa/CON-qa-process]] — Test planning, execution, reporting, shift-left

### Product Owner
- [[01-concepts/product-owner/CON-user-story-writing]] — Format, ACs, INVEST, splitting
- [[01-concepts/product-owner/CON-acceptance-criteria]] — Gherkin, SMART, DoD vs AC
- [[01-concepts/product-owner/CON-product-backlog-management]] — DEEP, MoSCoW, WSJF, Kano
- [[01-concepts/product-owner/CON-sprint-planning-po]] — Sprint goal, DoR check, scope negotiation
- [[01-concepts/product-owner/CON-stakeholder-management]] — Power/interest grid, communication, escalation

### Product Manager
- [[01-concepts/product-manager/CON-okr-framework]] — OKR structure, scoring, anti-patterns
- [[01-concepts/product-manager/CON-product-vision-strategy]] — Vision, TAM/SAM/SOM, North Star
- [[01-concepts/product-manager/CON-product-discovery]] — Double Diamond, JTBD, assumption mapping
- [[01-concepts/product-manager/CON-roadmap-types]] — Now/Next/Later, quarterly, outcome-based
- [[01-concepts/product-manager/CON-metrics-product]] — HEART, AARRR, leading/lagging, A/B testing

### Infrastructure
- [[01-concepts/infra/CON-sre-fundamentals]] — SLI, SLO, SLA, error budget, incident mgmt
- [[01-concepts/infra/CON-scalability-patterns]] — Horizontal/vertical, caching, stateless
- [[01-concepts/infra/CON-cloud-fundamentals]] — IaaS/PaaS/SaaS, major clouds, Well-Architected
- [[01-concepts/infra/CON-networking-basics]] — DNS, TCP/IP, load balancers, CDN, firewalls
- [[01-concepts/infra/CON-disaster-recovery]] — RTO/RPO, backup strategies, runbooks
- [[01-concepts/infra/CON-security-fundamentals]] — OWASP Top 10, defense-in-depth, zero-trust

### Solution Engineering
- [[01-concepts/solution-engineer/CON-system-integration-patterns]] — REST, Webhook, Queue, Kafka, ETL
- [[01-concepts/solution-engineer/CON-solution-design-process]] — Discovery → Analysis → Design → Validation
- [[01-concepts/solution-engineer/CON-technical-requirements]] — Functional vs NFR, FURPS+, traceability
- [[01-concepts/solution-engineer/CON-architecture-diagrams]] — C4 Model, UML, Mermaid, diagram-as-code
- [[01-concepts/solution-engineer/CON-rfp-rfi-response]] — RFP/RFI/RFQ, win themes, response structure

### Team & Organization
- [[01-concepts/team/CON-team-topologies]] — Conway's Law, Stream-aligned, Platform, Enabling, Complicated Subsystem
- [[01-concepts/team/CON-technical-writing]] — README, ADR, Runbook, API docs, doc-as-code principles

### AI & LLM Integration
- [[01-concepts/ai/CON-llm-integration]] — Tokens, prompting, RAG, tool use, cost optimization, evaluation

---

## 🔑 Decisions (ADR Registry)

- [[02-decisions/DEC-001-real-deps-integration-tests]] — No mocks at integration layer
- [[02-decisions/DEC-002-posttooluse-lint-hooks]] — Auto-lint on every Write/Edit
- [[02-decisions/DEC-003-vertical-slice-tasks]] — Tasks must be full-stack E2E

---

## ♻️ Patterns

- [[03-patterns/PAT-001-tdd-flow]] — Red → Green → Refactor sequence
- [[03-patterns/PAT-002-parallel-agent-implementation]] — FE + BE agents in parallel
- [[03-patterns/PAT-003-discovery-before-sprint]] — Always discover before planning

---

## 🎓 Lessons Learned

> The notes below are **illustrative examples** seeded with this template so teams can see the expected format and depth. Replace them with your own project lessons after your first sprint retro.

| ID | Lesson | Tags | Sprint |
|----|--------|------|--------|
| [[04-lessons/LES-001-tdd-skipped-on-deadline]] | TDD Skipped Under Deadline Pressure Creates More Rework | tdd, deadline, technical-debt | example |
| [[04-lessons/LES-002-mock-vs-real-db-divergence]] | Mocked Integration Tests Masked a Real Migration Bug | testing, mocks, integration, database | example |
| [[04-lessons/LES-003-discovery-skipped-caused-rework]] | Skipping /discovery on a "Simple" Feature Led to Mid-Sprint Scope Expansion | discovery, scope, planning | example |

---

## 📖 Glossary

- [[06-glossary/GLO-vertical-slice]] — E2E testable feature unit
- [[06-glossary/GLO-moc]] — Map of Content navigation hub
- [[06-glossary/GLO-atomic-note]] — Single-concept knowledge unit
- [[06-glossary/GLO-adr]] — Architectural Decision Record
- [[06-glossary/GLO-acceptance-criteria]] — Conditions for PO acceptance
- [[06-glossary/GLO-discovery]] — Problem exploration phase
- [[06-glossary/GLO-posttooluse]] — Claude Code lifecycle hook
- [[06-glossary/GLO-sprint]] — Fixed-length Scrum iteration
- [[06-glossary/GLO-story-points]] — Relative effort unit
- [[06-glossary/GLO-tdd]] — Test-Driven Development cycle

---

## 📅 Sprint Knowledge

| Sprint | Status | Brain Summary |
|--------|--------|---------------|
| SP1 | planning | [[05-sprints/SP1-brain]] |

---

## 🕸️ Knowledge Graph — Domain Connections

```
                         ┌─────────────┐
                         │  BRAIN-INDEX │
                         └──────┬──────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
   ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
   │  WORKFLOW   │      │  ENGINEERING│      │   PRODUCT   │
   │  (Sprint)   │      │  DOMAINS    │      │  (PM/PO)    │
   └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
          │                    │                     │
    sprint-lifecycle      ┌────┴────┐          vision-strategy
    story-points          │         │          product-discovery
    tdd-rules         Backend   Frontend       okr-framework
    vertical-slice    DevOps    QA             roadmap-types
    branch-format     Infra     SE             metrics-product
```

### Cross-Domain Link Map

| From | Connects To | Via |
|------|-------------|-----|
| [[CON-tdd-rules]] | [[CON-testing-pyramid]], [[PAT-001-tdd-flow]] | TDD → Test types |
| [[CON-sprint-mechanics]] | [[CON-sprint-planning-po]], [[CON-estimation-techniques]] | Sprint execution |
| [[CON-vertical-slice]] | [[CON-backend-layers]], [[CON-component-architecture]] | Full-stack feature |
| [[CON-cicd-pipeline]] | [[CON-containerization]], [[CON-container-orchestration]] | Deploy pipeline |
| [[CON-definition-of-done]] | [[CON-acceptance-criteria]], [[CON-qa-process]] | Quality gate |
| [[CON-product-backlog-management]] | [[CON-user-story-format]], [[CON-sprint-planning-po]] | Backlog → Sprint |
| [[CON-sre-fundamentals]] | [[CON-monitoring-observability]], [[CON-disaster-recovery]] | Reliability ops |
| [[CON-system-integration-patterns]] | [[CON-api-design-principles]], [[CON-async-patterns]] | Integration design |
| [[CON-solution-design-process]] | [[CON-technical-requirements]], [[CON-architecture-diagrams]] | SE workflow |
| [[CON-okr-framework]] | [[CON-metrics-product]], [[CON-product-vision-strategy]] | PM north star |
| [[CON-authentication-authorization]] | [[CON-security-fundamentals]], [[CON-api-security]] | Auth chain |
| [[CON-infrastructure-as-code]] | [[CON-gitops]], [[CON-cloud-fundamentals]] | Infra-as-code |
| [[CON-domain-driven-design]] | [[CON-microservices-patterns]], [[CON-clean-architecture]] | DDD → Architecture |
| [[CON-event-driven-architecture]] | [[CON-async-patterns]], [[CON-microservices-patterns]] | EDA → Messaging |
| [[CON-sql-fundamentals]] | [[CON-data-modeling]], [[CON-database-patterns]] | Data layer |
| [[CON-rate-limiting]] | [[CON-api-security]], [[CON-scalability-patterns]] | API protection |
| [[CON-websockets-realtime]] | [[CON-async-patterns]], [[CON-scalability-patterns]] | Real-time arch |
| [[CON-team-topologies]] | [[CON-domain-driven-design]], [[CON-microservices-patterns]] | Org → Architecture |
| [[CON-llm-integration]] | [[CON-api-design-principles]], [[CON-async-patterns]] | AI feature design |
| [[CON-algorithms-data-structures]] | [[CON-clean-code]], [[CON-database-patterns]] | CS fundamentals |

---

## 🔄 How the Brain Grows

1. **After `/retro-sprint`** → Step 6 of `/retro-sprint` runs automatically to extract lessons & decisions
2. **After any `/discovery`** → brain auto-checked for past lessons (Step 0 in command)
3. **After any architectural debate** → log in `02-decisions/` as a DEC note
4. **Any reusable pattern found** → atomic note in `03-patterns/`
5. **New domain knowledge** → add concept note to `01-concepts/[domain]/`

### Source Tag Legend

Notes in this brain carry a `source` field in their frontmatter to indicate origin:

| Value | Meaning |
|-------|---------|
| `source: template` | Pre-seeded reference knowledge (concepts, patterns, decisions). Generic best-practice content shipped with this template. Safe to keep, extend, or replace with project-specific versions. |
| `source: template-example` | Illustrative examples showing the expected note structure and depth. Seeded so teams have a concrete model to follow. Replace with your own project notes after the first sprint retro. |
| *(absent)* | Organically grown — created during a real sprint by this team. These are the most valuable notes. |

---

*Brain initialized: 2026-03-25 · Framework: Obsidian-style atomic notes + MOC*
*Domains covered: Workflow · SDLC · Agile/Scrum · Developer · Architecture · Backend · Data · Frontend · DevOps · QA · Product Owner · Product Manager · Infrastructure · Solution Engineer · Team · AI*
*Total notes: 17 MOCs · 74 concept notes · 3 decisions · 3 patterns · 10 glossary entries*
