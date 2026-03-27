---
type: lesson
id: LES-001
sprint: example
tags: [tdd, deadline, technical-debt]
source: template-example
---

# LES-001 — TDD Skipped Under Deadline Pressure Creates More Rework

## What Happened

Team skipped writing tests first on a "simple" endpoint to hit a deadline. Code shipped. Three bugs found in QA that required full rewrites because the implementation had no test harness to refactor against.

## What We Learned

The time saved by skipping TDD was less than the time spent debugging untested code. TDD makes refactoring safe; skipping it makes every bug fix a gamble.

## Rule Going Forward

No deadline justifies skipping RED. If time is short, write fewer features — not untested ones.

## Related

- [[../01-concepts/CON-tdd-rules]]
- [[../03-patterns/PAT-001-tdd-flow]]
