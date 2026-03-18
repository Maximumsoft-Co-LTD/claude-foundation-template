# /plan-task
Workflow position: **/new-sprint → START → /fe-design**

Add a sub-task to an existing sprint. Use when a sprint already exists and a task needs to be added that wasn't in the original breakdown.
Arguments: $ARGUMENTS
Format: `[sprint-id] [task-id] [task-name]`  — e.g. `sprint-02 task-005 password-reset-flow`

---

## Step 1 — Validate

1. Parse `[sprint-id]`, `[task-id]`, `[task-name]` from `$ARGUMENTS`.
2. Check `docs/sprints/[sprint-id]/` exists. If not → stop: "Sprint does not exist. Run `/new-sprint [sprint-id] \"[description]\"` first."
3. Check `docs/BACKLOG.md` — if `[task-id]` already exists in this sprint → stop and warn.

---

## Step 2 — Load sprint context

Read `docs/sprints/[sprint-id]/[sprint-id]-overview.md` to understand the epic goals, scope, and existing sub-tasks. Use this context when pre-filling the new task files.

---

## Step 3 — Scaffold task files

1. Create `docs/sprints/[sprint-id]/[task-id]/`
2. Create 3 files from templates, replacing ALL placeholders:
   - `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` from `docs/REQUIREMENT-TEMPLATE.md`
     - Pre-fill: Sprint = `[sprint-id]`, Status = `todo`
   - `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` from `docs/FRONTEND-DESIGN-TEMPLATE.md`
     - Pre-fill: Requirement = `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
   - `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` from `docs/BACKEND-DESIGN-TEMPLATE.md`
     - Pre-fill: Requirement = `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`

---

## Step 4 — Update docs

1. Add `[task-id]` row to the Sub-tasks table in `docs/sprints/[sprint-id]/[sprint-id]-overview.md`.
2. Add `[task-id]` row to the sprint section in `docs/BACKLOG.md` with status `todo`.

---

## Step 5 — Output

```
✓ Task scaffolded:
  docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md
  docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md
  docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md

Next steps:
  1. Fill in [task-id]-requirement.md (Problem Statement, ACs, Success Metrics)
  2. /fe-design [sprint-id] [task-id]
  3. /be-design [sprint-id] [task-id]
```
