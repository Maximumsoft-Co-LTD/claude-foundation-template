---
type: glossary
term: PostToolUse Hook
tags: [claude-code, automation, linting, testing, ci-cd]
updated: 2026-03-25
---

# PostToolUse Hook

A Claude Code lifecycle event that fires automatically after every Write or Edit tool call, enabling automated checks (linting, formatting, testing) without manual invocation.

**How it works:** When Claude edits a file, matching scripts in `.claude/hooks/PostToolUse/` execute with the file path as argument. Exit code 0 = pass, non-zero = fail and report to user.

**This project uses it for:** Auto-lint on every file edit (see [[DEC-002-posttooluse-lint-hooks]])

**Key constraint:** Keep hooks fast (< 5 seconds). Use CI for heavyweight tests (integration, E2E).

**Contrast with:** Manual `npm run lint` or `pytest` invocations

## See Also

- [[DEC-002-posttooluse-lint-hooks]] — Architectural decision on when to use PostToolUse
- [[MOC-Architecture]] — Claude Code architecture and lifecycle events
