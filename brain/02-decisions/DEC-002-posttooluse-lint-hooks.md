---
type: decision
id: DEC-002
status: active
date: 2026-03-25
tags: [hooks, lint, automation, PostToolUse]
---

# DEC-002 — Auto-Lint on Every Write/Edit (PostToolUse Hooks)

## Status
`active`

## Context

Without automated lint and test runs, Claude Code can write code that compiles but violates style rules or breaks existing tests — and not notice until much later in the workflow.

## Decision

**All four hooks fire automatically after every `Write` or `Edit` action:**

1. `lint_go.py` → `golangci-lint`
2. `lint_ts.py` → `tsc` type check
3. `lint_js.py` → ESLint
4. `run_tests.py` → full test suite

Configured in `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [lint_go, lint_ts, lint_js, run_tests]
    }]
  }
}
```

Each hook checks if its language is present in the project before running, so non-applicable hooks are no-ops.

## Rationale

- Catches lint errors and broken tests immediately, at the point of creation
- Prevents "fix lint" commits at the end of a task
- Keeps CI green by never committing broken code
- Claude gets immediate feedback to self-correct before moving on

## Consequences

**Positive:**
- Every saved file is lint-clean and test-passing
- No "oops, forgot to run tests" situations
- Faster feedback loop for Claude during implementation

**Negative:**
- Adds 30–120 seconds overhead per Write/Edit
- Full test suite on every file save can be slow on large projects
  - Mitigation: `run_tests.py` can be scoped to changed files only

## Related

- [[../01-concepts/CON-tdd-rules]]
- [[../00-MOC/MOC-Architecture]]
- `.claude/hooks/` directory
