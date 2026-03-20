# /retro-sprint
Workflow position: **(all tasks done + /git-commit) → START → next sprint**

Write a sprint-level retrospective by aggregating all task retros and evaluating sprint goals.
Run this ONCE after ALL tasks in the sprint are done and committed.
Arguments: $ARGUMENTS
Format: `[sprint-id]`  — e.g. `SP1`

---

## Step 1 — Validate sprint is complete

1. Parse `[sprint-id]` from `$ARGUMENTS`.
2. Read `docs/BACKLOG.md` — check the sprint table.
   - If any task is NOT `done` → stop: "Tasks still open: [list]. Complete all tasks before running /retro-sprint."
3. Read `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — load Goals, Success Metrics, Sub-tasks, and Definition of Done.

Register all steps with TaskCreate — store the returned IDs:

```
t1 = TaskCreate(subject: "[sprint-id] — sprint-retro: validate complete",        description: "Confirm all tasks are done and read sprint overview")
t2 = TaskCreate(subject: "[sprint-id] — sprint-retro: aggregate task retros",    description: "Read all task retros and issues files; compute aggregates")
t3 = TaskCreate(subject: "[sprint-id] — sprint-retro: evaluate goals + metrics", description: "Evaluate each goal and success metric from sprint overview")
t4 = TaskCreate(subject: "[sprint-id] — sprint-retro: write sprint retro",       description: "Write sprint retro doc to [sprint-id]-retro.md")
t5 = TaskCreate(subject: "[sprint-id] — sprint-retro: update BACKLOG.md",        description: "Mark sprint as done in BACKLOG.md")
```

Wire dependencies:
```
TaskUpdate(t2, addBlockedBy: [t1])
TaskUpdate(t3, addBlockedBy: [t2])
TaskUpdate(t4, addBlockedBy: [t3])
TaskUpdate(t5, addBlockedBy: [t4])
```

Mark t1 as done (validation already complete above):
```
TaskUpdate(t1, status: in_progress)
TaskUpdate(t1, status: completed)
```

---

## Step 2 — Aggregate all task retros

```
TaskUpdate(t2, status: in_progress)
```

For every task in the sprint, read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md` — estimate vs actual, what went well, improvements, TDD effectiveness, action items
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (if exists) — bug count and severity

Compute aggregates:
- Total estimated days vs total actual days across all tasks
- Total issues: X critical / Y major / Z minor
- TDD score: how many tasks had tests written before implementation?
- Recurring themes in "what went well" and "what could be improved"
- All knowledge sharing items combined
- All action items combined (deduplicated)

```
TaskUpdate(t2, status: completed)
```

---

## Step 3 — Evaluate sprint goals and success metrics

```
TaskUpdate(t3, status: in_progress)
```

From `[sprint-id]-overview.md`:
- For each **Goal** → was it achieved? (yes / partially / no)
- For each **Success Metric** → what was the actual result vs target?
- **Definition of Done (Sprint Level)** → check every checkbox, mark which passed/failed

```
TaskUpdate(t3, status: completed)
```

---

## Step 4 — Write the sprint retrospective

```
TaskUpdate(t4, status: in_progress)
```

Save to `docs/sprints/[sprint-id]/[sprint-id]-retro.md` using `docs/templates/RETRO-SPRINT-TEMPLATE.md` as the structure:

```markdown
# [sprint-id] — Sprint Retrospective

**Epic:** [Epic Title]
**Date:** [today]
**Duration:** [start date] → [end date]
**Team:** [team members]

---

## Sprint Goals Review
| Goal | Result | Status |
|------|--------|--------|
| [goal 1] | [what happened] | ✓ achieved / ~ partial / ✗ missed |

## Success Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| [metric] | [target] | [result] | ✓ / ~ / ✗ |

## Velocity
| | Estimated | Actual | Variance |
|-|-----------|--------|----------|
| Total days | X | Y | +/- Z |
| Tasks completed | N | N | — |
| Issues encountered | — | X critical / Y major / Z minor | — |

## What went well (across all tasks)
-

## What could be improved (across all tasks)
-

## TDD Effectiveness (sprint-wide)
- Tasks with tests written before code: X / N ([%])
- Bugs caught by tests before manual QA: [total]
- Common TDD gaps identified:

## Knowledge sharing
<!-- Consolidated from all task retros. Add to CLAUDE.md or team wiki if valuable. -->
-

## Action items for next sprint
<!-- Deduplicated and prioritized from all task retros. Assign owner where possible. -->
| Action | Owner | Priority |
|--------|-------|----------|
| - | - | high / med / low |

## Definition of Done — Sprint Level
- [ ] All sub-tasks are `done`
- [ ] All success metrics instrumented and verified
- [ ] Deployed to production
- [ ] Sprint retro written
```

```
TaskUpdate(t4, status: completed)
```

---

## Step 5 — Update BACKLOG.md

```
TaskUpdate(t5, status: in_progress)
```

Update the sprint section header to show `done`:
```markdown
## SP1 — [Epic Title] ✓ done
```

```
TaskUpdate(t5, status: completed)
```

---

## Step 6 — Output

```
✓ Sprint retro saved: docs/sprints/[sprint-id]/[sprint-id]-retro.md
✓ BACKLOG.md — [sprint-id] marked done

Sprint summary:
  Goals achieved   : X / N
  Velocity         : X estimated → Y actual days
  Issues           : X critical / Y major / Z minor
  Action items     : N for next sprint

Next step: /discovery [disc-id] [name]  ← start the next epic
       or: /new-sprint [sprint-id] [description]  ← if already discovered
```
