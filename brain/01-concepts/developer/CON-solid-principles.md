---
type: concept
tags: [developer, SOLID, OOP, design-principles, clean-code]
related: [CON-clean-code, CON-design-patterns, CON-refactoring]
updated: 2026-03-25
source: template
---

# SOLID Principles

## S — Single Responsibility Principle

**"A class should have only one reason to change"**

```typescript
// ❌ Bad — does too many things
class UserService {
  createUser(data) { /* save to DB */ }
  sendWelcomeEmail(user) { /* send email */ }
  generateReport() { /* generate CSV */ }
}

// ✅ Good — each class has one job
class UserService { createUser(data) { ... } }
class EmailService { sendWelcomeEmail(user) { ... } }
class ReportService { generateUserReport() { ... } }
```

---

## O — Open/Closed Principle

**"Open for extension, closed for modification"**

```typescript
// ❌ Bad — modify class every time new payment method added
class PaymentProcessor {
  process(type: string, amount: number) {
    if (type === 'credit') { ... }
    else if (type === 'paypal') { ... }
    // Add new else if for every new method?
  }
}

// ✅ Good — extend by adding new class
interface PaymentMethod { process(amount: number): void }
class CreditCardPayment implements PaymentMethod { ... }
class PayPalPayment implements PaymentMethod { ... }
// Add new method = new class, no existing code changed
```

---

## L — Liskov Substitution Principle

**"Subclasses must be substitutable for their base class"**

```typescript
// ❌ Bad — Square breaks Rectangle behavior
class Rectangle { setWidth(w) { } setHeight(h) { } }
class Square extends Rectangle {
  setWidth(w) { this.width = this.height = w }  // ← changes height too!
}
// Using Square as Rectangle breaks expected behavior

// ✅ Good — use composition or separate abstractions
class Shape { area(): number { } }
class Rectangle extends Shape { }
class Square extends Shape { }
```

---

## I — Interface Segregation Principle

**"Clients should not depend on interfaces they don't use"**

```typescript
// ❌ Bad — fat interface forces unnecessary implementation
interface Worker {
  work(): void
  eat(): void    // Robots don't eat
  sleep(): void  // Robots don't sleep
}

// ✅ Good — small, focused interfaces
interface Workable { work(): void }
interface Eatable { eat(): void }
interface Sleepable { sleep(): void }

class Human implements Workable, Eatable, Sleepable { ... }
class Robot implements Workable { ... }  // No eat/sleep needed
```

---

## D — Dependency Inversion Principle

**"Depend on abstractions, not concretions"**

```typescript
// ❌ Bad — UserService depends on concrete MySQLRepository
class UserService {
  private repo = new MySQLUserRepository()  // ← hard dependency
}

// ✅ Good — depends on interface, concrete injected
interface UserRepository { findById(id: string): User }

class UserService {
  constructor(private repo: UserRepository) {}  // ← injection
}

// Can now inject different repos (MySQL, PostgreSQL, InMemory for tests)
new UserService(new MySQLUserRepository())
new UserService(new InMemoryUserRepository())  // for tests
```

## Why SOLID Matters

| Without SOLID | With SOLID |
|--------------|-----------|
| Hard to test (tight coupling) | Easy to mock dependencies |
| One change breaks many things | Changes localized to one place |
| Hard to add features | New features = new classes |
| Can't understand code in isolation | Each piece self-contained |

## Related

- [[CON-clean-code]] — naming, structure
- [[CON-design-patterns]] — SOLID enables patterns
- [[CON-refactoring]] — refactor toward SOLID
- [[../../../00-MOC/MOC-Developer-Fundamentals]]
