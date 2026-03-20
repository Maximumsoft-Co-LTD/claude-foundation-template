# /run-tasks
Workflow position: **/new-sprint → START → /git-commit (per task)**

Run multiple tasks through the full workflow in parallel.
Each phase runs all eligible tasks simultaneously via sub-agents before advancing to the next phase.
Arguments: $ARGUMENTS
Format: `[task-id] [task-id] ...`  — e.g. `SP1-T001 SP1-T002 SP1-T003`

---

## Step 1 — Parse, validate, and register all tasks

1. Parse all `[task-id]` values from `$ARGUMENTS`. Extract `[sprint-id]` from each prefix.
2. Read `docs/BACKLOG.md` — for each task collect: status, `depends_on` (if present), priority.
3. If a task's status is `done` or `in-progress` → warn and skip it unless it's explicitly re-runnable.

**Build dependency order:**
- Tasks with no `depends_on` (or whose dependencies are already `done`) are **Tier 1** — run first.
- Tasks that depend on Tier 1 tasks are **Tier 2** — run after Tier 1 completes all phases (retro-task done).
- (Continue for deeper dependency chains.)

**Register workflow tasks using TaskCreate — store all returned IDs:**

For each `[task-id]`, create one task per phase:

```
For each [task-id]:
  p_req[task-id]    = TaskCreate(subject: "[task-id] — requirement",  description: "Run /requirement for [task-id]")
  p_fe[task-id]     = TaskCreate(subject: "[task-id] — fe-design",    description: "Run /fe-design for [task-id]")
  p_be[task-id]     = TaskCreate(subject: "[task-id] — be-design",    description: "Run /be-design for [task-id]")
  p_impl[task-id]   = TaskCreate(subject: "[task-id] — implement",    description: "Run /implement for [task-id]")
  p_rev[task-id]    = TaskCreate(subject: "[task-id] — code-review",  description: "Run /code-review for [task-id]")
  p_test[task-id]   = TaskCreate(subject: "[task-id] — testing",      description: "Run /testing for [task-id]")
  p_retro[task-id]  = TaskCreate(subject: "[task-id] — retro-task",   description: "Run /retro-task for [task-id]")
```

Wire per-task phase dependencies:
```
For each [task-id]:
  TaskUpdate(p_fe[task-id],   addBlockedBy: [p_req[task-id]])
  TaskUpdate(p_be[task-id],   addBlockedBy: [p_fe[task-id]])
  TaskUpdate(p_impl[task-id], addBlockedBy: [p_be[task-id]])
  TaskUpdate(p_rev[task-id],  addBlockedBy: [p_impl[task-id]])
  TaskUpdate(p_test[task-id], addBlockedBy: [p_rev[task-id]])
  TaskUpdate(p_retro[task-id],addBlockedBy: [p_test[task-id]])
```

Wire cross-task Tier dependencies:
```
For each Tier 2 [task-id] that depends on a Tier 1 [dep-id]:
  TaskUpdate(p_req[task-id], addBlockedBy: [p_retro[dep-id]])
```

**Output task plan:**
```
Tasks to run: [N]

Tier 1 (parallel): SP1-T001, SP1-T002
Tier 2 (after Tier 1): SP1-T003  (depends_on: SP1-T001)

Phases: requirement → fe-design → be-design → implement → code-review → testing → retro-task
```

---

## Step 2 — Phase: Requirement

Call `TaskList` to confirm which `[task-id] — requirement` tasks are unblocked (no blockedBy).

For each Tier (in order), launch **parallel sub-agents** — one per task in the tier:

- `TaskUpdate(p_req[task-id], status: in_progress)`
- Launch `Agent [task-id] — Requirement` (run_in_background: true):
  > Read `.claude/commands/requirement.md` first, then follow every step exactly for `[task-id]`.
  > Save output to `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`.
  > Return: DONE or BLOCKED (with reason).

Wait for **all agents in the current tier** to complete before starting the next tier.

On result:
- DONE → `TaskUpdate(p_req[task-id], status: completed)`
- BLOCKED → `TaskUpdate(p_req[task-id], status: completed)` with note, mark task as blocked in BACKLOG.md, skip remaining phases

**Phase checkpoint:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase: Requirement — complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ SP1-T001 — [Task Title]
  ✓ SP1-T002 — [Task Title]
  ✗ SP1-T003 — BLOCKED: [reason]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- If any task is BLOCKED → pause that task. Continue remaining tasks through all phases.

---

## Step 3 — Phase: FE Design

Call `TaskList` to confirm which `[task-id] — fe-design` tasks are unblocked (no blockedBy).

For each Tier (in order), launch **parallel sub-agents** — one per task in the tier:

- `TaskUpdate(p_fe[task-id], status: in_progress)`
- Launch `Agent [task-id] — FE Design` (run_in_background: true):
  > Read `.claude/commands/fe-design.md` first, then follow every step exactly for `[task-id]`.
  > Save output to `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`.
  > Return: DONE or BLOCKED (with reason).

Wait for **all agents in the current tier** to complete before starting the next tier.

On result:
- DONE → `TaskUpdate(p_fe[task-id], status: completed)`
- BLOCKED → `TaskUpdate(p_fe[task-id], status: completed)` with note, mark task as blocked in BACKLOG.md, skip remaining phases

