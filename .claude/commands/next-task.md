# /next-task
Workflow position: **/git-commit → START → /fe-design**

Load the next todo task and show full context. Run this after finishing a task to pick up the next one.
Arguments (optional): $ARGUMENTS
Format: `[task-id]`  — optional. If omitted, auto-selects the next todo.

---

## Step 1 — Reconcile and update all statuses

Register all steps with TaskCreate — store the returned IDs:

```
t1 = TaskCreate(subject: "next-task — reconcile statuses",      description: "Audit BACKLOG.md and correct any stale statuses based on existing doc files")
t2 = TaskCreate(subject: "next-task — show sprint progress",    description: "Print progress summary for every active sprint")
t3 = TaskCreate(subject: "next-task — determine target task",   description: "Select next todo task based on args or auto-select first unblocked todo")
t4 = TaskCreate(subject: "next-task — load task context",       description: "Read all doc files for the target task")
t5 = TaskCreate(subject: "next-task — update status + suggest", description: "Update task to in-progress and output next command suggestion")
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

Before picking the next task, audit the current state:

1. Read `docs/BACKLOG.md` — collect every task and its recorded status.
2. For each task that is NOT `todo` or `done`, read its latest doc files:
   - If `[task-id]-retro.md` exists → status should be `done`. Update if it isn't.
   - If `[task-id]-requirement.md` has all ACs marked `✓` and no open issues → flag for user to confirm if it should be `done`.
   - If status is `review` or `testing` but no code review / test run has occurred → revert to `in-progress`.
3. Write all corrections back to `docs/BACKLOG.md` before proceeding.

Output any corrections made:
```
Status corrections:
  [task-id]: in-progress → done  (retro file found)
  [task-id]: review → in-progress  (no code review doc found)
```

```
TaskUpdate(t1, status: completed)
```

---

## Step 2 — Read backlog and show sprint progress

```
TaskUpdate(t2, status: in_progress)
```

Read `docs/BACKLOG.md` and print a progress summary for every active sprint:
```
sprint-01 — [Epic Title]: 2 done / 1 in-progress / 3 todo / 0 blocked  (6 total)
sprint-02 — [Epic Title]: 0 done / 0 in-progress / 5 todo / 0 blocked  (5 total)
```

```
TaskUpdate(t2, status: completed)
```

---

## Step 3 — Determine target task

```
TaskUpdate(t3, status: in_progress)
```

- **`task-id` given** → use it directly (derive sprint from prefix).
- **No args** → pick first `todo` task scanning sprints top-to-bottom.
- **No todo tasks** anywhere:
  - List all `blocked` tasks and which issues file to check.
  - If every task in a sprint is `done` → check sprint-level Definition of Done in `[sprint-id]-overview.md`. If met, prompt: "Sprint complete — run `/retro-sprint [sprint-id]`."
  - Ask the user what to do next.

```
TaskUpdate(t3, status: completed)
```

---

## Step 4 — Load context

```
TaskUpdate(t4, status: in_progress)
```

Read all files for the target task:
- `docs/sprints/[sprint-id]/[sprint-id]-overview.md` (epic context)
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (if exists)

```
TaskUpdate(t4, status: completed)
```

---

## Step 5 — Output task context card

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint : [sprint-id] — [Epic Title]
Task   : [task-id] — [Task Title]
Status : [status]  |  Priority: [priority]  |  Estimate: [X days]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Epic goal   : [one line from sprint overview Goals]
This task   : [Problem Statement from requirement]
Depends on  : [task-id or —]
Design refs : [Figma link or —]

Acceptance Criteria:
  ☐ AC-1: ...
  ☐ AC-2: ...

Readiness:
  Requirement  : filled / empty
  FE design    : filled / empty
  BE design    : filled / empty
  Open issues  : [N]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 6 — Update status and suggest next command

```
TaskUpdate(t5, status: in_progress)
```

If the task status was `todo`, update it to `in-progress` in `docs/BACKLOG.md`.

Based on readiness, output exactly ONE next step:

| Condition | Suggestion |
|-----------|------------|
| Requirement is empty | `/requirement [task-id]` |
| FE design is empty | `/fe-design [task-id]` |
| BE design is empty | `/be-design [task-id]` |
| Both designs filled, no tests yet | "Write failing tests first (see TDD Test Plan in design docs), then implement" |
| Tests written, implementation in progress | "Continue implementing. Run `/issue [task-id] [desc]` if you hit a bug." |

```
TaskUpdate(t5, status: completed)
```
