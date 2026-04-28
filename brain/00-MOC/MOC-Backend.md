---
type: MOC
topic: backend
tags: [backend, api, database, server, architecture]
updated: 2026-03-25
---

# 🗺️ MOC — Backend Development

> ทุกอย่างที่ทำงานบน server — API, business logic, data, security, performance

---

## Core Concepts

### API & Layering
- [[../01-concepts/backend/CON-api-design-principles]] — REST overview, HTTP codes, pagination, versioning
- [[../01-concepts/backend/CON-graphql]] — Schema, queries, mutations, N+1 problem, federation
- [[../01-concepts/backend/CON-grpc]] — Protobuf, streaming, service definitions, when to use vs REST
- [[../01-concepts/backend/CON-backend-layers]] — Handler → Service → Repository → DB
- [[../01-concepts/backend/CON-error-handling]] — Error types, HTTP codes, structured errors

### Data & Persistence
- [[../01-concepts/backend/CON-database-patterns]] — CRUD, transactions, migrations, indexing
- [[../01-concepts/backend/CON-caching-strategies]] — Cache-aside, write-through, TTL, Redis

### Async & Real-time
- [[../01-concepts/backend/CON-async-patterns]] — Queue, pub/sub, event-driven, webhook (pattern level)
- [[../01-concepts/backend/CON-message-brokers]] — Kafka vs RabbitMQ vs SQS vs NATS (technology comparison)
- [[../01-concepts/backend/CON-websockets-realtime]] — WebSockets, SSE, polling, horizontal scaling

### Security & Limits
- [[../01-concepts/backend/CON-authentication-authorization]] — JWT, OAuth2, RBAC, session
- [[../01-concepts/backend/CON-api-security]] — OAuth flows, CORS, CSRF, JWT pitfalls, API keys
- [[../01-concepts/backend/CON-rate-limiting]] — Token Bucket, Sliding Window, Redis backend, 429 headers

## REST API Design Cheatsheet

| Method | Path | Action | Success Code |
|--------|------|--------|-------------|
| GET | `/resources` | List | 200 |
| GET | `/resources/:id` | Get one | 200 |
| POST | `/resources` | Create | 201 |
| PUT/PATCH | `/resources/:id` | Update | 200 |
| DELETE | `/resources/:id` | Delete | 204 |

**Status Codes:**
- `422` Validation error (not 400)
- `404` Not found
- `409` Conflict (duplicate)
- `401` Unauthenticated
- `403` Unauthorized (authenticated but no permission)

## Layered Architecture

```
HTTP Request
    ↓
Handler/Controller    ← validate input, parse params
    ↓
Service Layer         ← business logic, orchestration
    ↓
Repository Layer      ← data access only, no business logic
    ↓
Database
```

**Rules:**
- No raw DB queries in handlers
- Services must not import HTTP types
- Repositories must not contain business logic

## Related MOCs

- [[MOC-Developer-Fundamentals]] — clean code applies here
- [[MOC-QA]] — integration tests for all endpoints
- [[MOC-DevOps]] — deployment + monitoring
- [[MOC-Infrastructure]] — where the backend lives
- [[MOC-Architecture]] — system-wide design decisions
