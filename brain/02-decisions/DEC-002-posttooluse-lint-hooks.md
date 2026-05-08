---
type: decision
id: DEC-002
status: active
date: 2026-03-25
tags: [hooks, lint, automation, PostToolUse]
---

# DEC-002 — Path-Aware Validation on Every Write/Edit (PostToolUse Hooks)

## Status
`active`

## Context

Without automated lint and test runs, Claude Code can write code that compiles but violates style rules or breaks existing tests — and not notice until much later in the workflow.

## Decision

**A single dispatcher hook fires automatically after every `Write` or `Edit` action, then routes to the relevant sub-hooks by edited path.**

Current routing:

1. Source edit → matching linter(s) (`lint_go.py`, `lint_ts.py`, `lint_js.py`) + `run_tests.py`
2. Skill definition edit under `.claude/skills/` → `skill_validate.py`
3. Brain note edit under `brain/` → `brain_note_lint.py`
4. Workflow markdown under `docs/sprints/` or `docs/discovery/` → `brain_citation_meter.py`

`run_tests.py` runs the edited test file directly, or the closest related test file for an edited source file. If no related test or supported runner exists, it exits silently. The full suite remains the responsibility of `/testing`.

Configured in `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [dispatch]
    }]
  }
}
```

The dispatcher keeps the settings surface small, and each sub-hook still self-filters if its language or file type does not apply.

## Rationale

- Catches lint errors and nearby test regressions immediately, at the point of creation
- Avoids wasting time on full-suite runs for every file save
- Keeps doc-only edits from triggering irrelevant source hooks
- Claude gets immediate feedback to self-correct before moving on

## Consequences

**Positive:**
- Relevant source edits get lint and nearby-test feedback immediately
- No "oops, forgot to run the related test" situations during implementation
- Faster feedback loop for Claude during implementation

**Negative:**
- Adds overhead to every relevant Write/Edit
- Targeted tests can miss unrelated regressions
  - Mitigation: `/testing` still runs the full suite before completion

## Related

- [[../01-concepts/CON-tdd-rules]]
- [[../00-MOC/MOC-Architecture]]
- `.claude/hooks/` directory
