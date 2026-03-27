---
type: concept
tags: [sdlc, technical-debt, refactoring, quality, maintenance]
related: [CON-sdlc-phases, CON-definition-of-done]
updated: 2026-03-25
source: template
---

# Technical Debt

## Definition

**Technical debt** = The implied cost of additional rework caused by choosing an easy solution now instead of a better approach that would take longer.

Ward Cunningham's original metaphor: "Shipping first-time code is like going into debt. A little is OK, but the interest compounds."

---

## Types of Technical Debt

| Type | Description | Example |
|------|-------------|---------|
| **Intentional** | Knowingly cut corner with plan to fix later | "Quick fix to meet deadline — tech debt ticket created" |
| **Unintentional** | Bad decision made without realizing it | Code written before team learned better patterns |
| **Bit rot** | Code that was fine but environment changed | Library deprecated, but code still uses it |
| **Architecture debt** | System design that no longer fits the need | Monolith that should be services |
| **Test debt** | Missing tests that should exist | Features shipped without tests |
| **Documentation debt** | Missing/outdated docs | API doc last updated 2 years ago |

---

## Recognizing Technical Debt

**Signs of high debt:**
- "I'm afraid to change that code"
- Simple features take disproportionately long
- New team members take weeks to be productive
- Bug fix in one place breaks something elsewhere
- No one understands how a part of the system works
- Tests are skipped "because they're slow/flaky"

---

## Measuring Technical Debt

```
Code quality metrics:
  Code coverage % (low = test debt)
  Cyclomatic complexity (high = hard to understand/test)
  Duplicated code % (high = DRY violations)
  Tech debt ratio (SonarQube: estimated fix time / total dev time)

Business metrics:
  Time to implement "simple" features (trending up = debt rising)
  Bug rate per sprint (trending up = quality declining)
  Developer satisfaction survey (declining = debt affecting morale)
```

---

## Managing Technical Debt

### The 20% Rule (Recommended)
Allocate 20% of every sprint to paying down technical debt:
```
Sprint capacity: 40 story points
  80% features: 32 pts
  20% tech debt: 8 pts (refactoring, tests, cleanup)
```

### Tech Debt Backlog
Track debt as explicit backlog items:
```markdown
[DEBT] Refactor UserService to use repository pattern   [8pts]
[DEBT] Add missing integration tests for payment flow   [5pts]
[DEBT] Upgrade deprecated auth library v2 → v3          [3pts]
[DEBT] Remove 500 lines of dead code in admin module    [2pts]
```

### "Boy Scout Rule"
Leave code cleaner than you found it — even if not fixing debt tasks:
- Fix one variable name
- Extract one function
- Add one test
- Update one comment

---

## Tech Debt vs. Bugs

| | Technical Debt | Bug |
|-|---------------|-----|
| Impact | Slow development velocity | Incorrect behavior |
| Visibility | Internal only | User-visible |
| Priority | Medium (accumulates) | High (immediate fix) |
| Type | Improvement | Fix |

---

## Anti-patterns

```
❌ "We'll clean it up later" (without creating a ticket)
   → Later never comes without explicit tracking

❌ Ignoring debt during sprint planning
   → Velocity slows down over time

❌ Complete rewrites to fix debt
   → "Second system syndrome" — rewrites introduce new bugs
   → Prefer incremental improvement (strangler fig pattern)

✅ Make debt visible, track it, allocate time regularly
```

## Related

- [[CON-sdlc-phases]] — debt builds up if phases are rushed
- [[CON-definition-of-done]] — strong DoD prevents debt accumulation
- [[../developer/CON-refactoring]] — primary tool to repay debt
- [[../../00-MOC/MOC-SDLC]]
