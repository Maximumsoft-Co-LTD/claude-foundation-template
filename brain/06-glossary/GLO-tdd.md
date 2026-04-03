---
type: glossary
term: TDD (Test-Driven Development)
tags: [testing, tdd, red-green-refactor, development-practices, qa]
updated: 2026-03-25
---

# TDD (Test-Driven Development)

A development discipline where automated tests are written **before** implementation code, following the **Red → Green → Refactor** cycle. The test drives the design and behavior of the code.

**The cycle:**
```
Red   → Write a failing test for functionality that doesn't exist yet
Green → Write the minimum code to make the test pass
Refactor → Clean up code while keeping the test green
```

**Key rule:** Never write implementation code before a failing test exists. If you wrote code first, delete it and start with the test.

**Contrast with:** Writing tests after implementation (test-after), which tests what was built rather than what should be built.

## See Also

- [[CON-tdd-rules]] — Project-specific TDD rules and enforcement
- [[PAT-001-tdd-flow]] — Red → Green → Refactor with concrete code examples
- [[DEC-001-real-deps-integration-tests]] — Why integration tests use real dependencies
