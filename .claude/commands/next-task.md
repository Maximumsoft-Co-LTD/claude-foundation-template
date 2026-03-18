# /next-task
Workflow position: **/git-commit → START → /fe-design**

Load the next todo task and show full context. Run this after finishing a task to pick up the next one.
Arguments (optional): $ARGUMENTS
Format: `[sprint-id] [task-id]`  — both optional. If omitted, auto-selects the next todo.

---

## Step 1 — Read backlog and show sprint progress

Read `docs/BACKLOG.md` and print a progress summary for every active sprint:
```
sprint-01 — [Epic Title]: 2 done / 1 in-progress / 3 todo / 0 blocked  (6 total)
sprint-02 — [Epic Title]: 0 done / 0 in-progress / 5 todo / 0 blocked  (5 total)
```

---

## Step 2 — Determine target task

- **Both args given** (`sprint-id` + `task-id`) → use them directly.
- **Sprint only** → pick first `todo` task in that sprint.
- **No args** → pick first `todo` task scanning sprints top-to-bottom.
- **No todo tasks** anywhere:
  - List all `blocked` tasks and which issues file to check.
  - If every task in a sprint is `done` → check sprint-level Definition of Done in `[sprint-id]-overview.md`. If met, prompt: "Sprint complete — run `/retro [sprint-id]` for the sprint."
  - Ask the user what to do next.

---

## Step 3 — Load context

Read all files for the target task:
- `docs/sprints/[sprint-id]/[sprint-id]-overview.md` (epic context)
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (if exists)

---

## Step 4 — Output task context card

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

## Step 5 — Update status

If the task status was `todo`, update it to `in-progress` in `docs/BACKLOG.md`.

---

## Step 6 — Suggest next command

Based on readiness, output exactly ONE next step:

| Condition | Suggestion |
|-----------|------------|
| Requirement is empty | "Fill in `[task-id]-requirement.md` (Problem Statement, ACs, Success Metrics) then re-run `/next-task`" |
| FE design is empty | `/fe-design [sprint-id] [task-id]` |
| BE design is empty | `/be-design [sprint-id] [task-id]` |
| Both designs filled, no tests yet | "Write failing tests first (see TDD Test Plan in design docs), then implement" |
| Tests written, implementation in progress | "Continue implementing. Run `/issue [sprint-id] [task-id] [desc]` if you hit a bug." |
