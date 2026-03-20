# /be-design
Workflow position: **/fe-design → START → implement**

Write the complete backend design and TDD test plan for a task. Run this BEFORE writing any code.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Register all steps with TaskCreate — store the returned IDs:

```
t1 = TaskCreate(subject: "[task-id] — be: load context",           description: "Read sprint overview, discovery doc, requirement doc, and frontend design to align BE contracts")
t2 = TaskCreate(subject: "[task-id] — be: fill design",            description: "Write complete BE design, implementation plan, and TDD test plan")
t3 = TaskCreate(subject: "[task-id] — be: coverage check vs ACs",  description: "Cross-check design sections and test plans against every AC and discovery constraints")
t4 = TaskCreate(subject: "[task-id] — be: save + update status",   description: "Save backend design doc and update task status in BACKLOG.md")
```

Wire dependencies:
```
TaskUpdate(t2, addBlockedBy: [t1])
TaskUpdate(t3, addBlockedBy: [t2])
TaskUpdate(t4, addBlockedBy: [t3])
```

```
TaskUpdate(t1, status: in_progress)
```

Read these files in order:
2. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals and technical constraints
3. `docs/discovery/` — scan for any discovery doc related to this sprint's epic. If found, read it for: Problem Statement, goals, in-scope items, constraints (security, performance, scalability, compliance), open questions.
4. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs, success metrics
5. `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — API contracts the FE expects (align BE to this)

Validate:
- If Acceptance Criteria are empty → stop: "Fill in `[task-id]-requirement.md` first."

Read current draft:
5. `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`
6. `docs/templates/BACKEND-DESIGN-TEMPLATE.md` — ensure all sections are covered

```
TaskUpdate(t1, status: completed)
```

---

## Step 2 — Fill in the complete BE design

```
TaskUpdate(t2, status: in_progress)
```

Write a complete, implementation-ready design for every section:

- **API Endpoints** — method, path, auth, roles, idempotency, rate limit, request schema, success response, full error table (400/401/403/404/409/429/500). Must match `[task-id]-frontend.md`.
- **Authorization & Roles** — permission matrix per endpoint. Include any ownership rules.
- **Input Validation Rules** — explicit table per field: type, required, rules, error message. Maps directly to 400 cases and TDD tests.
- **Data Models** — every new or modified schema: fields, types, constraints, relationships, and indexes.
- **Sequence Diagram** — full request flow as a text diagram: Client → Middleware → Controller → Service → Repository → DB → response.
- **Service / Layer Breakdown** — responsibility of each layer: middleware, controller, service, repository.
- **Business Logic** — non-obvious rules, calculations, decision flows in numbered steps.
- **Event Publishing** — domain events emitted: topic, trigger, payload, consumer. Write "None" if not applicable.
- **Error Handling Strategy** — define: (1) the standard error response envelope shape, (2) the error code catalog for every error this task can produce (HTTP status + code + when to use), (3) which layer is responsible for throwing each error type, (4) how external service failures are handled and what the client receives. Never expose stack traces or internal error details to the client.
- **Security Considerations** — input sanitization, rate limiting, sensitive field exposure, PII in logs.
- **Logging & Observability** — what to log at each level, fields, slow query threshold.
- **Environment Variables** — every new env var: name, description, required, default.
- **Caching Strategy** — data cached, cache key pattern, TTL, invalidation trigger. Write "None" if not applicable.
- **Database Migrations** — up SQL and down (rollback) SQL for every schema change.
- **Implementation Plan** — ordered, step-by-step plan for how to implement this design. Each step must reference the design section it implements. Rules:
  - List steps in dependency order (what must be done before what).
  - Each step: `[N]. [File path] — [action: create/modify] — [what to implement] — [references: design section]`
  - Group by logical phase: (1) migrations, (2) data models, (3) repository layer, (4) service layer, (5) controller/routes, (6) middleware/validation, (7) event publishing, (8) caching, (9) logging/observability. Not all phases apply to every task — omit phases that are not relevant.
  - This plan is the blueprint `/implement` follows. Do NOT deviate from it during implementation.
- **TDD Test Plan** — for EACH AC: at least 1 unit + 1 integration test. Include tests for 401, 403, 429, validation rules, and event publishing. Integration tests use a real DB. Written BEFORE any code.
- **External Dependencies** — services called, purpose, failure behavior, timeout.
- **Performance & Scalability Notes** — data volume, N+1 risks, index strategy, rate limiting, background jobs.

```
TaskUpdate(t2, status: completed)
```

---

## Step 2b — Coverage check vs ACs and discovery

```
TaskUpdate(t3, status: in_progress)
```

Cross-check the completed design against the requirement doc and discovery doc:

1. **AC coverage** — for each AC in the requirement doc:
   - Is there an API endpoint or service logic that implements it?
   - Is there at least 1 unit test in the TDD Test Plan?
   - Is there at least 1 integration test in the TDD Test Plan?
   - Flag any AC missing any of the three.

2. **FE contract alignment** — for each endpoint listed in `[task-id]-frontend.md` API Contracts Consumed:
   - Does the BE design define a matching endpoint (method, path, response shape)?
   - Flag any mismatch or missing endpoint.

3. **Discovery constraints coverage** — if a discovery doc was found, for each constraint listed (security, performance, scalability, compliance):
   - Is it addressed in a relevant design section (Security Considerations, Performance & Scalability Notes, Error Handling Strategy, etc.)?
   - Flag any constraint with no design section addressing it.

Present the coverage summary:

```
BE Coverage check:

✅ Covered
  - AC-1: endpoint [POST /x] + unit test [Y] + integration test [Z]
  - FE contract [POST /x]: matches BE design
  - ...

⚠️ Gaps found — updating design:
  - AC-N: missing integration test → adding to TDD Test Plan
  - FE contract [GET /y]: not defined in BE → adding endpoint
  - Discovery constraint [X]: not addressed → adding to [section]
  - ...
```

- Fill in any gaps immediately before moving to Step 3. Do NOT leave gaps unresolved.
- If no discovery doc exists, skip the constraints check.

```
TaskUpdate(t3, status: completed)
```

---

## Step 3 — Save and update status

```
TaskUpdate(t4, status: in_progress)
```

1. Save the completed design to `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`.
2. Update task status in `docs/BACKLOG.md` to `in-progress` if it was `todo`.

```
TaskUpdate(t4, status: completed)
```

---

## Step 4 — Output

Print the TDD Test Plan table, then:
```
✓ BE design saved: docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md

TDD Test Plan — write these failing tests BEFORE implementing:
[print the test plan table]

Next step: /implement [task-id]
```
