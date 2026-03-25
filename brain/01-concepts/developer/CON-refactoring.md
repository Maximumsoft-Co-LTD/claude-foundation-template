---
type: concept
tags: [developer, refactoring, code-quality, technical-debt]
related: [CON-clean-code, CON-solid-principles, CON-design-patterns]
updated: 2026-03-25
---

# Refactoring

## Definition

**Refactoring** = Improving internal structure of code **without changing external behavior**.

The golden rule: tests must pass before AND after every refactoring step.

```
Before refactoring → Run tests (green)
Make small change → Run tests (still green)
Make next small change → Run tests (still green)
...
Done!
```

If tests fail during refactoring → you changed behavior (not just structure).

---

## When to Refactor

```
Rule of Three (Martin Fowler):
  1st time: just do it
  2nd time: cringe but do it
  3rd time: refactor

The "Boy Scout Rule":
  Leave code cleaner than you found it
  (one small improvement per PR)

Best times:
  ✅ Before adding a new feature (make room for it)
  ✅ After bug fix (fix the underlying messiness)
  ✅ During code review (flag as tech debt ticket)
  ✅ Dedicated "refactoring sprint" for large debt
```

---

## Code Smells → Refactoring Techniques

| Code Smell | What It Looks Like | Refactoring |
|-----------|-------------------|-------------|
| Long Method | Function > 20 lines doing many things | Extract Method |
| Large Class | Class with too many responsibilities | Extract Class |
| Duplicate Code | Same logic in 2+ places | Extract Method/Function |
| Long Parameter List | Function takes 5+ params | Introduce Parameter Object |
| Feature Envy | Method uses another class's data more than its own | Move Method |
| Switch Statement | Long if/switch on type | Replace with Strategy/Polymorphism |
| Magic Numbers | `if (days > 90)` | Replace with Named Constant |
| Dead Code | Unused variables, functions | Delete It |
| Divergent Change | One class changed for many reasons | Split Class (SRP) |
| Shotgun Surgery | One change requires edits in many places | Move related code together |

---

## Key Refactoring Techniques

### Extract Method/Function
```typescript
// Before (long method)
function generateReport(data) {
  // 10 lines: calculate totals
  // 15 lines: format as table
  // 8 lines: add headers
}

// After (extracted)
function generateReport(data) {
  const totals = calculateTotals(data)
  const table = formatAsTable(totals)
  return addHeaders(table)
}
```

### Extract Variable
```typescript
// Before (complex condition)
if (user.age >= 18 && user.country === 'TH' && !user.isBanned) { }

// After (named variable explains intent)
const isEligibleUser = user.age >= 18 && user.country === 'TH' && !user.isBanned
if (isEligibleUser) { }
```

### Replace Magic Number
```typescript
// Before
if (score > 70) { grade = 'A' }

// After
const PASSING_SCORE = 70
if (score > PASSING_SCORE) { grade = 'A' }
```

### Introduce Parameter Object
```typescript
// Before
function createUser(name: string, email: string, age: number, country: string, role: string) {}

// After
interface CreateUserInput { name: string; email: string; age: number; country: string; role: string }
function createUser(input: CreateUserInput) {}
```

---

## Safe Refactoring Process

```
1. Ensure tests exist and are green
2. Make ONE small refactoring
3. Run tests → confirm still green
4. Commit: "refactor: extract calculateTotals function"
5. Repeat for next refactoring
```

**Never:** Refactor + add features in the same commit. Separate concerns.

## Related

- [[CON-clean-code]] — what clean code looks like
- [[CON-solid-principles]] — refactor toward SOLID
- [[CON-design-patterns]] — refactor toward patterns
- [[../sdlc/CON-technical-debt]] — refactoring reduces tech debt
- [[../../00-MOC/MOC-Developer-Fundamentals]]
