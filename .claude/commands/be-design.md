# /be-design
Workflow position: **/fe-design → START → /implement**

Write the complete backend design and TDD test plan. Run BEFORE writing any code.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 0 — Check brain for BE patterns and decisions

If `brain/BRAIN-INDEX.md` exists:
- Read `brain/00-MOC/MOC-Backend.md` — note any PAT or DEC entries relevant to this task's domain (auth, DB schema, service layer, error handling, events).
- Read those specific PAT notes (1–3 max). Extract: "When to use", "Example from sprint".
- Read any DEC notes that affect BE architecture (ORM choice, auth strategy, error envelope, DB migration pattern).
- Read `brain/00-MOC/MOC-Decisions.md` — any DEC flagged as "rules out" that affects this task?
- **Align with decisions found here** — do not reopen settled decisions without a new `/adr`.

Print one-line summary: `Brain: [N] BE patterns found — [PAT-NNN: title], [DEC-NNN: title]`
Skip if brain doesn't exist yet.

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

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

---

## Step 1b — Clarify ambiguities before designing

After loading all context (requirement doc, FE design, existing codebase), scan for gaps that would block writing a correct BE design:
- Unclear **business logic** — rules, conditions, or calculations not specified in ACs?
- Missing **data requirements** — fields, relationships, or constraints not defined anywhere?
- Ambiguous **security/auth** — which roles can call which endpoints, not stated?

**Rules:**
- If everything is clear → skip this step entirely. Do NOT ask unnecessary questions.
- If gaps exist → collect ALL unclear points into **one message**, ask them together, wait for answers before proceeding to Step 2.
- Never ask one-by-one. Never ask about things already answered in the requirement doc, FE design, or codebase exploration.

**After receiving answers** — append a `## Clarifications` section to the backend doc before the main content:
```
## Clarifications
| # | Question | Answer |
|---|----------|--------|
| 1 | [question asked] | [answer received] |
```

---

## Step 2 — Fill the complete BE design

For every section required at this point level (per the table above), write implementation-ready content using `docs/templates/BACKEND-DESIGN-TEMPLATE.md` as the structure.

Key requirements:
- **API Endpoints** — every endpoint must match `[task-id]-frontend.md` API contracts exactly.
- **Error Handling Strategy** — standard envelope (`error`, `code`, `fields`). Never expose stack traces.
- **Implementation Plan** — file paths must be **real paths** from Existing Code Context. `/implement` follows this plan exactly.
- **TDD Test Plan** — min 1 unit + 1 integration per AC. Include 401, 403, 429, validation tests. Integration tests use real DB. Written BEFORE code.

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
Fill every gap immediately. Do NOT leave gaps unresolved.

---

## Step 3 — Save and update status

1. Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`.
2. Update BACKLOG.md status to `in-progress` if was `todo`.

---

## Output

```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md

TDD Test Plan — write these failing tests BEFORE implementing:
[print test plan table]

Next: /implement [task-id]
```
