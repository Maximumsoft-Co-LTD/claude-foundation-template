# /requirement
Workflow position: **/new-sprint → START → /implement**

Write the **single requirement doc** for a task. This one doc contains: story + ACs + FE design (if any) + BE design (if any) + implementation plan with subtasks + test plans. Run BEFORE `/implement`.

**This is the first command that reads the actual codebase.** `/discovery` and `/new-sprint` operate at the planning level (no deep code reading). `/requirement` is where you open real source files, learn the conventions, and turn the sprint plan into a concrete implementation plan grounded in the codebase.

If a draft `[task-id]-requirement.md` already exists from a prior partial `/requirement` pass or manual draft, read it first and treat it as an input to refine rather than work to redo.

Arguments: `[task-id]`  — e.g. `SP1-T001`

> **1 task = 1 user story = 1 doc.** There is no separate `/design fe` or `/design be` anymore — design now lives inside the requirement doc, gated by the `Task Type` field.

---

> **See worked example:** `.claude/examples/example-requirement.md` — a filled-in 3-pt fullstack story showing AC structure, BE design, Implementation Plan, and TDD test plan.

## Step 0 — Check brain for relevant lessons, patterns, and decisions (scoped)

Skip entirely if `brain/BRAIN-INDEX.md` does not exist.

Otherwise, follow the access protocol in `.claude/rules/brain.md` — open MOCs **only** when the task type / story points warrant it. Stop reading once you have 1–3 relevant notes.

| Condition | MOC to open |
|-----------|-------------|
| `Points >= 5` AND brain has any LES note overlapping the User Story keywords | `MOC-Lessons.md` |
| Task Type includes FE | `MOC-Frontend.md` |
| Task Type includes BE | `MOC-Backend.md` |
| Task introduces a non-trivial design decision (auth, schema, integration) | `MOC-Decisions.md` |

Read the 1–3 most relevant linked notes — never the full MOC, never multiple MOCs that don't match the conditions above. **Reuse what the team has already decided.**

Print: `Brain: [N] lessons/patterns — [LES-NNN], [PAT-NNN], [DEC-NNN]` (or `Brain: skipped — no matches`).

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read in order:
1. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals, Stories table, E2E Validation Scenarios, dependencies
2. `docs/discovery/` — scan for related discovery doc. If found, read: Problem Statement, goals, in-scope, constraints, open questions.
3. Existing draft (if any): `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
4. `docs/templates/REQUIREMENT-TEMPLATE.md` — the unified template structure

From the sprint overview Stories table, extract: **User Story**, dependencies, **Points**. From the E2E Validation Scenarios section, extract the numbered GIVEN/WHEN/THEN scenarios for this task.

### Determine `Task Type`

Inspect the Story + ACs + sprint overview. Classify as:
- `fullstack` — story needs both UI and backend changes
- `fe-only` — story only touches UI / client code
- `be-only` — story only touches API / data / infra, no UI
- `infra` — tooling, CI, scripts, docs only — skip FE and BE design sections

If unclear, ask in Step 1b.

### Explore existing codebase (scope by Task Type)

**If Task Type includes FE:**
1. Glob `src/` (or equivalent) to understand where components, pages, hooks, stores, and tests live.
2. Search for existing components/pages similar to what the ACs require. Read 2–3 of the most relevant.
3. Extract: naming conventions, state management pattern, API call pattern (React Query/SWR/fetch), error/loading handling, test utilities.
4. Check existing routing file — how routes are registered, what guards are used.

**If Task Type includes BE:**
1. Glob the backend source to understand where routes, controllers, services, models, middleware, and tests live.
2. Search for existing routes/services overlapping with the ACs. Read 2–3 of the most relevant.
3. Extract: route registration pattern, controller style, error handling pattern/shape, validation library, DB query pattern, integration test setup (test DB, factories, cleanup).
4. Check auth middleware — how it's applied, what it attaches to `req`, how roles are checked.

Note everything that can be **reused**. Write findings into the `## Existing Code Context` section of the doc. If the codebase is empty → note "No existing code — establishing conventions" and proceed.

### Context7 — fetch current library docs (if available)

