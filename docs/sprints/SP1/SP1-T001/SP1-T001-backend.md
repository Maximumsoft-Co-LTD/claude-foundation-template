# SP1-T001 — Example Task — Backend Design

## Metadata
| Field | Value |
|-------|-------|
| **Requirement** | `docs/sprints/SP1/SP1-T001/SP1-T001-requirement.md` |
| **Assignee** | - |
| **Status** | draft |

## API Endpoints
<!-- Fill in with /be-design SP1 SP1-T001 -->

### `METHOD /api/path`
- **Purpose:**
- **Auth required:** yes / no
- **Roles allowed:** admin / user / public
- **Request body:**
```json
{}
```
- **Response (200):**
```json
{}
```
- **Error responses:**

| Code | Condition | Response body |
|------|-----------|---------------|
| 400 | Validation failed | `{ "error": "...", "fields": [...] }` |
| 401 | Not authenticated | `{ "error": "Unauthorized" }` |
| 403 | Insufficient role | `{ "error": "Forbidden" }` |
| 404 | Not found | `{ "error": "Not found" }` |
| 500 | Unexpected error | `{ "error": "Internal server error" }` |

## Authorization & Roles
| Endpoint | public | user | admin |
|----------|--------|------|-------|
| - | - | - | - |

## Data Models
```
ModelName {
  id        : uuid      PK
  createdAt : datetime  NOT NULL
  updatedAt : datetime  NOT NULL
}
```

## Business Logic
1.
2.

## Service / Layer Breakdown
```
Request → Middleware (auth, validation) → Controller → Service → Repository → DB
```

## Error Handling Strategy
- All errors return `{ "error": "message", "code": "ERROR_CODE" }`.
- Validation errors include a `"fields"` array.
- Unexpected errors are caught by a global handler, logged, and return 500.

## Logging & Observability
| Event | Level | Fields logged |
|-------|-------|--------------|
| Request received | `info` | method, path, userId |
| Validation error | `warn` | path, fields, userId |
| Unexpected error | `error` | message, stack, userId |
| Slow query (>500ms) | `warn` | query, duration |

## Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| - | - | - | - |

## Caching Strategy
| Data | Cache key | TTL | Invalidated when |
|------|-----------|-----|-----------------|
| - | - | - | - |

## Database Migrations
**Up:**
```sql
-- describe change
```
**Down (rollback):**
```sql
-- revert change
```

## TDD Test Plan
| Test Case | AC | Type | Description |
|-----------|----|------|-------------|
| - | - | - | - |

## External Dependencies
| Service | Purpose | Failure behavior |
|---------|---------|-----------------|
| - | - | - |

## Performance & Scalability Notes
-
