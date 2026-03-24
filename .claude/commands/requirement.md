# /requirement
Workflow position: **/new-sprint → START → /fe-design**

Write the requirement doc for a task. Run BEFORE `/fe-design` or `/be-design`.
Arguments: `[task-id]`  — e.g. `SP1-T001`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read in order:
1. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals, sub-task table, E2E scenarios, dependencies
2. `docs/discovery/` — scan for related discovery doc. If found, read: Problem Statement, goals, in-scope, constraints, open questions.

From the sprint overview sub-task table, extract: task title, E2E scenario, dependencies, **Points**.

**Points-based section scope** (write `"N/A — Xpt task"` for sections not required):

| Points | Required sections |
|--------|------------------|
| **1pt** | Problem Statement, Acceptance Criteria (min 2–3), Out of Scope, Definition of Done |
| **2pt** | + User Stories, Dependencies |
| **3pt** | + Feature Flow (mermaid), System Behavior, Data & Business Rules, Success Metrics |
| **5pt+** | All sections — full doc |
| **8pt** | All sections + extra edge cases and constraints |

Read existing draft if present: `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
Read `docs/templates/REQUIREMENT-TEMPLATE.md` to ensure all sections are covered.


---

## Step 2 — Draft the requirement doc

- **Problem Statement** — from discovery doc if available; otherwise from epic Problem Statement scoped to this task.
- **Overview** — one paragraph from the E2E scenario.
- **User Stories** — "As a [role], I want [goal], so that [reason]." At least one per distinct user action.
- **Acceptance Criteria** — rules:
  - Specific, testable, user-visible. Format: "Given [context], when [action], then [outcome]."
  - Cover: happy path, at least one failure path, boundary conditions.
  - Minimum 3 ACs. Every AC maps to at least one E2E test.
- **Success Metrics** — 2–3 measurable metrics aligned with sprint goals.
- **Design References** — from discovery/sprint overview or placeholder.
- **Analytics & Tracking** — events aligned with ACs (e.g. `[action]_completed` per key AC).
- **Out of Scope** — explicitly list anything in discovery/overview NOT part of this task.
- **Dependencies** — task IDs from sprint overview + external services/decisions.


---

## Step 2b — Coverage check vs discovery

If a discovery doc was found, cross-check drafted ACs:
- **Goals** — which AC covers each Goal/Success Metric? Flag uncovered.
- **In-scope items** — which AC covers each? Flag uncovered.
- **User journeys** — which AC delivers each relevant To-Be journey? Flag uncovered.

```
Coverage check:
✅ Covered:    [item] → AC-N
⚠️ Not covered → adding AC-N: [description]
➖ Out of scope: [item] — reason: [why]
```
Add an AC or mark out-of-scope for every uncovered item. Do NOT silently drop in-scope items.


---

## Step 3 — Present for confirmation

Print the full drafted requirement doc, then ask:
```
Does this requirement look right?
Add/remove ACs, adjust stories/metrics, or say 'confirm' to save as-is.
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

ACs: AC-1: [summary]  |  AC-2: [summary]  |  ...

Next: /fe-design [task-id]
```
