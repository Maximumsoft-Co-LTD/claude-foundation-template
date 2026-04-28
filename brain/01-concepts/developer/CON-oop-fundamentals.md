---
type: concept
tags: [oop, programming, fundamentals, design]
related: [CON-solid-principles, CON-design-patterns, CON-clean-code]
updated: 2026-04-29
source: template
---

# OOP Fundamentals — The Four Pillars

## Core idea

Object-Oriented Programming organizes code around **objects** that bundle data and behavior. Four pillars define what makes OOP "OOP": **Encapsulation, Inheritance, Polymorphism, Abstraction**.

In 2026, knowing the pillars is necessary but not sufficient — the real skill is **how objects connect**, and modern OOP strongly favors **composition over inheritance** (Gang of Four).

## The four pillars

### 1. Encapsulation — hide state behind methods

Bundle data with the methods that operate on it; expose only what callers need.

```ts
class BankAccount {
  #balance: number;          // private — caller cannot touch directly
  deposit(amount: number) {  // public — controlled mutation
    if (amount <= 0) throw new Error("invalid");
    this.#balance += amount;
  }
  get balance() { return this.#balance; } // read-only access
}
```

**Why:** invariants stay enforced. The `BankAccount` cannot have a negative balance because all paths to mutation go through `deposit()`.

### 2. Inheritance — `is-a` relationships

A subclass inherits attributes and methods from a superclass.

```ts
class Vehicle { move() { ... } }
class Car extends Vehicle { honk() { ... } }
```

**When to use:** the subclass truly **is** a kind of the superclass (Liskov substitutable). A `Car` is a `Vehicle`. `String` is **not** a `byte[]` even though it contains one.

**When NOT to use:** code reuse alone. If you're inheriting only to share helper methods, prefer composition.

### 3. Polymorphism — same interface, different behaviors

The same method call dispatches to different implementations based on runtime type.

```ts
abstract class Shape { abstract area(): number; }
class Circle extends Shape { area() { return Math.PI * this.r ** 2; } }
class Square extends Shape { area() { return this.s ** 2; } }

shapes.forEach(s => console.log(s.area()));  // each shape computes its own area
```

Two flavors:
- **Subtype polymorphism** (above) — runtime dispatch via inheritance
- **Parametric polymorphism** (generics) — `Array<T>` works for any `T`

### 4. Abstraction — expose intent, hide mechanism

Define **what** an object does without committing to **how** it does it.

```ts
interface Cache {           // abstraction
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}
class RedisCache implements Cache { ... }   // implementation
class InMemoryCache implements Cache { ... } // implementation
```

The rest of the code depends on `Cache`, not on Redis or in-memory specifics. Swap implementations without rewriting callers.

## Composition over inheritance

The 2026 consensus: **prefer composition** unless the relationship is truly `is-a`.

**Inheritance** (`Car extends Vehicle`) — tight coupling, fragile across deep hierarchies.
**Composition** (`Car has-a Engine`) — flexible, testable, follows Dependency Inversion ([[CON-solid-principles]]).

The "diamond problem", brittle base class problem, and the inability to change a parent class after the fact are all reasons modern code reaches for composition first.

```ts
// inheritance — locks Car into a single Vehicle hierarchy
class Car extends Vehicle { ... }

// composition — Car owns an Engine, swappable
class Car {
  constructor(private engine: Engine, private wheels: Wheel[]) {}
}
```

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| **God class** | One class with 50+ methods covering 5+ concerns | Extract by SRP |
| **Anemic domain model** | Objects with only getters/setters, logic in services | Move behavior into the object |
| **Inheritance for code reuse** | `class FastSet extends HashMap` (HashMap isn't a kind of Set) | Use composition |
| **Public mutable state** | `account.balance = -1000;` works | Make state private; expose methods |
| **Premature abstraction** | Interface with one implementation for "future flexibility" | Add the abstraction when the second impl appears |

## OOP vs FP — when to reach for which

| OOP shines | FP shines |
|------------|-----------|
| Stateful entities with lifecycle (User, Order, Connection) | Pure transformations on data (parsers, pipelines) |
| Polymorphic dispatch over heterogeneous types | Composing operations over uniform data |
| Modeling a real-world domain (DDD aggregates) | Math, transforms, signal processing |

Most modern code is a hybrid. Use OOP for entities; use FP for data flow inside them.

## Related

- [[CON-solid-principles]] — design rules that govern good OOP
- [[CON-design-patterns]] — Gang of Four patterns rest on the four pillars
- [[CON-functional-programming]] — the alternative paradigm
- [[CON-clean-code]] — naming and structure for OOP code
- [[CON-architecture/CON-domain-driven-design]] — OOP modeling at the architecture level
