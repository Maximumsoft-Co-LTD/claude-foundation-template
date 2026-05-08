---
type: concept
tags: [sprint, workflow, lifecycle]
related: [CON-vertical-slice, CON-story-points, CON-tdd-rules]
updated: 2026-05-08
source: template
---

# Sprint Lifecycle

## In One Sentence

A sprint is an epic broken into E2E-testable vertical-slice tasks, each taken through a disciplined requirement → plan → test → implement → review → verify → retro cycle before moving on.

## The Full Flow

```
/discovery              ← understand the problem deeply first
    ↓
/new-sprint             ← create sprint, set Sprint Goal, propose + confirm tasks
    ↓
/requirement            ← one unified task doc: ACs + design + plan + tests + slices
    ↓
/implement              ← write failing tests → implement planned slice → green
    ↓
/issue (loop)           ← bug-first: failing test → fix → log
    ↓
/code-review            ← plan/spec compliance → quality/security
    ↓
/testing                ← full suite + AC proof + slice proof + ui-verify
    ↓
/retro-task             ← per-task retro, mark done
/git-commit             ← selective stage + conventional commit
    ↓ (repeat per task)
/retro-sprint           ← aggregate retro → learnings → CLAUDE.md + brain
```

## Two Modes

**Sequential** — one task at a time, each command in order.

**Parallel** — `/run-tasks [id] [id]` runs `/requirement` for all tasks, then `/implement → /code-review → /testing` per task in parallel where contracts do not collide.

## Hard Rules

- No `/implement` before `/requirement` has a real `Implementation Plan`, `Execution Slices`, and planned tests
- No `/git-commit` while any execution slice is still open
- No `/retro-sprint` while any task is not `done`
- Discovery is **recommended** before every sprint (warn if skipped, don't block)

## Related

- [[CON-vertical-slice]] — what makes a valid task
- [[CON-story-points]] — how tasks are sized
- [[../00-MOC/MOC-Workflow]] — command reference
