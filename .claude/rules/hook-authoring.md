---
paths:
  - ".claude/hooks/*.py"
---

# Hook Authoring Rules

## Operating principles

- Hooks must be **fast, bounded, and fail-safe**
- Validation hooks are advisory by default; they should surface actionable warnings, not create noisy transcripts
- On malformed stdin, missing environment, or unavailable dependencies, prefer silent exit or an empty JSON envelope over crashing

## Side effects

- PostToolUse validators must not mutate user source files
- Runtime artifacts are allowed only for explicit metrics/logging use cases
- Bound every subprocess with a timeout

## Routing discipline

- `dispatch.py` owns path-based routing; keep routing rules explicit and narrow
- Prefer exact file/path checks over broad heuristics that cause false positives
- A hook should run only when the edited path is genuinely in its ownership area

## Output quality

- Emit context only for warnings/failures worth acting on
- Messages must say **what is wrong** and **what to do next**
- Keep output compact enough to scan during implementation

## Maintenance

- New hook coverage requires matching docs updates in README or architecture notes when it changes user-visible behavior
- If a hook enforces a content contract, add or update the corresponding path-scoped rule
