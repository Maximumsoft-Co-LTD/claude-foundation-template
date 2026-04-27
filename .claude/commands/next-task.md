# /next-task
Workflow position: **standalone — use when resuming work or jumping to a specific task**

Jump to a specific task or resume the sprint mid-session. The standard post-commit flow runs this automatically inside `/git-commit` Step 9 — use `/next-task` only when you need to jump out of sequence.

Arguments (optional): `[task-id]` — if omitted, auto-selects next todo.

---

Run the full next-task flow from `/git-commit` Step 9:

1. **Reconcile statuses** — read `docs/BACKLOG.md`, check each non-terminal task against its doc files. Correct any stale statuses, print changes.
2. **Show sprint progress** — `SP1: 2 done / 1 in-progress / 3 todo / 0 blocked`
3. **Pick task** — use `[task-id]` if given; otherwise first `todo` respecting `depends_on`. If all done → "Sprint complete — run `/retro-sprint [sprint-id]`."
4. **Load context** — read sprint overview, unified requirement doc, issues docs for target task.
5. **Output context card + suggest ONE next step** — update status to `in-progress`, print task card, suggest: requirement missing or ACs/Implementation Plan empty → `/requirement`, requirement complete → `/implement`.

