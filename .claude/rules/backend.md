---
paths:
  - "src/api/**/*"
  - "src/services/**/*"
  - "src/repositories/**/*"
  - "internal/**/*"
  - "pkg/**/*"
  - "server/**/*"
  - "api/**/*"
---

# Backend Rules

<!-- Customize for your project. Defaults below are sensible starting points. -->

## Input Validation
- Validate all external input at the boundary — never trust raw request data downstream
- Return structured errors with a consistent shape: `{ error: string, code: string, details?: ... }`

## Layering
- HTTP handlers → service layer → repository layer — no raw DB queries in handlers
- Services must not import HTTP types (request/response objects)
- Repositories must not contain business logic

## Database
- All new endpoints must have integration tests hitting a real **test database**
- Migrations must be backward-compatible — no breaking schema changes in a single deploy
- Never use `SELECT *` — always name columns explicitly

## API Design
- REST: use correct HTTP verbs and status codes
- Return 422 for validation errors (not 400), 404 for not-found, 409 for conflicts
- Paginate list endpoints — never return unbounded arrays
