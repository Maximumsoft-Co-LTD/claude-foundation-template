---
type: moc
tags: [MOC, architecture]
updated: 2026-05-08
---

# 🗺️ MOC — Architecture Patterns

**When to open this map:** designing new systems, evaluating architectural trade-offs, making tech stack decisions, choosing between monolith/microservices, or deciding on service communication patterns.

**Quick question?** Check the decision tree at the bottom.

---

## Core Architecture Approaches

These notes cover the major architectural philosophies and how they guide organization of code and systems.

### [[01-concepts/architecture/CON-clean-architecture]]
**Tags:** architecture, clean-architecture, onion, SOLID

How to organize code in concentric circles where dependencies point inward. Entities → Use Cases → Adapters → Frameworks. Domain logic stays framework-independent.

**Key insight:** The Dependency Rule prevents outer layers from forcing changes on inner logic.

**When to read:** Starting a backend service, refactoring legacy code, wanting framework independence.

---

### [[01-concepts/architecture/CON-hexagonal-architecture]]
**Tags:** architecture, hexagonal, ports-adapters, onion, testability

Ports & Adapters style — the application core defines ports (interfaces), the outside world plugs in via adapters (implementations). Same Dependency Rule as Clean, different vocabulary, 2-layer mental model. Driving ports (HTTP/CLI/gRPC drive the core) vs driven ports (core drives DB/queue/email).

**Key insight:** In-memory adapters beat mocks — both prod and test honor the same port contract.

**When to read:** Same domain exposed via multiple delivery channels (REST + gRPC + CLI), persistence layer might change, plugin-style systems, or pairing with DDD bounded contexts.

---

### [[01-concepts/architecture/CON-domain-driven-design]]
**Tags:** architecture, DDD, domain, strategic, tactical, bounded-context

How to model complex domains using domain experts' language. Strategic patterns (Ubiquitous Language, Bounded Contexts) organize the system; tactical patterns (Entities, Aggregates, Repositories, Domain Events) structure the code.

**Key insight:** Aggregate boundaries = transaction boundaries = microservice boundaries.

**When to read:** Before modeling complex domain logic, designing microservice boundaries, deciding where to split contexts.

---

### [[01-concepts/architecture/CON-event-driven-architecture]]
**Tags:** architecture, event-driven, EDA, CQRS, event-sourcing, kafka, message-queue

How services communicate asynchronously via immutable events. Includes Event Notification, Event-Carried State Transfer, Event Sourcing, CQRS patterns.

**Key insight:** Events decouple producers from consumers; eventual consistency is the trade-off.

**When to read:** Designing async workflows, needing audit trail, wanting to separate read/write models, building distributed systems.

---

### [[01-concepts/architecture/CON-microservices-patterns]]
**Tags:** architecture, microservices, circuit-breaker, saga, service-mesh, api-gateway

Proven patterns for multi-service systems: API Gateway, Circuit Breaker, Service Mesh, Saga, Strangler Fig, Service Discovery.

**Key insight:** Microservices solve organizational (team independence) and operational (scaling) problems, not technical ones.

**When to read:** Evaluating monolith vs microservices, designing resilience, handling distributed transactions, considering service mesh.

---

## Decision Trees

### Should I Use Microservices?

```
Start: Monolith

Is the codebase complex and hard to change?
  └─ No → Stay monolith
  └─ Yes ↓

Can you identify clear bounded contexts (from DDD)?
  └─ No → Read [[CON-domain-driven-design]], refactor monolith first
  └─ Yes ↓

Do you have multiple teams wanting to deploy independently?
  └─ No → Consider modular monolith instead
  └─ Yes ↓

Can you afford operational complexity (logs, traces, service discovery)?
  └─ No → Slow migration with Strangler Fig
  └─ Yes ↓

Go: Extract services one at a time, use [[CON-event-driven-architecture]] for async
```

### How Should I Organize My Code?

```
Simple CRUD app?
  └─ Layered architecture (Controller → Service → Repository → DB)

Complex domain with business rules?
  └─ Use [[CON-clean-architecture]] + [[CON-domain-driven-design]]

Same domain exposed via many channels (REST + gRPC + CLI + jobs)?
Or persistence layer that may swap (Postgres/Mongo/in-memory)?
  └─ [[CON-hexagonal-architecture]] (ports & adapters)

Multiple services?
  └─ Service boundary = DDD Bounded Context
  └─ Internal service code: [[CON-clean-architecture]] or [[CON-hexagonal-architecture]]
  └─ Inter-service communication: [[CON-event-driven-architecture]]
```

### What Communication Pattern?

```
Real-time response required?
  └─ REST or gRPC (synchronous)

Can handle eventual consistency?
  └─ Events via [[CON-event-driven-architecture]]

Multi-service workflow?
  └─ Saga pattern (choreography or orchestration)

Cascading failures a risk?
  └─ Add [[CON-microservices-patterns]] Circuit Breaker + Service Mesh
```

