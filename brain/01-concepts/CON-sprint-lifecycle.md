---
type: concept
tags: [sprint, workflow, lifecycle]
related: [CON-vertical-slice, CON-story-points, CON-tdd-rules]
updated: 2026-03-25
---

# Sprint Lifecycle

## In One Sentence

A sprint is an epic broken into E2E-testable vertical slices, each taken through a disciplined design → test → implement → retro cycle before moving on.

## The Full Flow

```
/discovery              ← understand the problem deeply first
    ↓
/new-sprint             ← create sprint, propose + confirm tasks
    ↓
/requirement            ← AC + user stories per task
    ↓
/design fe              ← component plan + TDD test cases (FE)
/design be              ← endpoint spec + TDD test cases (BE)
    ↓
/implement              ← write failing tests → implement → green
    ↓
/issue (loop)           ← bug-first: failing test → fix → log
    ↓
/code-review            ← AC coverage check
    ↓
/testing                ← full suite + AC cross-check
    ↓
/retro-task             ← per-task retro, mark done
/git-commit             ← selective stage + conventional commit
    ↓ (repeat per task)
/retro-sprint           ← aggregate retro → learnings → CLAUDE.md + brain
```

## Two Modes

**Sequential** — one task at a time, each command in order.

**Parallel** — `/run-tasks [id] [id]` runs Phase 1 (design) for all tasks, waits for review, then Phase 2 (implement) for all tasks simultaneously using sub-agents.

## Hard Rules

- No `/implement` before both `/design fe` AND `/design be` are complete
- No `/retro-sprint` while any task is not `done`
- Discovery is **recommended** before every sprint (warn if skipped, don't block)

## Related

- [[CON-vertical-slice]] — what makes a valid task
- [[CON-story-points]] — how tasks are sized
- [[../00-MOC/MOC-Workflow]] — command reference
