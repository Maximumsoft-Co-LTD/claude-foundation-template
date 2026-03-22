# /retro-sprint
Workflow position: **(all tasks done + /git-commit) → START → next sprint**

Write a sprint-level retrospective. Run ONCE after ALL tasks are done and committed.
Arguments: `[sprint-id]`  — e.g. `SP1`

---

## Step 1 — Validate sprint is complete

Parse `[sprint-id]`. Read `docs/BACKLOG.md`:
- Any task NOT `done` → stop: "Tasks still open: [list]. Complete all before running /retro-sprint."

Read `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — Goals, Success Metrics, Sub-tasks, Definition of Done.

Register sub-tasks (wire sequentially; mark in_progress/completed at each step):
```
t1 = TaskCreate("[sprint-id] — sprint-retro: validate complete")
t2 = TaskCreate("[sprint-id] — sprint-retro: aggregate task retros")
t3 = TaskCreate("[sprint-id] — sprint-retro: evaluate goals + metrics")
t4 = TaskCreate("[sprint-id] — sprint-retro: write sprint retro")
t5 = TaskCreate("[sprint-id] — sprint-retro: update BACKLOG.md")
```
Mark t1 completed, t2 in_progress.

---

## Step 2 — Aggregate all task retros

For every task in the sprint, read `[task-id]-retro.md` and `[task-id]-issues.md` (if exists).

Compute:
- Total estimated vs actual days across all tasks
- Total issues: X critical / Y major / Z minor
- TDD score: how many tasks had tests written before implementation?
- Recurring themes in "what went well" and "what could be improved"
- All knowledge sharing items combined
- All action items combined (deduplicated)

Mark t2 completed, t3 in_progress.

---

## Step 3 — Evaluate sprint goals and success metrics

From `[sprint-id]-overview.md`:
- Each **Goal** → achieved / partially / no
- Each **Success Metric** → actual result vs target
- **Definition of Done (Sprint Level)** → check each checkbox, mark passed/failed

Mark t3 completed, t4 in_progress.

---

## Step 4 — Write the sprint retrospective

Save to `docs/sprints/[sprint-id]/[sprint-id]-retro.md`:

```markdown
# [sprint-id] — Sprint Retrospective
**Epic:** [title]  |  **Date:** [today]  |  **Duration:** [start] → [end]

## Sprint Goals
| Goal | Result | Status |
|------|--------|--------|
| [goal] | [what happened] | ✓ achieved / ~ partial / ✗ missed |

## Success Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| [metric] | [target] | [result] | ✓ / ~ / ✗ |

## Velocity
| | Estimated | Actual | Variance |
|-|-----------|--------|----------|
| Total days | X | Y | +/- Z |
| Tasks completed | N | N | — |
| Issues | — | X critical / Y major / Z minor | — |

## What went well
-

## What could be improved
-

## TDD Effectiveness (sprint-wide)
- Tasks with tests before code: X / N ([%])
- Bugs caught by tests before QA: [total]
- Common TDD gaps:

## Knowledge sharing
<!-- Consolidated from all task retros. Add to CLAUDE.md if valuable. -->
-

## Action items for next sprint
| Action | Owner | Priority |
|--------|-------|----------|
| - | - | high / med / low |

## Definition of Done — Sprint Level
- [ ] All sub-tasks done
- [ ] All success metrics verified
- [ ] Deployed to production
- [ ] Sprint retro written
```

Mark t4 completed, t5 in_progress.

---

## Step 5 — Update BACKLOG.md and surface learnings

Mark sprint header as done:
```markdown
## [sprint-id] — [Epic Title] ✓ done
```

Scan all task retros for "Knowledge sharing" items. For any non-obvious finding (naming convention, test pattern, architectural decision, anti-pattern, reusable utility), ask:

```
Found [N] knowledge items from this sprint. Add to CLAUDE.md?

  [1] [item] → Architecture / Team Conventions / Key Constraints
  [2] [item] → Architecture / Team Conventions / Key Constraints

Add all / pick numbers / skip:
```

If user confirms → append to relevant CLAUDE.md section.

Mark t5 completed.

---

## Output

```
✓ docs/sprints/[sprint-id]/[sprint-id]-retro.md
✓ BACKLOG.md — [sprint-id] marked done

Summary: [N/N] goals achieved  |  [X] → [Y] days  |  [N] issues  |  [N] action items

Next: /discovery [disc-id] [name]  ← start next epic
  or: /new-sprint [sprint-id] [description]  ← if already discovered
```