From codebase exploration, identify the key libraries this task depends on (max 3 — UI framework, state/data-fetching, validation for FE; web framework, ORM, validation for BE).
For each library, follow `.claude/rules/context7-cache.md`:
1. **Cache check** — read `docs/sprints/[sprint-id]/.context7-cache.json`; on hit, reuse and skip both MCP calls below.
2. `mcp__plugin_context7_context7__resolve-library-id` — resolve library name → context7 ID.
3. `mcp__plugin_context7_context7__query-docs` — fetch docs for the specific patterns needed (component API, hook usage, query patterns, validation schema syntax, etc.).
4. Append `{libraryId, result, fetchedAt}` to the cache file.

Use the returned docs as source of truth for API syntax when filling the design sections.
If context7 is not available, proceed using codebase patterns and existing knowledge.

### Points-based section scope

Write `"N/A — Xpt task"` for sections not required at this point level. Sections tagged `[FE]` are also `N/A — BE-only task` when Task Type = `be-only` (and vice versa). Infra tasks mark all `[FE]` and `[BE]` sections `N/A — infra task`.

| Points | Required sections |
|--------|-------------------|
| **1pt** | Metadata, Problem Statement, Overview, Value, Acceptance Criteria (min 2–3), Definition of Done, Out of Scope, Existing Code Context (minimal), minimal Scope Overview, minimal Implementation Plan (1–3 rows), Execution Slices, Plan Drift Guard, [FE] Approach / Component list, [BE] API Endpoints, 1 planned TDD test per AC |
| **2pt** | + User Stories, Dependencies, fuller Scope Overview, [FE] State Inventory (5-state table + transition diagram), Component Breakdown, API Contracts Consumed, State & Data Flow, Fail State Summary, [FE] FE Environment / Config, [BE] Input Validation Rules, full TDD Test Plan |
| **3pt** | + Feature Flow, System Behavior, Data & Business Rules, Success Metrics, fuller Implementation Plan (engineering tasks + subtasks), [FE] UI/UX Overview, Loading & Skeleton States, Async Interaction Sequence, E2E Test Plan, Fail Case Matrix, [BE] Data Models, Service/Layer Breakdown, Business Logic, Error Handling Strategy |
| **5pt+** | All sections — User Journey Map, Behavior Mapping, Routing, Responsive, Analytics, Performance, Fail Flows, Accessibility, Authorization & Roles, Sequence Diagram, Event Publishing, Security, Logging, Env Vars, Caching, DB Migrations, External Deps, Non-Functional Requirements, UI Copy, DO/DON'T, Rollout, Open Questions |
| **8pt** | All sections + FE/BE Design Decisions (ADR entries), Class Diagram, extra edge cases and constraints |

---

## Step 1b — Clarify ambiguities before drafting

<HARD-GATE>
If ambiguities exist, collect ALL into one message and wait for answers before proceeding to Step 2.
Exception: if everything is clear → skip entirely. Do NOT ask unnecessary questions.
</HARD-GATE>

Scan for gaps that would block writing a correct doc:
- Unclear **scope** — which users/roles, which platforms, which edge cases are in/out?
- Missing **business rules** — conditions, limits, or calculations not stated?
- Ambiguous **success criteria** — no way to write a measurable AC?
- Unclear **Task Type** — is this FE-only, BE-only, fullstack, or infra?
- **If Task Type includes FE:** unclear UI behavior, interactions, states, UX decisions (error presentation, empty states, loading patterns)?
- **If Task Type includes BE:** unclear business logic, data requirements (fields, relationships, constraints), or security/auth (which roles can call which endpoints)?

Never ask about things already answered in the sprint overview, discovery doc, or codebase exploration.

Follow the clarification protocol in `.claude/rules/clarification.md`.

---

## Step 1c — Confidence Gate

Assess confidence that you can write a complete, correct unified doc for this task.

Key dimensions:
- Epic scope and this task's role within it clear?
- Task Type (fullstack / fe-only / be-only / infra) correctly classified?
- User stories concrete — you know the roles, goals, outcomes?
- ACs measurable and testable — not vague?
- Codebase patterns explored — naming, state, routing, API, test conventions understood for the layers this task touches?
- Stack/library APIs understood (from context7 or existing knowledge)?
- Edge cases and failure paths identifiable?
- Dependencies and out-of-scope boundaries clear?

**>= 90%** → proceed to Step 2.
**< 90%** → **STOP.** State what you know, what you don't, and what you need. Do NOT draft until confidence reaches 90%. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

---

## Step 2 — Draft the unified requirement doc

