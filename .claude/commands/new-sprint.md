# /new-sprint
Workflow position: **/discovery → START → /plan-task or /fe-design**

Create a new sprint from an epic description and scaffold all sub-tasks.
Arguments: $ARGUMENTS
Format: `[sprint-id] [epic description]`  — e.g. `sprint-02 Build user authentication with OAuth and role management`

---

## Step 1 — Validate

1. Parse `[sprint-id]` and `[epic description]` from `$ARGUMENTS`.
2. Read `docs/BACKLOG.md` — if `[sprint-id]` already exists, stop and warn the user.
3. Check `docs/discovery/` for any discovery doc related to this epic. If found, read it for context (Problem Statement, chosen approach, scope estimate, constraints).

---

## Step 2 — Create the sprint directory and overview

1. Create directory `docs/sprints/[sprint-id]/`.
2. Create `docs/sprints/[sprint-id]/[sprint-id]-overview.md` from `docs/SPRINT-OVERVIEW-TEMPLATE.md`.
3. Pre-fill:
   - Sprint ID, epic title (derived from description)
   - Start Date: today
   - Problem Statement: from epic description (or discovery doc if available)
   - Design References: from discovery doc if available
   - Status: `planning`

---

## Step 3 — Propose sub-task breakdown

Analyze the epic and propose a breakdown. Rules:
- Each sub-task is completable by one person in 1–3 days.
- Separate FE-only, BE-only, and fullstack concerns.
- Identify dependencies (which tasks must be done first).
- Propose 3–8 tasks depending on epic size.
- Order tasks so dependencies are respected.

Present the breakdown:

```
Proposed sub-tasks for [sprint-id] — [epic title]:

| Task ID  | Title                  | Type      | Depends On | Est. |
|----------|------------------------|-----------|------------|------|
| task-001 |                        | backend   | —          | 1d   |
| task-002 |                        | frontend  | task-001   | 2d   |
| task-003 |                        | fullstack | task-001   | 2d   |
```

Ask: "Does this breakdown look right? You can rename tasks, add/remove rows, or say 'confirm' to scaffold all."

---

## Step 4 — Scaffold (after user confirms)

For each confirmed task:
1. Create `docs/sprints/[sprint-id]/[task-id]/`
2. Create 3 files from templates, replacing ALL placeholders:
   - `[task-id]-requirement.md` from `docs/REQUIREMENT-TEMPLATE.md`
     - Pre-fill: Sprint = `[sprint-id]`, Status = `todo`
   - `[task-id]-frontend.md` from `docs/FRONTEND-DESIGN-TEMPLATE.md`
     - Pre-fill: Requirement link = `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
   - `[task-id]-backend.md` from `docs/BACKEND-DESIGN-TEMPLATE.md`
     - Pre-fill: Requirement link = `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`

---

## Step 5 — Update docs

1. Fill the Sub-tasks table in `[sprint-id]-overview.md` with the confirmed list.
2. Add a new sprint section to `docs/BACKLOG.md`:

```markdown
## [sprint-id] — [Epic Title]
> `docs/sprints/[sprint-id]/[sprint-id]-overview.md`

| Task | Title | Depends On | Status | Priority | Assigned |
|------|-------|------------|--------|----------|----------|
| task-001 | ... | — | `todo` | — | — |
```

---

## Step 6 — Output

```
✓ Sprint created: docs/sprints/[sprint-id]/[sprint-id]-overview.md
✓ [N] sub-tasks scaffolded

Next steps:
  1. Fill in each [task-id]-requirement.md (Problem Statement, ACs, Success Metrics)
  2. Run /next-task to begin working through tasks in order
```
