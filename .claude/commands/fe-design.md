# /fe-design
Workflow position: **/next-task → START → /be-design**

Write the complete frontend design and TDD test plan for a task. Run this BEFORE writing any code.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Read these files in order:
2. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals and constraints
2. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs, success metrics, design references

Validate:
- If Acceptance Criteria are all empty → stop: "Fill in `[task-id]-requirement.md` first."
- If Design References (Figma) are present → note them. The design must match those mockups.

Read current draft:
3. `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`
4. `docs/templates/FRONTEND-DESIGN-TEMPLATE.md` — ensure all sections are covered

---

## Step 2 — Fill in the complete FE design

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

---

## Step 3 — Save and update status

1. Save the completed design to `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`.
2. Update task status in `docs/BACKLOG.md` to `in-progress` if it was `todo`.

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
