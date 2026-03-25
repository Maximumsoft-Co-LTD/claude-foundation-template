---
type: concept
tags: [backend, architecture, layers, separation-of-concerns]
related: [CON-api-design-principles, CON-database-patterns]
updated: 2026-03-25
---

# Backend Layered Architecture

## The 3-Layer Pattern

```
HTTP Request
    ↓
┌─────────────────────────────────────┐
│  Handler / Controller               │  ← HTTP layer
│  - Parse request, validate input    │
│  - Call service                     │
│  - Format response                  │
│  - Handle HTTP-specific errors      │
└────────────────┬────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  Service Layer                      │  ← Business logic
│  - Orchestrate repositories         │
│  - Apply business rules             │
│  - Transaction management           │
│  - Domain events                    │
│  - NO HTTP types (req/res)          │
└────────────────┬────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  Repository / Data Access Layer     │  ← Data layer
│  - CRUD operations on DB            │
│  - SQL queries / ORM calls          │
│  - NO business logic                │
│  - Abstracts DB from service        │
└────────────────┬────────────────────┘
                 ↓
            Database
```

## Layer Rules (Hard)

| Rule | Why |
|------|-----|
| No raw DB queries in handlers | Bypass service = bypass business rules |
| Services don't import HTTP types | Makes service testable without HTTP |
| Repos don't contain business logic | Mixes concerns, hard to test |
| Never `SELECT *` — name columns | Schema changes break silently |

## File Naming Convention

```
TypeScript/Node:
  src/
  ├── routes/     (or controllers/)  ← handlers
  ├── services/                      ← business logic
  └── repositories/ (or models/)    ← data access

Go:
  internal/
  ├── handler/    ← HTTP handlers
  ├── service/    ← business logic
  └── repository/ ← data access

Python:
  app/
  ├── routes/    ← Flask/FastAPI routes
  ├── services/  ← business logic
  └── models/    ← DB models + queries
```

## Dependency Direction

```
Handler → Service → Repository → DB

Handler knows about Service (calls it)
Service knows about Repository (calls it)
Repository knows about DB client

NEVER the reverse (DB shouldn't know about services)
```

## Testing Each Layer

| Layer | Test Type | Dependencies |
|-------|-----------|-------------|
| Handler | Unit | Mock service |
| Service | Unit + Integration | Mock/real repo |
| Repository | Integration | Real test DB |

## When to Add More Layers

- **Domain Layer**: for complex business rules (DDD)
- **Use Case Layer**: for clean architecture (mediator pattern)
- **Event Bus**: for async operations between services

## Related

- [[CON-api-design-principles]] — handler shapes
- [[CON-database-patterns]] — repository internals
- [[CON-error-handling]] — how errors bubble up layers
- [[../../../00-MOC/MOC-Backend]]
