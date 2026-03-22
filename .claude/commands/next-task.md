# /next-task
Workflow position: **/git-commit → START → /requirement**

Load the next todo task and show full context. Run after finishing a task to pick up the next one.
Arguments (optional): `[task-id]` — if omitted, auto-selects next todo.

---

## Step 1 — Reconcile statuses

Register sub-tasks (wire sequentially; mark in_progress/completed at each step):
```
t1 = TaskCreate("next-task — reconcile statuses")
t2 = TaskCreate("next-task — show sprint progress")
t3 = TaskCreate("next-task — determine target task")
t4 = TaskCreate("next-task — load task context")
t5 = TaskCreate("next-task — update status + suggest")
```
Mark t1 in_progress.

Read `docs/BACKLOG.md`. For each task NOT `todo` or `done`, check its doc files:
- `[task-id]-retro.md` exists → status should be `done`. Update if it isn't.
- Status is `review` or `testing` but no evidence → revert to `in-progress`.
- `[task-id]-requirement.md` has all ACs `✓` and no open issues → flag for user to confirm if `done`.

Write all corrections back to BACKLOG.md. Print any changes:
```
Status corrections:
  [task-id]: in-progress → done  (retro file found)
  [task-id]: review → in-progress  (no code review found)
```
Mark t1 completed, t2 in_progress.

---

## Step 2 — Show sprint progress

```
SP1 — [Epic Title]: 2 done / 1 in-progress / 3 todo / 0 blocked  (6 total)
SP2 — [Epic Title]: 0 done / 0 in-progress / 5 todo / 0 blocked  (5 total)
```
Mark t2 completed, t3 in_progress.

---

## Step 3 — Determine target task

- **`[task-id]` given** → use it directly.
- **No args** → pick first `todo` task (scan sprints top-to-bottom, respect `depends_on`).
- **No todo tasks** → list all `blocked` tasks + issues file. If all tasks in a sprint are `done` → prompt: "Sprint complete — run `/retro-sprint [sprint-id]`." Ask what to do next.

Mark t3 completed, t4 in_progress.

---

## Step 4 — Load context

Read for the target task:
- `docs/sprints/[sprint-id]/[sprint-id]-overview.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (if exists)

Mark t4 completed, t5 in_progress.

---

## Step 5 — Output task context card and suggest next command

If status was `todo` → update to `in-progress` in BACKLOG.md.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint : [sprint-id] — [Epic Title]
Task   : [task-id] — [Task Title]
Status : [status]  |  Priority: [priority]  |  Estimate: [X days]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Epic goal   : [one line from sprint Goals]
This task   : [Problem Statement from requirement]
Depends on  : [task-id or —]
Design refs : [Figma link or —]

Acceptance Criteria:
  ☐ AC-1: ...
  ☐ AC-2: ...

Readiness:
  Requirement : filled / empty
  FE design   : filled / empty
  BE design   : filled / empty
  Open issues : [N]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Suggest exactly ONE next step:

| Condition | Suggestion |
|-----------|------------|
| Requirement empty | `/requirement [task-id]` |
| FE design empty | `/fe-design [task-id]` |
| BE design empty | `/be-design [task-id]` |
| Both designs filled, no tests yet | "Write failing tests first (see TDD Test Plan), then implement" |
| Tests written, implementing | "Continue implementing. `/issue [task-id] [desc]` if you hit a bug." |

Mark t5 completed.
