---
type: MOC
topic: qa
tags: [qa, testing, quality, bugs, automation]
updated: 2026-03-25
---

# 🗺️ MOC — QA (Quality Assurance)

> Quality ไม่ใช่แค่การ test — คือกระบวนการทั้งหมดที่ทำให้ software ทำงานตาม expectation และไม่พัง

---

## Core Concepts

- [[../01-concepts/qa/CON-testing-pyramid]] — Unit → Integration → E2E: สัดส่วนและเหตุผล
- [[../01-concepts/qa/CON-test-types]] — Unit, Integration, E2E, Regression, Load, Security
- [[../01-concepts/qa/CON-bug-lifecycle]] — Found → Report → Triage → Fix → Verify → Close
- [[../01-concepts/qa/CON-qa-process]] — QA เข้ามาตอนไหน, shift-left testing คืออะไร
- [[../01-concepts/qa/CON-test-case-design]] — Equivalence partitioning, boundary values, exploratory

## Testing Pyramid

```
        /\
       /E2E\       ← few, slow, fragile, highest confidence
      /------\
     / Integr. \   ← moderate, real deps, good coverage
    /------------\
   /   Unit Tests  \ ← many, fast, isolated, catch regressions
  /________________\
```

**Ratios (guideline):** 70% Unit / 20% Integration / 10% E2E

## Test Types Cheatsheet

| Type | Scope | Speed | Dependencies | Purpose |
|------|-------|-------|-------------|---------|
| Unit | Single function/class | Milliseconds | Mocked | Logic correctness |
| Integration | Module + dependencies | Seconds | Real | Contract correctness |
| E2E | Full user flow | Minutes | Real system | User journey works |
| Regression | Entire system | Minutes-Hours | Real | Nothing broke |
| Load/Perf | System under load | Minutes | Real | Handles expected traffic |
| Security | Attack surfaces | Minutes | Real | No vulnerabilities |

## Bug Severity Levels

| Severity | Definition | Response |
|----------|-----------|---------|
| Critical (P1) | System down / data loss | Fix now, all hands |
| Major (P2) | Core feature broken, no workaround | Fix this sprint |
| Minor (P3) | Feature partially broken, workaround exists | Next sprint |
| Cosmetic (P4) | UI issue, typo | Backlog |

## Shift-Left Testing Principle

Don't wait until a "testing phase" — test earlier and continuously:
```
Requirements → Design → Code → Test → Deploy
     ↑ Review ACs    ↑ TDD  ↑ Lint/Unit  ↑ E2E  ↑ Smoke
```

## Related MOCs

- [[MOC-Developer-Fundamentals]] — TDD is a developer practice
- [[MOC-Backend]] — integration tests for APIs
- [[MOC-Frontend]] — E2E tests for user flows
- [[MOC-DevOps]] — tests run in CI/CD pipeline
- [[MOC-Workflow]] — testing phase in sprint lifecycle
