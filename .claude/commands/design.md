# /design
Workflow position: **/requirement → START → /implement**

Write the complete design and TDD test plan. Run BEFORE writing any code.
Arguments: `[type] [task-id]`  — type is `fe` or `be`, e.g. `/design fe SP1-T002`

> **When to skip a layer:**
> - FE-only task (no backend changes) → run only `/design fe`. Skip `/design be`.
> - BE-only task (API/data/infra, no UI) → run only `/design be`. Skip `/design fe`.
> - Infra/docs-only task → skip `/design` entirely; proceed straight to `/implement`.
>
> `/implement` Step 1 handles a missing design doc gracefully (sets `HAS_FE` or `HAS_BE = false` and skips that layer).

---

## Step 0 — Check brain for patterns and decisions

If `brain/BRAIN-INDEX.md` exists:

**If fe:** Read `brain/00-MOC/MOC-Frontend.md` — note PAT/DEC entries for components, state, routing, API calls.
**If be:** Read `brain/00-MOC/MOC-Backend.md` and `brain/00-MOC/MOC-Decisions.md` — note PAT/DEC entries for auth, DB schema, service layer, error handling. Check any DEC flagged as "rules out" that affects this task.

Read those specific notes (1–3 max). **Reuse patterns found here — do not redesign what the team has already decided.**

Print: `Brain: [N] patterns found — [PAT-NNN: title], [DEC-NNN: title]`
Skip if brain doesn't exist yet.

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read in order:
1. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals and constraints
2. `docs/discovery/` — scan for related doc. If found, read constraints (tech, UX, performance, security, compliance, accessibility).
3. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs, success metrics, design references
4. **If be only:** `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — API contracts FE expects (**align BE to this**)

Validate: if ACs are empty → stop: "Fill in `[task-id]-requirement.md` first."

**Explore existing codebase** before designing anything:

**If fe:**
1. Glob `src/` (or equivalent) to understand where components, pages, hooks, stores, and tests live.
2. Search for existing components/pages similar to what the ACs require. Read 2–3 of the most relevant.
3. Extract: naming conventions, state management pattern, API call pattern (React Query/SWR/fetch), error/loading handling, test utilities.
4. Check existing routing file — how routes are registered, what guards are used.

**If be:**
1. Glob the backend source to understand where routes, controllers, services, models, middleware, and tests live.
2. Search for existing routes/services overlapping with the ACs. Read 2–3 of the most relevant.
3. Extract: route registration pattern, controller style, error handling pattern/shape, validation library, DB query pattern, integration test setup (test DB, factories, cleanup).
4. Check auth middleware — how it's applied, what it attaches to `req`, how roles are checked.

Note everything that can be **reused**. Do NOT reimplement what already exists.

Write findings as `## Existing Code Context` at the top of your design doc. If the codebase is empty → note "No existing code — establishing conventions" and proceed.

Read **Points** from requirement doc Metadata. Apply points-based section scope (write `"N/A — Xpt task"` for unrequired sections):

**If fe:**
| Points | Required sections |
|--------|------------------|
| **1pt** | Approach, Component list, 1 TDD test per AC |
| **2pt** | + Component Breakdown, API Contracts Consumed, State & Data Flow, Fail State table |
| **3pt** | + UI/UX Overview, Loading & Skeleton States, Implementation Plan, E2E Test Plan, Fail Case Matrix |
| **5pt+** | All sections — User Journey Map, Behavior Mapping, Routing, Responsive, Analytics, Performance, Fail Flows, Accessibility, State Inventory |
| **8pt** | All sections + ADR entries for non-obvious design choices |

**If be:**
| Points | Required sections |
|--------|------------------|
| **1pt** | API Endpoints (method, path, request, response, key errors), 1 TDD test per AC |
| **2pt** | + Input Validation Rules, full TDD Test Plan (happy path + key error per AC) |
| **3pt** | + Data Models, Service/Layer Breakdown, Business Logic, Error Handling Strategy, Implementation Plan |
| **5pt+** | All sections — Authorization & Roles, Sequence Diagram, Class Diagram, Event Publishing, Security, Logging, Env Vars, Caching, DB Migrations, External Deps, Performance |
| **8pt** | All sections + ADR entries, performance benchmarks, rollback plan |

Read the existing draft and the matching template (`FRONTEND-DESIGN-TEMPLATE.md` or `BACKEND-DESIGN-TEMPLATE.md`).

