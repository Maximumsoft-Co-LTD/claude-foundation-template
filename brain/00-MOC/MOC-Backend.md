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

- [[../01-concepts/backend/CON-api-design-principles]] — REST, GraphQL, gRPC — ออกแบบ API อย่างไร
- [[../01-concepts/backend/CON-backend-layers]] — Handler → Service → Repository → DB
- [[../01-concepts/backend/CON-database-patterns]] — CRUD, transactions, migrations, indexing
- [[../01-concepts/backend/CON-authentication-authorization]] — JWT, OAuth2, RBAC, session
- [[../01-concepts/backend/CON-error-handling]] — Error types, HTTP codes, structured errors
- [[../01-concepts/backend/CON-caching-strategies]] — In-memory, Redis, CDN, cache invalidation
- [[../01-concepts/backend/CON-async-patterns]] — Queue, pub/sub, event-driven, webhook

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
