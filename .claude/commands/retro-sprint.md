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

---

## Step 2 — Aggregate all task retros

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

---

## Step 3 — Evaluate sprint goals and success metrics

From `[sprint-id]-overview.md`:
- For each **Goal** → was it achieved? (yes / partially / no)
- For each **Success Metric** → what was the actual result vs target?
- **Definition of Done (Sprint Level)** → check every checkbox, mark which passed/failed

---

## Step 4 — Write the sprint retrospective

Save to `docs/sprints/[sprint-id]/[sprint-id]-retro.md`:

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

---

## Step 5 — Update BACKLOG.md

Update the sprint section header to show `done`:
```markdown
## SP1 — [Epic Title] ✓ done
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
