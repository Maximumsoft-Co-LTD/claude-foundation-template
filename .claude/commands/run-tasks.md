# /run-tasks
Workflow position: **/new-sprint → START → /git-commit (per task)**

Run multiple tasks through the full workflow in parallel.
Each phase runs all eligible tasks simultaneously via sub-agents before advancing to the next phase.
Arguments: $ARGUMENTS
Format: `[task-id] [task-id] ...`  — e.g. `SP1-T001 SP1-T002 SP1-T003`

---

## Step 1 — Parse and validate all tasks

1. Parse all `[task-id]` values from `$ARGUMENTS`. Extract `[sprint-id]` from each prefix.
2. Read `docs/BACKLOG.md` — for each task collect: status, `depends_on` (if present), priority.
3. Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` for each task.

**Validate:**
- If any task's Acceptance Criteria are all empty → stop:
  > "Fill in `[task-id]-requirement.md` before running /run-tasks."
- If a task's status is `done` or `in-progress` → warn and skip it unless it's explicitly re-runnable.

**Build dependency order:**
- Sort tasks so those with `depends_on` run after the tasks they depend on.
- Tasks with no `depends_on` (or whose dependencies are already `done`) are **Tier 1** — run first.
- Tasks that depend on Tier 1 tasks are **Tier 2** — run after Tier 1 completes each phase.
- (Continue for deeper dependency chains.)

**Output task plan:**
```
Tasks to run: [N]

Tier 1 (parallel): SP1-T001, SP1-T002
Tier 2 (after Tier 1): SP1-T003  (depends_on: SP1-T001)

Phases: fe-design → be-design → implement → code-review → testing → retro-task
```

---

## Step 2 — Phase: FE Design

For each Tier (in order), launch **parallel sub-agents** — one per task in the tier:

> **Agent [task-id] — FE Design**
> Follow the `/fe-design` command exactly for `[task-id]`.
> Save output to `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`.
> Return: DONE or BLOCKED (with reason).

Wait for **all agents in the current tier** to complete before starting the next tier.
After all tiers finish, collect results.

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
- Print blocked tasks at end of each phase checkpoint with reason.

---

## Step 3 — Phase: BE Design

Same pattern as Step 2, but run `/be-design` for each unblocked task.

Launch **parallel sub-agents** — one per unblocked task per tier:

> **Agent [task-id] — BE Design**
> Follow the `/be-design` command exactly for `[task-id]`.
> Save output to `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`.
> Return: DONE or BLOCKED (with reason).

Print phase checkpoint after all tiers complete.

---

## Step 4 — Phase: Implement

Launch **parallel sub-agents** — one per unblocked task per tier:

> **Agent [task-id] — Implement**
> Follow the `/implement` command exactly for `[task-id]`.
> This includes writing failing tests first, then implementing until all pass.
> Return: DONE, ISSUES_FOUND (list issues), or BLOCKED (reason).

Wait for all agents per tier before advancing.

**If ISSUES_FOUND:** Run `/issue [task-id] [description]` for each reported issue before advancing to code-review for that task.

Print phase checkpoint after all tiers complete.

---

## Step 5 — Phase: Code Review

Launch **parallel sub-agents** — one per unblocked task per tier:

> **Agent [task-id] — Code Review**
> Follow the `/code-review` command exactly for `[task-id]`.
> Return: APPROVED or REQUEST_CHANGES (list critical issues).

**If REQUEST_CHANGES:** Run `/issue [task-id] [description]` for each critical issue, then re-run the implement agent for that task before advancing it to testing.

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

## Step 6 — Phase: Testing

Launch **parallel sub-agents** — one per unblocked task per tier:

> **Agent [task-id] — Testing**
> Follow the `/testing` command exactly for `[task-id]`.
> Return: ALL_PASS, FAILING (list failing tests), or MISSING_COVERAGE (list ACs).

**If FAILING or MISSING_COVERAGE:** Fix and re-run within the same agent before returning. If non-trivial, run `/issue [task-id] [description]`.

Print phase checkpoint after all tiers complete.

---

## Step 7 — Phase: Retro Task

Launch **parallel sub-agents** — one per unblocked task per tier:

> **Agent [task-id] — Retro**
> Follow the `/retro-task` command exactly for `[task-id]`.
> Save output to `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`.
> Update BACKLOG.md status to `done`.
> Return: DONE.

---

## Step 8 — Final summary

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
