# /be-design
Workflow position: **/fe-design → START → implement**

Write the complete backend design and TDD test plan for a task. Run this BEFORE writing any code.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Read these files in order:
2. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals and technical constraints
2. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs, success metrics
3. `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — API contracts the FE expects (align BE to this)

Validate:
- If Acceptance Criteria are empty → stop: "Fill in `[task-id]-requirement.md` first."

Read current draft:
4. `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`
5. `docs/BACKEND-DESIGN-TEMPLATE.md` — ensure all sections are covered

---

## Step 2 — Fill in the complete BE design

Write a complete, implementation-ready design for every section:

- **API Endpoints** — method, path, auth, roles, idempotency, rate limit, request schema, success response, full error table (400/401/403/404/409/429/500). Must match `[task-id]-frontend.md`.
- **Authorization & Roles** — permission matrix per endpoint. Include any ownership rules.
- **Input Validation Rules** — explicit table per field: type, required, rules, error message. Maps directly to 400 cases and TDD tests.
- **Data Models** — every new or modified schema: fields, types, constraints, relationships, and indexes.
- **Sequence Diagram** — full request flow as a text diagram: Client → Middleware → Controller → Service → Repository → DB → response.
- **Service / Layer Breakdown** — responsibility of each layer: middleware, controller, service, repository.
- **Business Logic** — non-obvious rules, calculations, decision flows in numbered steps.
- **Event Publishing** — domain events emitted: topic, trigger, payload, consumer. Write "None" if not applicable.
- **Error Handling Strategy** — where errors are caught, standardized format, what never to expose to the client.
- **Security Considerations** — input sanitization, rate limiting, sensitive field exposure, PII in logs.
- **Logging & Observability** — what to log at each level, fields, slow query threshold.
- **Environment Variables** — every new env var: name, description, required, default.
- **Caching Strategy** — data cached, cache key pattern, TTL, invalidation trigger. Write "None" if not applicable.
- **Database Migrations** — up SQL and down (rollback) SQL for every schema change.
- **TDD Test Plan** — for EACH AC: at least 1 unit + 1 integration test. Include tests for 401, 403, 429, validation rules, and event publishing. Integration tests use a real DB. Written BEFORE any code.
- **External Dependencies** — services called, purpose, failure behavior, timeout.
- **Performance & Scalability Notes** — data volume, N+1 risks, index strategy, rate limiting, background jobs.

---

## Step 3 — Save and update status

1. Save the completed design to `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`.
2. Update task status in `docs/BACKLOG.md` to `in-progress` if it was `todo`.

---

## Step 4 — Output

Print the TDD Test Plan table, then:
```
✓ BE design saved: docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md

TDD Test Plan — write these failing tests BEFORE implementing:
[print the test plan table]

Next step: /implement [task-id]
```