**Phase checkpoint:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase: FE Design — complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ SP1-T001 — [Task Title]
  ✓ SP1-T002 — [Task Title]
  ✗ SP1-T003 — BLOCKED: [reason]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- If any task is BLOCKED → pause that task. Continue remaining tasks through all phases.

---

## Step 4 — Phase: BE Design

Call `TaskList` to confirm which `[task-id] — be-design` tasks are now unblocked.

For each unblocked task per tier, launch **parallel sub-agents**:

- `TaskUpdate(p_be[task-id], status: in_progress)`
- Launch `Agent [task-id] — BE Design` (run_in_background: true):
  > Read `.claude/commands/be-design.md` first, then follow every step exactly for `[task-id]`.
  > Save output to `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`.
  > Return: DONE or BLOCKED (with reason).

On result:
- DONE → `TaskUpdate(p_be[task-id], status: completed)`
- BLOCKED → mark task as blocked in BACKLOG.md, skip remaining phases

Print phase checkpoint after all tiers complete.

---

## Step 5 — Phase: Implement

Call `TaskList` to confirm which `[task-id] — implement` tasks are unblocked.

For each unblocked task per tier, launch **parallel sub-agents**:

- `TaskUpdate(p_impl[task-id], status: in_progress)`
- Launch `Agent [task-id] — Implement` (run_in_background: true):
  > Read `.claude/commands/implement.md` first, then follow every step exactly for `[task-id]`.
  > This includes the pre-implementation readiness check, writing failing tests first, then implementing until all pass.
  > Return: DONE, ISSUES_FOUND (list issues), or BLOCKED (reason).

Wait for all agents per tier before advancing.

On result:
- DONE → `TaskUpdate(p_impl[task-id], status: completed)`
- ISSUES_FOUND → run `/issue [task-id] [description]` for each issue, then `TaskUpdate(p_impl[task-id], status: completed)`
- BLOCKED → mark task as blocked in BACKLOG.md, skip remaining phases

Print phase checkpoint after all tiers complete.

---

## Step 6 — Phase: Code Review

Call `TaskList` to confirm which `[task-id] — code-review` tasks are unblocked.

For each unblocked task per tier, launch **parallel sub-agents**:

- `TaskUpdate(p_rev[task-id], status: in_progress)`
- Launch `Agent [task-id] — Code Review` (run_in_background: true):
  > Read `.claude/commands/code-review.md` first, then follow every step exactly for `[task-id]`.
  > Return: APPROVED or REQUEST_CHANGES (list critical issues).

On result:
- APPROVED → `TaskUpdate(p_rev[task-id], status: completed)`
- REQUEST_CHANGES → run `/issue [task-id] [description]` for each critical issue, re-run implement agent for that task, then `TaskUpdate(p_rev[task-id], status: completed)`

Print phase checkpoint:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase: Code Review — complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ SP1-T001 — APPROVED
  ✓ SP1-T002 — APPROVED
  ~ SP1-T003 — REQUEST CHANGES → issues filed, re-implementing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 7 — Phase: Testing

Call `TaskList` to confirm which `[task-id] — testing` tasks are unblocked.

For each unblocked task per tier, launch **parallel sub-agents**:

- `TaskUpdate(p_test[task-id], status: in_progress)`
- Launch `Agent [task-id] — Testing` (run_in_background: true):
  > Read `.claude/commands/testing.md` first, then follow every step exactly for `[task-id]`.
  > Return: ALL_PASS, FAILING (list failing tests), or MISSING_COVERAGE (list ACs).

On result:
- ALL_PASS → `TaskUpdate(p_test[task-id], status: completed)`
- FAILING or MISSING_COVERAGE → fix and re-run within the same agent. If non-trivial, run `/issue [task-id] [description]`. Then `TaskUpdate(p_test[task-id], status: completed)`.

Print phase checkpoint after all tiers complete.

---

## Step 8 — Phase: Retro Task

Call `TaskList` to confirm which `[task-id] — retro-task` tasks are unblocked.

For each unblocked task per tier, launch **parallel sub-agents**:

- `TaskUpdate(p_retro[task-id], status: in_progress)`
- Launch `Agent [task-id] — Retro` (run_in_background: true):
  > Read `.claude/commands/retro-task.md` first, then follow every step exactly for `[task-id]`.
  > Save output to `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`.
  > Update BACKLOG.md status to `done`.
  > Return: DONE.

On result:
- DONE → `TaskUpdate(p_retro[task-id], status: completed)`

---

## Step 9 — Final summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/run-tasks complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ SP1-T001 — done  (all phases passed)
  ✓ SP1-T002 — done  (all phases passed)
  ✓ SP1-T003 — done  (1 issue filed, resolved)
  ✗ SP1-T004 — blocked at [phase]: [reason]

Issues filed this run: [N total]
  - SP1-T003: [issue summary]

Next steps:
  All tasks done     → /git-commit [task-id]  (run per task)
  Blocked tasks      → resolve manually, then re-run /run-tasks [blocked-task-id]
  All sprint done    → /retro-sprint [sprint-id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
