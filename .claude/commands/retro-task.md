# /retro-task
Workflow position: **/testing → START → /git-commit**

Write a retrospective for a completed task and mark it done.
Run after every task. Run `/retro-sprint` only after ALL tasks in a sprint are done.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`. Register sub-tasks (wire sequentially; mark in_progress/completed at each step):
```
t1 = TaskCreate("[task-id] — retro: load context")
t2 = TaskCreate("[task-id] — retro: calculate estimate vs actual")
t3 = TaskCreate("[task-id] — retro: write retrospective")
t4 = TaskCreate("[task-id] — retro: update BACKLOG.md")
t5 = TaskCreate("[task-id] — retro: check sprint completion")
```
Mark t1 in_progress.

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — original estimate, ACs
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (if exists) — bugs encountered

Run `git log --oneline` and identify commits for this task.
Mark t1 completed, t2 in_progress.

---

## Step 2 — Calculate estimate vs actual

- **Estimated**: from Estimate field in requirement doc metadata.
- **Actual**: count days from first to last commit for this task.
- **Variance**: note if >50% off.

Mark t2 completed, t3 in_progress.

---

## Step 3 — Write the retrospective

Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`:

```markdown
# [task-id] — [Task Title] — Retrospective
**Sprint:** [sprint-id]  |  **Date:** [today]  |  **Status:** done

## Estimate vs Actual
- Estimated: X days  |  Actual: Y days  |  Variance: +/- Z days [reason if >50%]

## What went well
-

## What could be improved
-

## Issues encountered
- [N total: X critical / Y major / Z minor]
- [one-line summary per issue]

## TDD effectiveness
- Tests written before implementation: yes / partially / no
- Bugs caught by tests before manual QA: [N]
- Gaps in TDD test plan: [list or "none"]

## Knowledge sharing
<!-- Things the team should know or that should go into CLAUDE.md -->
-

## Action items for next sprint
<!-- Concrete and specific — not generic advice -->
-
```

Mark t3 completed, t4 in_progress.

---

## Step 4 — Update BACKLOG.md and surface learnings

1. Change task status to `done` in its sprint table.
2. Add to the **Done** table at the bottom with today's date and sprint.
3. If "Knowledge sharing" section has any non-empty items → ask: "Add to CLAUDE.md? (yes / no)" and append to the relevant section if confirmed.

Mark t4 completed, t5 in_progress.

---

## Step 5 — Check sprint completion

Read `docs/BACKLOG.md` — any tasks in `[sprint-id]` not yet `done`?
- Tasks remain → next step is `/git-commit`.
- ALL tasks done → note: "All tasks in [sprint-id] done. After committing, run `/retro-sprint [sprint-id]`."

Mark t5 completed.

---

## Output

```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md
✓ BACKLOG.md — [task-id] marked done

Next: /git-commit [task-id]
[If sprint complete]: Then → /retro-sprint [sprint-id]
```
