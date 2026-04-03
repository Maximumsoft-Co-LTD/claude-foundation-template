---
type: lesson
id: LES-002
sprint: example
tags: [testing, mocks, integration, database]
source: template-example
updated: 2026-03-25
---

# LES-002 — Mocked Integration Tests Masked a Real Migration Bug

## What Happened

Integration tests used a mocked DB layer. All tests passed. A schema migration changed a column type in a way the mock didn't reflect. The real DB rejected queries in production on deploy day.

## What We Learned

Mocks freeze behavior at the time they're written. Real DB changes are invisible to them. The integration layer is exactly where mocks fail most silently.

## Rule Going Forward

Integration tests always hit a real DB (see DEC-001). Mocks belong only in unit tests for isolated logic.

## Related

- [[../02-decisions/DEC-001-real-deps-integration-tests]]
- [[../01-concepts/CON-tdd-rules]]
