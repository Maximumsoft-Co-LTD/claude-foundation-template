---
type: concept
tags: [qa, bug, defect, lifecycle, severity, priority]
related: [CON-testing-pyramid, CON-qa-process]
updated: 2026-03-25
source: template
---

# Bug Lifecycle

## Lifecycle Stages

```
Found
  ↓
Report (create ticket with reproduction steps)
  ↓
Triage (assign severity + priority)
  ↓
Assign (to dev who fixes it)
  ↓
Fix (with failing test first → see TDD rules)
  ↓
Code Review
  ↓
QA Verify (QA tests the fix)
  ↓
Close
  ↑
  └─ (Reopen if fix fails verification)
```

## Severity vs Priority

| | Severity | Priority |
|-|---------|---------|
| Definition | How bad is the impact? | How urgently must it be fixed? |
| Set by | QA / Reporter | PM / PO |
| Example | Critical: data corruption | High priority: must fix before release |

**They can differ:**
- Critical Severity, Low Priority: "System crashes if user types emoji in name field" — low usage, fix in next sprint
- Low Severity, High Priority: "Logo is blurry on homepage" — minor visual, high visibility, fix before launch

## Severity Levels

| Level | Definition | Response Time |
|-------|-----------|--------------|
| P1 — Critical | System down, data loss, security breach | Fix immediately (hours) |
| P2 — Major | Core feature broken, no workaround | Fix this sprint |
| P3 — Minor | Feature partially broken, workaround exists | Next sprint |
| P4 — Cosmetic | Visual issue, typo, minor UX | Backlog |

## Bug Report Template

```
Title: [Short description of the problem]

Environment: Production / Staging / Dev

Steps to Reproduce:
  1. Go to /checkout
  2. Add item to cart
  3. Click "Pay with card"
  4. Observe error

Expected Result: Payment processed, redirect to confirmation page

Actual Result: 500 error screen appears

Severity: P2 — Major
Frequency: 100% reproducible

Logs/Screenshots: [attach]
```

## Fix Discipline (TDD for Bugs)

```
1. Write a FAILING test that reproduces the bug
2. Run it — confirm it fails for the right reason
3. Fix the implementation
4. Run test — confirm it passes
5. Run full suite — confirm no regressions
6. Link failing test to the bug report
```

**Why:** Prevents the same bug from coming back in future

## Related

- [[CON-testing-pyramid]] — where bugs are caught
- [[CON-qa-process]] — full QA workflow
- [[../../CON-tdd-rules]] — TDD applies to bug fixes too
- [[../../../00-MOC/MOC-QA]]
