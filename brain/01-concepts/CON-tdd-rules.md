---
type: concept
tags: [tdd, testing, quality]
related: [PAT-001-tdd-flow, DEC-001-real-deps-integration-tests]
updated: 2026-03-25
source: template
---

# TDD Rules

## The Non-Negotiables

1. **Failing test first** — write the test, watch it fail (red), then implement until it passes (green). No exceptions.
2. **Real dependencies at integration layer** — real DB, real queue, real HTTP. Never mock at the integration boundary.
3. **Bug fix starts with a failing test** — reproduce the bug as a test before touching implementation.
4. **Never skip tests** — no `.only`, `.skip`, or commenting out failing tests. Fix the code instead.
5. **Full suite after every fix** — run the complete test suite to confirm no regressions.

## File Naming Convention

```
TypeScript:  [module].test.ts       — co-located with source
Go:          [module]_test.go       — co-located with source
Python:      test_[module].py       — co-located with source
```

## Why Real Dependencies?

Mocks at the integration layer create false confidence. A test that passes with mocks can fail in production when:
- The real DB has different query behavior
- The real queue has timing characteristics mocks don't simulate
- Schema changes aren't reflected in mock responses

See: [[../02-decisions/DEC-001-real-deps-integration-tests]]

## TDD Flow

See: [[../03-patterns/PAT-001-tdd-flow]]

## Hook Enforcement

Tests run automatically after every `Write` or `Edit` via PostToolUse hook.
See: [[../02-decisions/DEC-002-posttooluse-lint-hooks]]

## Related

- [[../03-patterns/PAT-001-tdd-flow]]
- [[../02-decisions/DEC-001-real-deps-integration-tests]]
- [[../00-MOC/MOC-Workflow]]
