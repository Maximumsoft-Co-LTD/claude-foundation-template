---
type: concept
tags: [backend, api, REST, GraphQL, gRPC, design]
related: [CON-backend-layers, CON-error-handling, CON-authentication-authorization]
updated: 2026-03-25
---

# API Design Principles

## REST Principles

### Resource Naming
```
✅ Nouns, plural, lowercase, hyphenated
GET  /users                    ← list
GET  /users/:id                ← get one
POST /users                    ← create
PUT  /users/:id                ← full update
PATCH /users/:id               ← partial update
DELETE /users/:id              ← delete

GET  /users/:id/orders         ← nested resource

❌ Verbs in URL
GET /getUsers
POST /createUser
GET /getUserOrders/:id
```

### HTTP Status Codes (Must Know)
```
2xx Success
  200 OK             ← GET success, PUT/PATCH success
  201 Created        ← POST created resource
  204 No Content     ← DELETE success, no body needed

4xx Client Errors
  400 Bad Request    ← malformed request syntax
  401 Unauthorized   ← not authenticated (missing/invalid token)
  403 Forbidden      ← authenticated but no permission
  404 Not Found      ← resource doesn't exist
  409 Conflict       ← duplicate, state conflict
  422 Unprocessable  ← validation failed (use this, not 400)
  429 Too Many Req.  ← rate limit exceeded

5xx Server Errors
  500 Internal Error ← unexpected server error
  502 Bad Gateway    ← upstream service failed
  503 Unavailable    ← server overloaded or maintenance
```

### Consistent Error Response
```json
{
  "error": "VALIDATION_FAILED",
  "message": "Email is required",
  "details": [
    { "field": "email", "message": "required" },
    { "field": "email", "message": "must be valid email" }
  ]
}
```

### Pagination (Never Return Unbounded Arrays)
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "hasNext": true
  }
}
```

## REST vs GraphQL vs gRPC

| | REST | GraphQL | gRPC |
|-|------|---------|------|
| Protocol | HTTP | HTTP | HTTP/2 |
| Format | JSON | JSON | Protocol Buffers |
| Flexibility | Fixed endpoints | Client-defined queries | Fixed methods |
| Over-fetching | Common | None (request only what you need) | None |
| Best for | Public APIs, simple CRUD | Complex UIs, multiple consumers | Internal microservices |
| Learning curve | Low | Medium | High |

## API Versioning

```
URL versioning (recommended for major changes):
  /api/v1/users
  /api/v2/users

Header versioning:
  API-Version: 2024-01-01

Never break v1 without migration period + deprecation notice
```

## Design Checklist

- [ ] Resources are nouns, plural, lowercase
- [ ] Correct HTTP verbs and status codes
- [ ] Pagination on all list endpoints
- [ ] Consistent error response shape
- [ ] Input validation with 422 on failure
- [ ] Authentication documented (which endpoints need it)
- [ ] Rate limiting headers included
- [ ] API versioning strategy defined

## Related

- [[CON-backend-layers]] — where API layer sits
- [[CON-error-handling]] — error response patterns
- [[CON-authentication-authorization]] — securing APIs
- [[../../../00-MOC/MOC-Backend]]
