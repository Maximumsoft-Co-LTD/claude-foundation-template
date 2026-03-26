# /retro-task
Workflow position: **/testing → START → /git-commit**

Write a retrospective for a completed task and mark it done.
Run after every task. Run `/retro-sprint` only after ALL tasks in a sprint are done.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — original estimate, ACs
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (if exists) — bugs encountered

Run `git log --oneline` and identify commits for this task.

---

## Step 2 — Calculate estimate vs actual

- **Estimated**: from Estimate field in requirement doc metadata.
- **Actual**: count days from first to last commit for this task.
- **Variance**: note if >50% off.


---

## Step 3 — Write the retrospective

Fill `docs/templates/RETRO-TASK-TEMPLATE.md` with the data from Steps 1–2. Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`.


---

## Step 4 — Update BACKLOG.md and surface learnings

1. Change task status to `done` in its sprint table.
2. Add to the **Done** table at the bottom with today's date and sprint.
3. If "Knowledge sharing" section has any non-empty items → note them in the retro doc. CLAUDE.md updates are reviewed in `/retro-sprint` and `/brain-update` — do not prompt here.


---

## Step 5 — Check sprint completion

Read `docs/BACKLOG.md` — any tasks in `[sprint-id]` not yet `done`?
- Tasks remain → next step is `/git-commit`.
- ALL tasks done → note: "All tasks in [sprint-id] done. After committing, run `/retro-sprint [sprint-id]`."

---

## Output

```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md
✓ BACKLOG.md — [task-id] marked done

Next: /git-commit [task-id]
[If sprint complete]: Then → /retro-sprint [sprint-id]
```
