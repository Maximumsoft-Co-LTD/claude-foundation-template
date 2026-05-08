---
type: glossary
term: PostToolUse Hook
tags: [claude-code, automation, linting, testing, ci-cd]
updated: 2026-05-08
---

# PostToolUse Hook

A Claude Code lifecycle event that fires automatically after a successful tool call, enabling automated checks, logging, or fan-out without manual invocation.

**How it works in this repo:** `.claude/settings.json` routes `Write|Edit` through `dispatch.py`, which then runs only the relevant sub-hooks for that path. Source edits trigger lint and related-test feedback; workflow docs under `docs/sprints/` and `docs/discovery/` trigger the brain citation meter.

**This project uses it for:** Path-aware lint/test feedback on source edits plus citation tracking for workflow docs (see [[DEC-002-posttooluse-lint-hooks]])

**Key constraint:** Keep hooks fast. Use targeted feedback here, and reserve heavyweight/full-suite verification for `/testing` or CI.

**Contrast with:** Manual `npm run lint` or `pytest` invocations

## See Also

- [[DEC-002-posttooluse-lint-hooks]] — Architectural decision on when to use PostToolUse
- [[MOC-Architecture]] — Claude Code architecture and lifecycle events
