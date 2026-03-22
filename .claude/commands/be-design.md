# /be-design
Workflow position: **/fe-design → START → /implement**

Write the complete backend design and TDD test plan. Run BEFORE writing any code.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`. Register sub-tasks (wire sequentially; mark in_progress/completed at each step):
```
t1 = TaskCreate("[task-id] — be: load context")
t2 = TaskCreate("[task-id] — be: fill design")
t3 = TaskCreate("[task-id] — be: coverage check vs ACs")
t4 = TaskCreate("[task-id] — be: save + update status")
```
Mark t1 in_progress.

Read in order:
1. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals and technical constraints
2. `docs/discovery/` — scan for related doc. If found, read: constraints (security, performance, scalability, compliance).
3. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs, success metrics
4. `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — API contracts FE expects (**align BE to this**)

Validate: if ACs are empty → stop: "Fill in `[task-id]-requirement.md` first."

**Explore existing codebase** — do this before designing anything:
1. Glob the backend source to understand structure — where routes, controllers, services, models, middleware, tests live.
2. From the FE API contracts and ACs, identify what endpoints/models this task needs. Search for any existing route, service, or model that overlaps or can be extended.
3. Read 2–3 of the most relevant existing routes/controllers/services to extract:
   - Route registration pattern (Express router? Fastify? Convention for grouping?)
   - Controller pattern (thin controllers? fat services?)
   - Error handling pattern (custom error classes? global handler? what response shape?)
   - Validation pattern (Joi, Zod, class-validator? where validation lives?)
   - DB query pattern (ORM? query builder? raw SQL? how transactions are done?)
   - How integration tests are set up (test DB, factories, seed helpers, cleanup pattern)
4. Check auth middleware — how it's applied, what it attaches to `req`, how roles are checked.
5. Note everything that can be **reused** (base services, shared validation, middleware, test factories). Do NOT reimplement what already exists.

Write findings as **Existing Code Context** at the top of your design doc:
```
## Existing Code Context
- File structure: src/routes/ | src/services/ | src/models/ | ...
- Route pattern: [how routes are registered]
- Error handling: [error class names + response shape]
- Validation: [library + where it lives]
- DB pattern: [ORM/query builder + transaction pattern]
- Auth: [middleware name + what it sets on req]
- Reusable: [list actual services/middleware/helpers to reuse]
- Test pattern: [test DB setup, factory names, cleanup approach]
```
If the codebase is empty (new project) → note "No existing code — establishing conventions" and proceed.

Read **Points** from requirement doc Metadata. Apply points-based section scope (write `"N/A — Xpt task"` for unrequired sections):

| Points | Required sections |
|--------|------------------|
| **1pt** | API Endpoints (method, path, request, response, key errors), 1 TDD test per AC |
| **2pt** | + Input Validation Rules, TDD Test Plan (happy path + key error per AC) |
| **3pt** | + Data Models, Service/Layer Breakdown, Business Logic, Error Handling Strategy, Implementation Plan |
| **5pt+** | All sections — Authorization & Roles, Sequence Diagram, Class Diagram, Event Publishing, Security, Logging, Env Vars, Caching, DB Migrations, External Deps, Performance |
| **8pt** | All sections + ADR entries, explicit performance benchmarks, rollback plan |

Read existing draft `[task-id]-backend.md` and `docs/templates/BACKEND-DESIGN-TEMPLATE.md`.
Mark t1 completed, t2 in_progress.

---

## Step 2 — Fill the complete BE design

Write implementation-ready content for every required section:

- **API Endpoints** — method, path, auth, roles, idempotency, rate limit, request schema, success response, full error table (400/401/403/404/409/429/500). **Must match `[task-id]-frontend.md`.**
- **Authorization & Roles** — permission matrix per endpoint, ownership rules.
- **Input Validation Rules** — table per field: type, required, rules, error message. Maps directly to 400 cases and TDD tests.
- **Data Models** — every new/modified schema: fields, types, constraints, relationships, indexes.
- **Sequence Diagram** — full request flow: `Client → Middleware → Controller → Service → Repository → DB → response`.
- **Service / Layer Breakdown** — responsibility of each layer: middleware, controller, service, repository.
- **Business Logic** — non-obvious rules, calculations, decision flows in numbered steps.
- **Event Publishing** — domain events: topic, trigger, payload, consumer. Write "None" if not applicable.
- **Error Handling Strategy** — (1) standard error response envelope shape, (2) error code catalog (HTTP status + code + when), (3) which layer throws each type, (4) how external failures surface to client. Never expose stack traces.
- **Security Considerations** — input sanitization, rate limiting, sensitive field exposure, PII in logs.
- **Logging & Observability** — what to log per level, fields, slow query threshold.
- **Environment Variables** — name, description, required, default for every new var.
- **Caching Strategy** — data cached, cache key, TTL, invalidation. Write "None" if not applicable.
- **Database Migrations** — up SQL and down (rollback) SQL for every schema change.
- **Implementation Plan** — ordered steps in dependency order. Each step: `[N]. [actual file path] — [create/modify] — [what] — [design section ref]`. File paths must be **real paths** derived from the Existing Code Context exploration — not hypothetical. If creating a new file, place it following the discovered folder convention. Group by phase: (1) migrations, (2) models, (3) repository, (4) service, (5) controller/routes, (6) middleware/validation, (7) events, (8) caching, (9) logging. Omit irrelevant phases. **`/implement` follows this plan exactly.**
- **TDD Test Plan** — per AC: min 1 unit + 1 integration test. Include tests for 401, 403, 429, validation, event publishing. Integration tests use real DB. Written BEFORE code.
- **External Dependencies** — services called, purpose, failure behavior, timeout.
- **Performance & Scalability** — data volume, N+1 risks, index strategy, background jobs.

Mark t2 completed, t3 in_progress.

---

## Step 2b — Coverage check vs ACs and discovery

For each AC in requirement doc:
- API endpoint or service logic that implements it? Unit test? Integration test? Flag any missing.

For each endpoint in `[task-id]-frontend.md` API Contracts Consumed:
- Does BE design define a matching endpoint (method, path, response shape)? Flag mismatches.

For each discovery constraint (if doc found):
- Is it addressed in Security, Performance, Error Handling, etc.? Flag missing.

```
BE Coverage check:
✅ AC-1: endpoint [POST /x] + unit [Y] + integration [Z]
✅ FE contract [POST /x]: matches BE
⚠️ AC-N: missing integration test → adding to TDD Test Plan
⚠️ FE contract [GET /y]: not in BE → adding endpoint
```
Fill every gap immediately. Do NOT leave gaps unresolved. Mark t3 completed, t4 in_progress.

---

## Step 3 — Save and update status

1. Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`.
2. Update BACKLOG.md status to `in-progress` if was `todo`.

Mark t4 completed.

---

## Output

```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md

TDD Test Plan — write these failing tests BEFORE implementing:
[print test plan table]

Next: /implement [task-id]
```
