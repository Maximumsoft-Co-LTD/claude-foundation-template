# /retro-task
Workflow position: **/testing → START → /git-commit**

Write a retrospective for a single completed task and mark it done.
Run this after every task. Run /retro-sprint only after ALL tasks in a sprint are done.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Register all steps with TaskCreate — store the returned IDs:

```
t1 = TaskCreate(subject: "[task-id] — retro: load context",               description: "Read requirement, design docs, issues file, and git log for this task")
t2 = TaskCreate(subject: "[task-id] — retro: calculate estimate vs actual",description: "Compare estimated days from requirement to actual days from git log")
t3 = TaskCreate(subject: "[task-id] — retro: write retrospective",        description: "Write retro doc using template and save to [task-id]-retro.md")
t4 = TaskCreate(subject: "[task-id] — retro: update BACKLOG.md",          description: "Change task status to done and add to Done table")
t5 = TaskCreate(subject: "[task-id] — retro: check sprint completion",    description: "Check if all tasks in sprint are done; prompt for /retro-sprint if so")
```

Wire dependencies:
```
TaskUpdate(t2, addBlockedBy: [t1])
TaskUpdate(t3, addBlockedBy: [t2])
TaskUpdate(t4, addBlockedBy: [t3])
TaskUpdate(t5, addBlockedBy: [t4])
```

```
TaskUpdate(t1, status: in_progress)
```

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — original estimate, ACs
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (if exists) — bugs encountered

Run: `git log --oneline` and identify commits for this task.

```
TaskUpdate(t1, status: completed)
```

---

## Step 2 — Calculate estimate vs actual

```
TaskUpdate(t2, status: in_progress)
```

- **Estimated**: from the Estimate field in `[task-id]-requirement.md` metadata.
- **Actual**: count days from first commit to last commit for this task.
- **Variance**: calculate and note if significantly off (>50%).

```
TaskUpdate(t2, status: completed)
```

---

## Step 3 — Write the retrospective

```
TaskUpdate(t3, status: in_progress)
```

Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md` using `docs/templates/RETRO-TASK-TEMPLATE.md` as the structure:

```markdown
# [task-id] — [Task Title] — Retrospective

**Sprint:** [sprint-id]
**Date:** [today]
**Status:** done

## Estimate vs Actual
- **Estimated:** X days
- **Actual:** Y days
- **Variance:** +/- Z days — [reason if >50% off]

## What went well
-

## What could be improved
-

## Issues encountered
- [N total: X critical / Y major / Z minor]
- [one-line summary per issue from issues file]

## TDD effectiveness
- Tests written before implementation: yes / partially / no
- Bugs caught by tests before manual QA: [N]
- Gaps found in TDD test plan: [list or "none"]

## Knowledge sharing
<!-- Things learned that the team should know or that should go into CLAUDE.md -->
-

## Action items for next sprint
<!-- Concrete, specific items — not generic advice -->
-
```

```
TaskUpdate(t3, status: completed)
```

---

## Step 4 — Update BACKLOG.md

```
TaskUpdate(t4, status: in_progress)
```

1. Change task status to `done` in its sprint table.
2. Add to the **Done** table at the bottom with today's date and sprint.

```
TaskUpdate(t4, status: completed)
```

---

## Step 5 — Check sprint completion

```
TaskUpdate(t5, status: in_progress)
```

After marking this task done, read `docs/BACKLOG.md` and count remaining tasks in `[sprint-id]`:
- If tasks with status other than `done` still exist → next step is `/git-commit`.
- If ALL tasks in this sprint are now `done` → add a note:
  > "All tasks in [sprint-id] are done. After committing, run `/retro-sprint [sprint-id]`."

```
TaskUpdate(t5, status: completed)
```

---

## Step 6 — Output

```
✓ Retro saved: docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md
✓ BACKLOG.md updated — [task-id] marked done

Next step: /git-commit [task-id]
[If sprint complete]: Then → /retro-sprint [sprint-id]
```
