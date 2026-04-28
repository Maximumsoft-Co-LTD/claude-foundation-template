---
type: concept
tags: [workflow, quality, testing, claude-code, evidence]
related: [CON-tdd-rules, CON-self-check-rule, PAT-005-subagent-driven-development]
updated: 2026-04-29
source: template
---

# Verification Before Completion

## Core idea

**No "done" claim without fresh test evidence.** Before reporting a task complete, the AI must run the relevant tests **in this session** and show the output. "I think it works" is not evidence; a green test run from earlier in the session is not fresh evidence — code may have changed since.

This is the **evidence gate** at the end of `/implement` (Step 4) and is enforced by the superpowers `verification-before-completion` skill.

## What counts as evidence

| Claim | Evidence required |
|-------|-------------------|
| "All ACs pass" | Test output showing each AC's test green, in this session |
| "No regressions" | Full suite output, in this session, after the last code change |
| "Build works" | Build command output with exit 0 |
| "UI works" | Browser screenshot or recorded interaction (for FE tasks) |
| "Migration works" | Migration applied + rollback verified, output captured |

What does NOT count:
- "Tests passed earlier" (stale — code may have changed)
- "It compiled" (compiling ≠ correct behavior)
- "Looks right to me" (not evidence at all)

## Multiple test runs are intentional, not duplication

The workflow runs tests at four points: `/implement` Step 4, `/code-review` Step 0, `/testing` Step 7, `/git-commit` Step 8. Each run is a **freshness gate** because time has elapsed between phases. Code may have changed during code review fixes; the previous run is no longer authoritative.

This is not redundant — each run answers a different question:
- `/implement` → "Did the implementation actually pass the tests I wrote?"
- `/code-review` → "Did review fixes break anything?"
- `/testing` → "Does the full suite still pass after all changes?"
- `/git-commit` → "Is the staged code green right now?"

## Why this gate exists

LLMs are optimistic. Without an evidence requirement, they will:
- Assume tests pass because the implementation "looks right"
- Skip running the suite because "the change is small"
- Round up partial passes to "all green"

A human reviewer can usually catch these. A subagent pipeline (where output flows to another agent without a human in the loop) cannot. The evidence gate forces output that downstream consumers can verify mechanically.

## The "freshness" rule

Evidence is fresh only when:
- It is from the **current session**
- It is from **after** the last code change
- It includes the **exact output**, not a summary like "passed"

If any of those is false, the run is stale → re-run before claiming done.

## Anti-pattern: paraphrased evidence

Do NOT report:
> "I ran the tests and they pass."

Do report:
> ```
> $ npm test
> PASS  src/auth/login.test.ts (8 tests)
> PASS  src/auth/session.test.ts (5 tests)
> Tests: 13 passed, 13 total
> ```

The actual output is the evidence. Paraphrasing destroys the audit trail.

## Related

- `superpowers:verification-before-completion` skill (when superpowers installed)
- `/implement` Step 4 — evidence gate enforcement point
- [[CON-self-check-rule]] — file-level mirror of the same principle
- [[CON-tdd-rules]] — TDD provides the tests this gate verifies