Fill every section required at this point level using the unified template.

### Story & Requirements
- **Problem Statement** — from discovery doc if available; otherwise from epic Problem Statement scoped to this task.
- **Overview** — one paragraph expanding the User Story. Incorporate context from the E2E Validation Scenarios.
- **Value** — 1–3 bullets covering user impact + business outcome (+ optional "why now"). Concrete; include metric if known. Avoid vague restatements of the user story — if Value just repeats "users can X", it's not value.
- **User Stories** — "As a [role], I want [goal], so that [reason]." At least one per distinct user action.
- **Acceptance Criteria** — specific, testable, user-visible. Format: "GIVEN / WHEN / THEN." Cover happy path + at least one failure path + boundary conditions. Minimum 3 ACs. Seed from the E2E Validation Scenarios in sprint overview — each numbered scenario → at least one AC. Expand with edge cases.
- **Success Metrics** — 2–3 measurable metrics aligned with sprint goals.
- **Out of Scope** — explicitly list anything in discovery/overview NOT part of this task.
- **Dependencies** — task IDs from sprint overview + external services/decisions.

### Existing Code Context
- Fill the [FE] / [BE] subsections that apply. Reuse first, build new second.

### Frontend Design (if Task Type includes FE)
- **Approach** — short narrative of the UI approach.
- **State Inventory (2pt+)** — every interactive component must enumerate all 5 states (Loading / Empty / Error / Success / Partial-Stale). A blank cell = a gap; mark `N/A — [reason]` only if truly impossible. Pair with a `stateDiagram-v2` for any component with > 2 states or async actions.
- **API Contracts Consumed** — must exactly match Section 4 API Endpoints.
- **Fail Case Matrix (3pt+)** — every user action that can fail: presentation pattern + exact error copy + recovery CTA + input preserved flag.

### Backend Design (if Task Type includes BE)
- **API Endpoints** — every endpoint must exactly match the FE API Contracts Consumed.
- **Error Handling** — standard envelope (`error`, `code`, `fields`). Never expose stack traces.
- **Authorization & Roles (5pt+)** — explicit per-endpoint role matrix.

### Scope Overview & Implementation Plan
- **Scope Overview (1pt+)** — 1–6 bullets. High-level scope for orientation BEFORE the detailed Implementation Plan. Each bullet = one meaningful chunk of work, not a micro-step. Must match Implementation Plan phases.
- **Implementation Plan (1pt+ for non-infra tasks)** — each row is a Scrum engineering task (layer-level work, NOT a story). File paths must be **real paths** from Existing Code Context. `/implement` follows this exactly.
- **Subtasks** — every subtask checkbox = single action, 2–5 min. Never combine "write test AND implement." Format:
  ```
  - [ ] Write failing test for [AC] → [file path] → run: [test command]
  - [ ] Run test — confirm RED → [test command]
  - [ ] Implement minimal code → [file path]
  - [ ] Run test — confirm GREEN → [test command]
  - [ ] Commit: "test: add [X] tests"
  ```
- **Execution Slices + Plan Drift Guard (1pt+ for non-infra tasks)** — invoke `plan-driven-delivery` after drafting the Implementation Plan. It must:
  - collapse the plan into 1–7 `Execution Slices`,
  - name the ACs, files, proof, and exit evidence for each slice,
  - define when `/issue` is enough vs when the task must return to `/requirement`.

### Test Plans
- **TDD Test Plan (1pt+)** — min 1 planned test per AC; 2pt+ should usually include both unit and integration rows. Choose the **smallest sufficient test level first**. Written BEFORE code. Integration tests use real dependencies — no mocks.
- **E2E Test Plan (3pt+)** — cover the critical user journeys and cross-boundary smoke only. Do not mirror every low-level branch that should already be proven by unit/integration tests.
- **[BE]** TDD Test Plan must include 401, 403, 429, and validation error test cases.

### Non-Functional, Rollout, Open Items
- Fill per point level. At 5pt+ fill everything that applies; at 8pt add constraints + ADR entries.

---

## Step 2b — Coverage check vs discovery and ACs

```
Coverage check:
✅ AC-1: [FE component/BE endpoint] + unit [test name] + integration [test name] + E2E [scenario]
✅ AC-2: ...
⚠️ AC-N: missing TDD → adding to TDD Test Plan
⚠️ FE contract [GET /y]: no matching BE endpoint → adding endpoint
⚠️ Discovery goal [X]: not covered → adding AC
```

