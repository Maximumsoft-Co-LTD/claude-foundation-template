---
type: concept
tags: [developer, clean-code, naming, DRY, KISS, YAGNI, refactoring]
related: [CON-solid-principles, CON-refactoring, CON-code-review-checklist]
updated: 2026-03-25
source: template
---

# Clean Code

## Core Principles

| Principle | Rule |
|-----------|------|
| **DRY** | Don't Repeat Yourself — extract shared logic |
| **KISS** | Keep It Simple, Stupid — simplest solution first |
| **YAGNI** | You Aren't Gonna Need It — don't build for future guesses |
| **SRP** | Single Responsibility — one reason to change |
| **Fail Fast** | Validate/check early, fail loudly |

## Naming

```typescript
// ❌ Bad names
const d = new Date()
function proc(u) { ... }
let x = users.filter(u => u.a > 18)

// ✅ Good names
const currentDate = new Date()
function processUserApplication(user: User) { ... }
let adultUsers = users.filter(user => user.age > 18)

// Boolean naming: is/has/can/should
const isLoggedIn = true
const hasPermission = false
const canEdit = true

// Function naming: verb + noun
getUserById()
createOrder()
validateEmail()
calculateTotalPrice()
```

## Functions

```typescript
// ❌ Bad — does too much, long, hard to test
function handleUser(user, action, ctx) {
  if (action === 'create') {
    // 50 lines of creation logic
  } else if (action === 'update') {
    // 50 lines of update logic
  }
  // ...sends email, logs, updates cache
}

// ✅ Good — small, single purpose
function createUser(input: CreateUserInput): Promise<User> { ... }
function updateUser(id: string, changes: Partial<User>): Promise<User> { ... }
// Each function: < 20 lines, does ONE thing, testable alone
```

**Rules:**
- Functions do ONE thing
- Max 20 lines (guideline, not law)
- Max 3-4 parameters (more → create an object)
- Avoid flag parameters (`sendEmail(user, true)` → what is `true`?)

## Comments

```typescript
// ❌ Redundant comment — code is clear
// Set user name to the provided name
user.name = providedName

// ❌ Outdated comment (worse than no comment)
// Validate email format (was removed 3 months ago)
// No code below

// ✅ Explain WHY, not WHAT
// Using bcrypt with 12 rounds — MD5/SHA1 insufficient for passwords
const hash = await bcrypt.hash(password, 12)

// ✅ Explain complex business rules
// Per regulatory requirement SB-2024-001:
// accounts inactive > 90 days must be suspended, not deleted
if (daysSinceLastLogin > 90) {
  await suspendAccount(user.id)
}
```

**Rule:** If you feel the need to explain WHAT the code does → rewrite the code. Comments explain WHY.

## Avoid Magic Numbers/Strings

```typescript
// ❌ Magic numbers
if (user.age < 18) { ... }
setTimeout(fn, 86400000)

// ✅ Named constants
const MINIMUM_AGE = 18
const ONE_DAY_MS = 24 * 60 * 60 * 1000

if (user.age < MINIMUM_AGE) { ... }
setTimeout(fn, ONE_DAY_MS)
```

## Error Handling

```typescript
// ❌ Silently swallow errors
try {
  await processPayment(order)
} catch (e) {
  console.log(e)  // Error disappears
}

// ✅ Handle meaningfully
try {
  await processPayment(order)
} catch (error) {
  logger.error('Payment processing failed', { orderId: order.id, error })
  await notifyPaymentTeam(order, error)
  throw new PaymentFailedError(`Order ${order.id}: ${error.message}`)
}
```

## Related

- [[CON-solid-principles]] — structural principles
- [[CON-refactoring]] — how to improve existing code
- [[CON-code-review-checklist]] — apply clean code in reviews
- [[../../../00-MOC/MOC-Developer-Fundamentals]]
