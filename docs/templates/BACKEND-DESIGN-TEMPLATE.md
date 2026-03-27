# [task-id] — [Title] — Backend Design

## Metadata
| Field | Value |
|-------|-------|
| **Requirement** | `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` |
| **FE Design** | `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` |
| **Points** | 1 / 2 / 3 / 5 / 8 |
| **Assignee** | - |
| **Status** | draft / ready / implemented |

<!-- Section scope by points: see /design be command -->

---

## API Endpoints
<!-- 1pt+ -->
<!-- Repeat block for each endpoint. -->

### `METHOD /api/v1/path`
- **Purpose:**
- **Auth required:** yes / no
- **Roles allowed:** admin / user / public
- **Idempotent:** yes / no
- **Rate limit:** X req/min

**Request body:**
```json
{}
```

**Request schema:**
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
|       |      |          |             |             |

**Response (200):**
```json
{}
```

**Error responses:**
| Code | Condition | Response body |
|------|-----------|---------------|
| 400  |           |               |
| 401  |           |               |
| 403  |           |               |
| 404  |           |               |
| 500  |           |               |

---

## API Versioning Strategy
<!-- 2pt+ -->
- **Version:**
- **Versioning approach:** URL path / header / query param
- **Deprecation plan:**

---

## Data Contracts
<!-- 5pt+ — inter-service contracts only -->
| Contract | Direction | Format | Version | Owner |
|----------|-----------|--------|---------|-------|
|          |           |        |         |       |

---

## Authorization & Roles
<!-- 5pt+ -->

| Endpoint | public | user | admin | notes |
|----------|--------|------|-------|-------|
|          |        |      |       |       |

---

## Input Validation Rules
<!-- 2pt+ -->

| Field | Type | Required | Rules | Error message |
|-------|------|----------|-------|---------------|
|       |      |          |       |               |

---

## Data Models
<!-- 3pt+ -->
<!-- mermaid erDiagram + state lifecycle if applicable -->

**Indexes:**
-

---

## Sequence Diagram
<!-- 5pt+ -->
<!-- mermaid sequenceDiagram: Client → Middleware → Controller → Service → Repository → DB → response -->

---

## Existing Code Context
<!-- 1pt+ required. Reuse first, build new second. -->

**Services / Repositories available:**
| Class / Function | File path | Notes |
|-----------------|-----------|-------|
|                 |           |       |

**Project patterns to follow:**
-

---

## Service / Layer Breakdown
<!-- 3pt+ -->
<!-- mermaid flowchart if helpful -->

| Layer | Responsibility |
|-------|---------------|
| **Middleware** | |
| **Controller** | |
| **Service** | |
| **Repository** | |

---

## Class Diagram
<!-- 8pt+ — mermaid classDiagram -->

---

## Design Decisions
<!-- 8pt — ADR entries -->

| Decision | Why | Alternatives Rejected |
|----------|-----|-----------------------|
|          |     |                       |

---

## Business Logic
<!-- 3pt+ -->
<!-- Pseudocode rules, not prose -->

1.

---

## Event Publishing
<!-- 5pt+ -->

| Event | Topic / Queue | Trigger | Payload | Consumer |
|-------|--------------|---------|---------|----------|
|       |              |         |         |          |

---

## Error Handling Strategy
<!-- 3pt+ -->

### Error Response Envelope
```json
{
  "error": "Human-readable message",
  "code": "SCREAMING_SNAKE_CASE",
  "fields": [{ "field": "name", "message": "detail" }]
}
```

### Error Code Catalog

| HTTP | Code | When to use |
|------|------|-------------|
| 400  | `VALIDATION_ERROR` | |
| 401  | `UNAUTHORIZED` | |
| 403  | `FORBIDDEN` | |
| 404  | `NOT_FOUND` | |
| 422  | `BUSINESS_RULE_VIOLATION` | |
| 429  | `RATE_LIMITED` | |
| 500  | `INTERNAL_ERROR` | |

### Per-Layer Error Responsibility

| Layer | Throws |
|-------|--------|
| **Middleware** | 401, 429 |
| **Controller** | 400 (input shape) |
| **Service** | 400 INVALID_INPUT, 403, 404, 409, 422 |
| **Repository** | Re-throws as 500 |

---

## Security Considerations
<!-- 5pt+ -->

- [ ] All user input sanitized
- [ ] Rate limiting on write endpoints
- [ ] Sensitive fields never returned in responses
- [ ] PII fields: [list]

---

## Logging & Observability
<!-- 5pt+ -->

| Event | Level | Fields logged |
|-------|-------|--------------|
| Request received | `info` | method, path, userId, requestId |
| Validation error | `warn` | path, fields, userId |
| Unexpected error | `error` | message, stack, userId |

---

## Environment Variables
<!-- 5pt+ -->

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
|          |             |          |         |

---

## Caching Strategy
<!-- 5pt+ -->

| Data | Cache key | TTL | Invalidated when |
|------|-----------|-----|-----------------|
|      |           |     |                 |

---

## Database Migrations
<!-- 5pt+ -->

**Up:**
```sql
-- describe what this migration does
```

**Down (rollback):**
```sql
-- revert the above change exactly
```

---

## Implementation Plan
<!-- 3pt+ -->
<!-- Ordered steps. /implement follows this exactly. -->

| # | Phase | File path | Action | What to implement | References |
|---|-------|-----------|--------|-------------------|------------|
| 1 | Migrations | | create | | |
| 2 | Models | | create / modify | | |
| 3 | Repository | | create / modify | | |
| 4 | Service | | create / modify | | |
| 5 | Controller | | create / modify | | |
| 6 | Middleware | | create / modify | | |

---

## TDD Test Plan
<!-- 2pt+ -->
<!-- Write BEFORE implementing. Integration tests use real DB — no mocks. -->

| Test Case | AC | Type | Description |
|-----------|----|------|-------------|
|           |    | unit / integration | |

---

## External Dependencies
<!-- 5pt+ -->

| Service | Purpose | Failure behavior | Timeout |
|---------|---------|-----------------|---------|
|         |         |                 |         |

---

## Performance & Scalability Notes
<!-- 5pt+ -->

| Concern | Detail |
|---------|--------|
| Expected data volume | |
| Query N+1 risk | |
| Index strategy | |
