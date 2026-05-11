---
name: New Sprint Rules
description: Restricts `/new-sprint` to planning only — fill the sprint overview and BACKLOG, never scaffold per-task files.
scope: universal
---

# New Sprint Rules

When running `/new-sprint`:

- **Do NOT** scaffold per-task files (no `requirement.md`, no task directories).
- `/new-sprint` scope is planning only:
  1. Fill the `Sprint Goal` and Stories table in the sprint overview doc
  2. Add tasks to `docs/BACKLOG.md`

The per-task `[task-id]-requirement.md` is created when that task actually begins (`/requirement`). The unified doc contains story + FE design + BE design + Implementation Plan + tests — there are no separate `-frontend.md` / `-backend.md` files.

## Why

Per-task docs require real task context — acceptance criteria, design decisions, test plans — that does not exist at sprint-planning time. Scaffolding them early produces empty or speculative files that mislead rather than guide. Create them at the moment the task starts, when the context is concrete.
