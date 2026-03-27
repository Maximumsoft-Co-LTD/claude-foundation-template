---
type: concept
tags: [qa, process, shift-left, testing-strategy, release]
related: [CON-test-types, CON-testing-pyramid, CON-bug-lifecycle]
updated: 2026-03-25
source: template
---

# QA Process

## Shift-Left Testing

Traditional: test at the END (shift-right)
Modern: test THROUGHOUT, starting early (shift-left)

```
Requirements → Design → Code → Test → Deploy

Traditional:             ↑ all testing here (too late!)
Shift-Left:   ↑ here ↑ here ↑ here ↑ here ↑ even here
```

**When QA adds value per phase:**

| Phase | QA Activity |
|-------|------------|
| Requirements | Review ACs for testability, ambiguity |
| Design | Identify test scenarios from design docs |
| Development | TDD (write tests with dev), code review |
| Integration | Integration tests pass |
| Pre-release | E2E, regression, performance, security |
| Post-release | Monitoring, smoke tests |

## QA in Scrum Sprint

```
Sprint Planning:
  → QA reviews ACs for testability
  → QA creates test plan for sprint stories

During Sprint:
  → Dev writes unit/integration tests (TDD)
  → QA writes E2E test scenarios
  → QA explores edge cases

Sprint Testing:
  → Full regression suite
  → Manual exploratory testing
  → PO UAT on staging

Sprint Review:
  → Demo only tested stories
  → PO accepts/rejects
```

## Test Strategy Document

For each feature/sprint, define:

```markdown
## Test Strategy: [Feature Name]

### Scope
What's tested: ...
What's NOT tested: ...

### Test Levels
- Unit tests: [what logic, who writes]
- Integration tests: [which APIs, which flows]
- E2E tests: [which user journeys]

### Test Data
- Seed data needed: ...
- Edge case data: ...

### Environments
- Dev: unit + integration
- Staging: E2E + performance
- Production: smoke tests

### Entry Criteria (before testing)
- All ACs defined and reviewed
- Code review complete
- CI green (unit + integration)

### Exit Criteria (done testing)
- All test cases executed
- No P1/P2 open bugs
- P3/P4 documented, accepted by PO
- PO UAT sign-off
```

## Test Case Design Techniques

### Equivalence Partitioning
```
Input: age field (valid: 18-120)

Partitions:
  Invalid low: < 18 (e.g., 17) → expect error
  Valid: 18-120 (e.g., 30) → expect success
  Invalid high: > 120 (e.g., 121) → expect error

Test one value from each partition
```

### Boundary Value Analysis
```
Boundaries of age field (18-120):

Below min: 17  → error
At min:    18  → success
Above min: 19  → success
Below max: 119 → success
At max:    120 → success
Above max: 121 → error
```

### Decision Table
```
| Email valid | Password strong | Expected |
|-------------|-----------------|---------|
| Yes         | Yes             | Login OK |
| Yes         | No              | Error: weak password |
| No          | Yes             | Error: invalid email |
| No          | No              | Error: invalid email |
```

## QA Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Test coverage | (ACs with tests / total ACs) × 100 | > 90% |
| Bug escape rate | Bugs found in prod / total bugs | < 5% |
| Defect density | Bugs per story point | Trending down |
| Mean time to detect | Time from bug introduction to discovery | Trending down |
| Automation rate | Automated tests / total tests | > 70% |

## Related

- [[CON-test-types]] — types of tests
- [[CON-testing-pyramid]] — how many of each type
- [[CON-bug-lifecycle]] — what happens after a bug is found
- [[../../../00-MOC/MOC-QA]]
