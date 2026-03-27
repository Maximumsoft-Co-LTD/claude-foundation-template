---
type: concept
tags: [developer, code-review, PR, checklist, quality]
related: [CON-clean-code, CON-solid-principles]
updated: 2026-03-25
source: template
---

# Code Review Checklist

## Reviewer Mindset

- Goal: improve code quality, share knowledge — NOT gatekeeping
- Be specific in feedback (not "this is wrong")
- Distinguish between: Blocking issue / Suggestion / Nit (style)
- Approve if overall good, even with small nits

## Checklist

### ✅ Correctness
- [ ] Does the code do what the ticket/AC requires?
- [ ] Are all acceptance criteria covered?
- [ ] Are edge cases handled? (null, empty, 0, negative, max)
- [ ] Are error cases handled and tested?
- [ ] No obvious logic bugs?

### ✅ Tests
- [ ] Tests written before implementation (TDD)?
- [ ] Unit tests for business logic?
- [ ] Integration tests for API/DB operations?
- [ ] Tests cover happy path AND failure cases?
- [ ] No `.only`, `.skip`, or commented-out tests?

### ✅ Security
- [ ] No hardcoded secrets (API keys, passwords)?
- [ ] Input validated at boundaries?
- [ ] SQL injection safe (parameterized queries)?
- [ ] XSS safe (no `innerHTML` with user input)?
- [ ] Auth checked on all protected endpoints?

### ✅ Performance
- [ ] No N+1 queries?
- [ ] Pagination on list endpoints?
- [ ] No unnecessary re-renders (FE)?
- [ ] Heavy operations async/queued?

### ✅ Readability
- [ ] Variable and function names clear?
- [ ] Functions small and single-purpose?
- [ ] Comments explain WHY (not WHAT)?
- [ ] No magic numbers/strings?

### ✅ Architecture
- [ ] Follows layered architecture (handler → service → repo)?
- [ ] No layer violations?
- [ ] No code duplication (DRY)?
- [ ] New dependency justified?

### ✅ API Design (if applicable)
- [ ] Correct HTTP verbs and status codes?
- [ ] Consistent error response shape?
- [ ] Backward-compatible changes?
- [ ] New endpoints documented?

## Comment Prefixes (Convention)

```
🚫 BLOCK: must fix before merge
⚠️  WARN:  should fix, but not blocking
💡 SUGGEST: optional improvement
🤔 QUESTION: need clarification
✨ PRAISE: this is good!
📝 NIT: minor style/formatting
```

## Reviewer Response Time

- **SLA:** Review within 24 hours during work days
- Large PRs (>300 lines): ok to ask author to split
- If blocked on a review > 2 days: escalate to SM

## Author Checklist (Before Requesting Review)

- [ ] Self-reviewed your own PR
- [ ] All CI checks pass (lint, tests)
- [ ] PR description explains WHY, links to ticket
- [ ] Screenshots for UI changes
- [ ] PR size: ideally < 300 lines changed

## Related

- [[CON-clean-code]] — what to look for
- [[CON-solid-principles]] — architecture concerns
- [[../../../00-MOC/MOC-Developer-Fundamentals]]
