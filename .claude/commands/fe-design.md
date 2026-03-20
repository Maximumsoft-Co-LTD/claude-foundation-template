# /fe-design
Workflow position: **/requirement → START → /be-design**

Write the complete frontend design and TDD test plan for a task. Run this BEFORE writing any code.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Register all steps with TaskCreate — store the returned IDs:

```
t1 = TaskCreate(subject: "[task-id] — fe: load context",           description: "Read sprint overview, discovery doc, requirement doc, and existing frontend design draft")
t2 = TaskCreate(subject: "[task-id] — fe: fill design",            description: "Write complete FE design, implementation plan, TDD test plan, and E2E test plan")
t3 = TaskCreate(subject: "[task-id] — fe: coverage check vs ACs",  description: "Cross-check design sections and test plans against every AC and discovery constraints")
t4 = TaskCreate(subject: "[task-id] — fe: save + update status",   description: "Save frontend design doc and update task status in BACKLOG.md")
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
2. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals and constraints
3. `docs/discovery/` — scan for any discovery doc related to this sprint's epic. If found, read it for: Problem Statement, goals, in-scope items, constraints (technical, UX, performance, accessibility), open questions.
4. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs, success metrics, design references

Validate:
- If Acceptance Criteria are all empty → stop: "Fill in `[task-id]-requirement.md` first."
- If Design References (Figma) are present → note them. The design must match those mockups.

Read the **Points** value from the requirement doc Metadata. Then apply the points-based section scope below. Write `"N/A — Xpt task"` for any section not required at this level:

| Points | Required sections |
|--------|------------------|
| **1pt** | Brief approach paragraph (replaces full doc narrative), Component list, 1 TDD test per AC |
| **2pt** | + Component Breakdown (table), API Contracts Consumed, State & Data Flow (brief), Fail State summary table |
| **3pt** | + UI/UX Overview, Loading & Skeleton States, Implementation Plan, E2E Test Plan, Fail Case Matrix |
| **5pt+** | All sections — User Journey Map, Behavior Mapping, Routing, Responsive, Analytics, Performance, full Fail Flows, Accessibility, State Inventory |
| **8pt** | All sections — add ADR entries for non-obvious design choices |

Read current draft:
4. `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`
5. `docs/templates/FRONTEND-DESIGN-TEMPLATE.md` — ensure all sections are covered

```
TaskUpdate(t1, status: completed)
```

---

## Step 2 — Fill in the complete FE design

```
TaskUpdate(t2, status: in_progress)
```

Write a complete, implementation-ready design for every section:

- **Design References** — copy Figma/mockup links from requirement; reference specific frames per screen.
- **UI/UX Overview** — describe every screen, modal, or user flow this task introduces or changes.
- **User Journey Map** — map the desired user journey (to-be state): step-by-step what the user does, sees, and feels. Define entry point and exit point of the flow.
- **Behavior Mapping** — must cover three things: (1) **Entry paths** — every way a user can arrive at this flow (direct nav, deep-link, redirect, back-navigation) and what pre-loaded state each entry carries; missing an entry path = missing integration with the main system. (2) **Behavior flow diagram** — map every interaction including all fail states: what the UI shows, what the user feels, and how they recover. Every fail branch must end in a labeled node (not just "error"). (3) **Fail state summary table** — quick reference of every fail state, what the user sees, and whether they can recover.
- **Routing & Navigation** — every new or changed route: path, component, auth required.
- **Component Breakdown** — every component to create or modify: name, file path, type (new/modify), description.
- **State & Data Flow** — show data path: `[API/Store] → [Container] → [Props] → [UI] → [Action] → [Dispatch]`.
- **API Contracts Consumed** — every endpoint called: method, path, request, response, error handling behavior.
- **Loading & Skeleton States** — for every async op: loading behavior, empty state, error state.
- **Responsive Behavior** — layout changes at mobile (<768px), tablet (768–1024px), desktop (>1024px).
- **Analytics Events** — every event to fire, mapped to Analytics section in requirement.
- **Performance Considerations** — lazy loading, memoization, code splitting, image optimization.
- **Implementation Plan** — ordered, step-by-step plan for how to implement this design. Each step must reference the design section it implements. Rules:
  - List steps in dependency order (what must be done before what).
  - Each step: `[N]. [File path] — [action: create/modify] — [what to implement] — [references: design section]`
  - Group by logical phase: (1) routing/scaffolding, (2) components, (3) state/data flow, (4) API integration, (5) loading/error states, (6) analytics, (7) accessibility/responsive. Not all phases apply to every task — omit phases that are not relevant.
  - This plan is the blueprint `/implement` follows. Do NOT deviate from it during implementation.
- **TDD Test Plan** — for EACH AC: at least 1 unit test + 1 integration test. Written BEFORE any code.
- **E2E Test Plan** — for EACH AC: at least 1 E2E scenario covering the full user journey (real browser → real API → real DB). Format: "Given [state] → When [user actions] → Then [observable outcome]." Written BEFORE any code.
- **Fail Cases & Fail Flows** — for every user action that can fail:
  - Draw the fail flow diagram showing all failure paths and how the user recovers.
  - Fill the Fail Case Matrix: for each failure scenario define — presentation pattern (toast/inline/modal/page-level), exact error message copy shown to the user (safe, friendly, actionable), recovery CTA text and placement, whether input is preserved.
  - Define Optimistic Update Rollback if the feature updates UI before API confirmation.
  - Define Partial Success Handling if the flow has batch or multi-part operations.
  - Define Multi-step Rollback if the flow has a wizard or sequential steps.
- **Edge Cases & Error States** — network timeout, 401, 500, empty list, session expiry, concurrent edits.
- **Accessibility Notes** — keyboard nav, focus management, ARIA labels, color contrast.

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
   - Is there a component / flow / behavior in the design that implements it?
   - Is there at least 1 TDD test in the TDD Test Plan?
   - Is there at least 1 E2E scenario in the E2E Test Plan?
   - Flag any AC missing any of the three.

2. **Discovery constraints coverage** — if a discovery doc was found, for each constraint listed (technical, UX, performance, accessibility):
   - Is it addressed in a relevant design section (Responsive Behavior, Performance Considerations, Accessibility Notes, etc.)?
   - Flag any constraint with no design section addressing it.

Present the coverage summary:

```
FE Coverage check:

✅ Covered
  - AC-1: component [X] + TDD test [Y] + E2E [Z]
  - ...

⚠️ Gaps found — updating design:
  - AC-N: missing TDD test → adding to TDD Test Plan
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

1. Save the completed design to `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`.
2. Update task status in `docs/BACKLOG.md` to `in-progress` if it was `todo`.

```
TaskUpdate(t4, status: completed)
```

---

## Step 4 — Output

Print both test plan tables, then:
```
✓ FE design saved: docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md

TDD Test Plan — write these failing tests BEFORE implementing:
[print the TDD test plan table]

E2E Test Plan — write these E2E scenarios BEFORE implementing:
[print the E2E test plan table]

Next step: /be-design [task-id]
```
