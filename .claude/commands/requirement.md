# /requirement
Workflow position: **/new-sprint → START → /fe-design**

Write the requirement doc for a task by reading the sprint context and proposing ACs for user confirmation. Run this BEFORE `/fe-design` or `/be-design`.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T001`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Register all steps with TaskCreate — store the returned IDs:

```
t1 = TaskCreate(subject: "[task-id] — load context",             description: "Read sprint overview, discovery doc, and existing requirement draft")
t2 = TaskCreate(subject: "[task-id] — draft requirement doc",    description: "Draft complete requirement doc including ACs, user stories, and success metrics")
t3 = TaskCreate(subject: "[task-id] — present for confirmation", description: "Show drafted requirement to user and apply edits")
t4 = TaskCreate(subject: "[task-id] — save + update status",     description: "Save confirmed requirement doc and update task status in BACKLOG.md")
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
2. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals, sub-task table, E2E scenarios, dependencies
3. `docs/discovery/` — scan for any discovery doc related to this sprint's epic. If found, read it for: Problem Statement, goals, in-scope items, constraints, open questions.

Locate the task row in the sprint overview sub-task table. Extract:
- Task title
- E2E scenario (one-sentence description from the table)
- Dependencies (other task IDs this task depends on)

Read current draft (if exists):
4. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
5. `docs/templates/REQUIREMENT-TEMPLATE.md` — ensure all sections will be covered

```
TaskUpdate(t1, status: completed)
```

---

## Step 2 — Propose the requirement doc

```
TaskUpdate(t2, status: in_progress)
```

Using the context gathered, draft a complete requirement doc:

- **Problem Statement** — from discovery doc if available; otherwise derive from the epic's Problem Statement in the sprint overview, scoped to this specific task.
- **Overview** — one paragraph summarizing what this task delivers, derived from the E2E scenario.
- **User Stories** — derive from the E2E scenario. Format: "As a [role], I want [goal], so that [reason]." Write at least one per distinct user action in the scenario.
- **Acceptance Criteria** — propose ACs based on the E2E scenario from the sprint overview. Rules:
  - Each AC must be specific, testable, and user-visible (observable from the browser/client).
  - Format: "Given [context], when [user action], then [observable outcome]."
  - Cover: the happy path, at least one failure/error path, and any boundary condition implied by the scenario.
  - Every AC must map to at least one E2E test scenario.
  - Minimum 3 ACs; cover all steps in the E2E scenario.
- **Success Metrics** — propose 2–3 measurable metrics aligned with the sprint's goals.
- **Design References** — copy from discovery doc or sprint overview if available; otherwise leave placeholder.
- **Analytics & Tracking** — propose events aligned with ACs (e.g. `[action]_completed` per key AC).
- **Out of Scope** — explicitly list anything mentioned in the discovery or sprint overview that is NOT part of this task.
- **Dependencies** — list dependent task IDs from the sprint overview, plus any external services or decisions.

```
TaskUpdate(t2, status: completed)
```

---

## Step 3 — Present for confirmation

```
TaskUpdate(t3, status: in_progress)
```

Print the full drafted requirement doc, then ask:

```
Does this requirement look right?
  - Confirm ACs or edit them before I save.
  - You can add/remove ACs, rename user stories, adjust metrics, or say 'confirm' to save as-is.
```

Wait for the user's response. Apply any edits they request.

```
TaskUpdate(t3, status: completed)
```

---

## Step 4 — Save and update status

```
TaskUpdate(t4, status: in_progress)
```

1. Create directory `docs/sprints/[sprint-id]/[task-id]/` if it does not exist.
2. Save the confirmed requirement to `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`.
3. Update task status in `docs/BACKLOG.md` to `in-progress` if it was `todo`.

```
TaskUpdate(t4, status: completed)
```

---

## Step 5 — Output

```
✓ Requirement saved: docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md

ACs defined:
  AC-1: [summary]
  AC-2: [summary]
  ...

Next step: /fe-design [task-id]
```