---

## Step 1b — Clarify ambiguities before designing

<HARD-GATE>
If ambiguities exist, collect ALL into one message and wait for answers before proceeding to Step 2.
Exception: if everything is clear → skip entirely. Do NOT ask unnecessary questions.
</HARD-GATE>

Scan for gaps that would block writing a correct design:

**If fe:** Unclear UI behavior, interactions, or states? Missing API shape? Ambiguous UX decisions (error presentation, empty states, loading patterns)?
**If be:** Unclear business logic, rules, or calculations? Missing data requirements (fields, relationships, constraints)? Ambiguous security/auth (which roles can call which endpoints)?

Never ask about things already answered in the requirement doc, codebase exploration, or (for be) the FE design doc.

Follow the clarification protocol in `.claude/rules/clarification.md`.

---

## Step 2 — Fill the complete design

For every section required at this point level, write implementation-ready content using the matching template as structure.

**Both types:**
- **Implementation Plan** — file paths must be **real paths** from Existing Code Context. `/implement` follows this plan exactly.
  - Every step = single action, 2–5 min. Never combine "write test AND implement."
  - Each step format: `- [ ] [action] → [exact file path] → verify: [command]`
  - Example:
    ```
    - [ ] Write failing test for [AC] → [file path] → run: [test command]
    - [ ] Run test — confirm RED → [test command]
    - [ ] Implement minimal code → [file path]
    - [ ] Run test — confirm GREEN → [test command]
    - [ ] Commit: "test: add [X] tests"
    ```
- **TDD Test Plan** — min 1 unit + 1 integration per AC. Written BEFORE code.

**If fe additionally:**
- **E2E Test Plan** — min 1 scenario per AC. Format: "Given → When → Then."
- **Fail Case Matrix** — every user action that can fail: presentation pattern + exact error copy + recovery CTA + input preserved flag.

**If be additionally:**
- **API Endpoints** — every endpoint must exactly match the FE design's API contracts.
- **Error Handling** — standard envelope (`error`, `code`, `fields`). Never expose stack traces.
- **TDD Test Plan** — include 401, 403, 429, and validation error test cases. Integration tests use a real DB.

---

## Step 2b — Coverage check vs ACs and discovery

For each AC: design section or endpoint that implements it? Unit test? Integration test? E2E (fe only)? Flag any missing.

**If be only:** for each endpoint in `[task-id]-frontend.md` API Contracts — does the BE design define a matching endpoint (method, path, response shape)? Flag mismatches.

For each discovery constraint: is it addressed in the design? Flag missing.

```
Coverage check:
✅ AC-1: [component/endpoint] + unit [Y] + integration [Z]
⚠️ AC-N: missing TDD → adding to TDD Test Plan
⚠️ FE contract [GET /y]: not in BE → adding endpoint
```

Fill every gap immediately before proceeding.

---

## Step 2c — Self-check before saving

Re-read the full design doc and verify:

**Both:**
- [ ] Every AC has at least one unit + one integration test in the TDD Test Plan.
- [ ] Every file path in the Implementation Plan is a real path from Existing Code Context.
- [ ] Every Implementation Plan step is a single action (2–5 min).
- [ ] No required section (per point level) is empty, `TBD`, or missing.
- [ ] Coverage check shows no unresolved ⚠️ items.

**If fe additionally:**
- [ ] Every AC has at least one E2E scenario in the E2E Test Plan.
- [ ] Fail Case Matrix covers every user action that can fail.

**If be additionally:**
- [ ] TDD Test Plan includes 401/403/validation error test cases per endpoint.
- [ ] Every FE API contract has a matching endpoint (method, path, response shape) in this doc.

Fix any issue found. Re-read affected sections before saving.

---

## Step 3 — Save and update status

**If fe:** Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`.
**If be:** Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`.

Update BACKLOG.md status to `in-progress` if was `todo`.

---

## Output

**If fe:**
```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md

TDD Test Plan — write these failing tests BEFORE implementing:
[print TDD test plan table]

E2E Test Plan:
[print E2E test plan table]

Next: /design be [task-id]
```
Optional: `/adr [task-id] [title]` — record a non-trivial design decision before moving on.

**If be:**
```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md

TDD Test Plan — write these failing tests BEFORE implementing:
[print TDD test plan table]

Next: /implement [task-id]
```
Optional: `/db-schema-review [task-id]` — review schema before writing any code.
