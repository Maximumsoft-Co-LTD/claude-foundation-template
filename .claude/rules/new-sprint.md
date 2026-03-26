# New Sprint Rules

When running `/new-sprint`:

- **Do NOT** scaffold per-task files (no `requirement.md`, no `frontend.md`, no `backend.md`, no task directories).
- `/new-sprint` scope is planning only:
  1. Fill the Sub-tasks table in the sprint overview doc
  2. Add tasks to `docs/BACKLOG.md`

Per-task files are created when that task actually begins (`/requirement`, `/fe-design`, `/be-design`).

## Why

Per-task docs require real task context — acceptance criteria, design decisions, test plans — that does not exist at sprint-planning time. Scaffolding them early produces empty or speculative files that mislead rather than guide. Create them at the moment the task starts, when the context is concrete.