---

## Navigation by Use Case

### I'm starting a new project

1. Read [[CON-domain-driven-design]] (strategic section) to identify Bounded Contexts
2. For each context, read [[CON-clean-architecture]] to organize code internally
3. Decide inter-context communication: synchronous (RPC) or asynchronous ([[CON-event-driven-architecture]])

### I'm migrating from monolith to microservices

1. Read [[CON-microservices-patterns#Strangler Fig Pattern]]
2. Identify Bounded Contexts using [[CON-domain-driven-design#Strategic DDD]]
3. Extract one context at a time using clean architecture internally
4. Use [[CON-event-driven-architecture]] for async integration

### I'm building a resilient system

1. [[CON-microservices-patterns#Circuit Breaker Pattern]] — prevent cascades
2. [[CON-microservices-patterns#Service Mesh]] — infrastructure-level resilience
3. [[CON-event-driven-architecture#Saga Pattern]] — distributed transactions with compensation

### I need to redesign existing code

1. [[CON-clean-architecture]] — check if domain logic is framework-coupled
2. [[CON-domain-driven-design]] — check if domain model aligns with business
3. [[CON-event-driven-architecture]] — if you need audit trail or async workflows

### I'm designing service boundaries

1. [[CON-domain-driven-design#Bounded Context]] — context = service boundary
2. [[CON-domain-driven-design#Strategic DDD]] — context map tells you communication patterns
3. [[CON-event-driven-architecture]] — for async between contexts

---

## Pattern Comparison Matrix

| Pattern | Monolith | Modular Monolith | Microservices |
|---------|----------|------------------|---|
| **Deployment** | Single binary | Single binary | Independent services |
| **Scaling** | Vertical (same resources for all) | Vertical | Horizontal (per service) |
| **Team Coupling** | All in same repo | Modules, single repo | Service ownership, separate repos |
| **Operational Complexity** | Low | Low-medium | High |
| **Distributed Tracing** | N/A | N/A | Essential |
| **When It Works** | Simple domains, small teams | Medium complexity, multiple teams | Complex domains, need independent scaling |
| **Big Risk** | Becomes distributed monolith | Same as monolith if not careful | Over-engineering, premature decomposition |

---

## Glossary Quick Reference

| Term | Link | Definition |
|------|------|---|
| **Aggregate** | [[CON-domain-driven-design#Aggregate]] | Cluster of entities as consistency boundary |
| **Bounded Context** | [[CON-domain-driven-design#Bounded Context]] | Boundary where domain model applies |
| **CQRS** | [[CON-event-driven-architecture#CQRS]] | Separate read and write models |
| **Circuit Breaker** | [[CON-microservices-patterns#Circuit Breaker Pattern]] | Prevent cascading failures |
| **Domain Event** | [[CON-domain-driven-design#Domain Event]] | Something significant that happened |
| **Event Sourcing** | [[CON-event-driven-architecture#Event Sourcing]] | Store all events, rebuild state from them |
| **Repository** | [[CON-domain-driven-design#Repository]] | Abstraction over persistence |
| **Saga** | [[CON-event-driven-architecture#Saga Pattern]] | Distributed transaction with compensation |
| **Service Mesh** | [[CON-microservices-patterns#Service Mesh]] | Sidecar proxies for service communication |
| **Strangler Fig** | [[CON-microservices-patterns#Strangler Fig Pattern]] | Gradual monolith-to-microservices migration |
| **Ubiquitous Language** | [[CON-domain-driven-design#Ubiquitous Language]] | Shared domain vocabulary |
| **Value Object** | [[CON-domain-driven-design#Value Object]] | Immutable object with no identity |

---

## Related MOCs

- **MOC-Backend** — backend patterns, API design, database design
- **MOC-Frontend** — UI architecture, component patterns
- **MOC-Decisions** — architectural decisions and trade-offs
- **MOC-Patterns** — general design patterns (not architecture-specific)

---

## Common Questions

**Q: Should I use Event Sourcing?**
A: Only if you need complete audit trail or temporal queries. For most applications, event notification ([[CON-event-driven-architecture#Event Notification]]) is simpler.

**Q: Is my system a "distributed monolith"?**
A: If services must deploy together, share a database, or have tight API coupling, yes. Read [[CON-domain-driven-design#Bounded Context]] to identify real boundaries.

**Q: Monolith or microservices for my startup?**
A: Monolith until you can identify clear Bounded Contexts and have multiple teams. Premature microservices add operational cost with unclear benefit.

**Q: How do I know if my architecture is good?**
A: Your architecture is good if:
- Change requests map to changes in one service/module
- Teams can deploy independently
- No "distributed transaction hell" (if you need saga, consider re-drawing boundaries)
- Observability is built-in (can trace requests across services)
- You can explain why you chose it (not "everyone uses microservices")