Fill every gap immediately. Do NOT silently drop in-scope items.

---

## Step 2c — Self-check before presenting

Re-read the full doc and verify:

**Universal:**
- [ ] Metadata filled: Task Type, Points, Status, and `Origin` when discovery context exists.
- [ ] No section required at this point level is empty, `TBD`, or placeholder.
- [ ] Every AC uses GIVEN/WHEN/THEN and is specific + testable.
- [ ] At least one failure-path AC exists.
- [ ] Every in-scope discovery item is either covered by an AC or explicitly Out of Scope.
- [ ] Success Metrics are measurable (not vague like "works correctly").
- [ ] **Metric instrumentation propagated** (per `.claude/rules/metric-instrumentation.md` Gate 2): for every sprint Success Metric whose Measurement column references THIS task, the doc has (a) an Implementation Plan row that produces the artifact (write the log line / add the column / fire the event), (b) an AC asserting the artifact is emitted, (c) a TDD Test Plan row verifying emission. If any leg is missing → block until fixed.
- [ ] Value: user impact + business outcome are filled, concrete, do NOT just restate the user story.
- [ ] Sections that don't apply to this Task Type are marked `N/A — [reason]`.
- [ ] `Execution Slices` exists for this non-infra task, with 1–7 rows, and every slice names ACs + files + proof + exit evidence.
- [ ] `Plan Drift Guard` clearly says what stays in `/issue` and what returns to `/requirement`.
- [ ] TDD rows use the smallest sufficient test level first (unit/integration before E2E when possible).
- [ ] E2E plan focuses on unique journeys/cross-layer proof, not a browser copy of every low-level case.

**If Task Type includes FE (2pt+):**
- [ ] State Inventory table: every interactive component appears, all 5 state cells filled or `N/A — [reason]`.
- [ ] State Transitions diagram exists for any component with > 2 states or async actions.
- [ ] Fail Case Matrix covers every user action that can fail (3pt+).

**If Task Type includes BE:**
- [ ] Every FE API contract has a matching BE endpoint (method, path, response shape).
- [ ] Error envelope + error codes defined.
- [ ] TDD includes 401/403/validation error cases per endpoint (2pt+).

**Implementation Plan (all non-infra tasks):**
- [ ] Every AC has at least one planned test in TDD Test Plan.
- [ ] Every file path in Implementation Plan is a real path from Existing Code Context.
- [ ] Every subtask is a single action (2–5 min).
- [ ] Scope Overview: 1–6 bullets, each maps to at least one phase. No orphan bullet, no orphan phase.
- [ ] Every slice maps to at least one Implementation Plan row; no orphan slice, no orphan phase.

**Plan size advisory (5pt+):**
- [ ] If `Points >= 5` and no `docs/sprints/[sprint-id]/[task-id]/[task-id]-plan.md` exists, print to the user:
  ```
  ⚠ Story is [N]pt — strongly recommend running /write-plan [task-id] before /implement
  for an explicit subagent-driven plan. Skip only if scope is exceptionally well-understood.
  ```
  Advisory only — does not block proceeding.

Fix any issue found. Re-read affected sections before presenting.

---

## Step 3 — Present for confirmation

<HARD-GATE>
DO NOT save the doc until the user explicitly confirms. Wait for "confirm" or edits.
</HARD-GATE>

Print the full drafted doc, then ask:
```
Does this look right?
Add/remove ACs, adjust design sections or implementation plan, or say 'confirm' to save as-is.
```
Wait for response. Apply any edits.

---

## Step 4 — Save and update status

1. Create `docs/sprints/[sprint-id]/[task-id]/` if not exists.
2. Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`.
3. Update task status in `docs/BACKLOG.md` to `in-progress` if it was `todo`.

---

## Output

```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md
  Task Type: [fullstack/fe-only/be-only/infra]
  Points: [N]

ACs: AC-1: [summary]  |  AC-2: [summary]  |  ...
Execution slices: S1: [goal]  |  S2: [goal]

TDD Test Plan — write these failing tests BEFORE implementing:
[print TDD test plan rows]

Next: /implement [task-id]
```

Optional skills:
- `/adr [task-id] [title]` — record a non-trivial design decision before implementing.
- `/db-schema-review [task-id]` — review schema before writing any code (BE tasks).
