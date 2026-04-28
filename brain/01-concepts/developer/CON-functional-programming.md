---
type: concept
tags: [fp, programming, fundamentals, paradigm]
related: [CON-oop-fundamentals, CON-clean-code, CON-concurrency-parallelism]
updated: 2026-04-29
source: template
---

# Functional Programming Fundamentals

## Core idea

Functional Programming (FP) builds programs from **pure functions** applied to **immutable data**. Computations flow through transformations; side effects are isolated and explicit.

The slogan: **"Programs = Data + Functions, no hidden state."**

## The four pillars of FP

### 1. Pure functions

A function is **pure** if:
- Same input → same output (deterministic)
- No side effects (no I/O, no mutation of external state)

```ts
// Pure
const add = (a: number, b: number) => a + b;

// Impure — depends on Date.now()
const stamp = (msg: string) => `${Date.now()}: ${msg}`;

// Impure — mutates external state
const log = (msg: string) => { logs.push(msg); };
```

**Why:** pure functions are easy to test (no setup), easy to reason about (no hidden inputs), and **safe to parallelize** (no shared mutation → no race conditions).

### 2. Immutability

Once created, data does not change. Updates produce **new** values.

```ts
// Mutation (avoid in FP)
arr.push(x);

// Immutable update (FP idiom)
const next = [...arr, x];

// Object update
const updated = { ...user, email: "new@example.com" };
```

**Why:** no aliasing bugs (passing a reference can't surprise you), trivially safe for concurrency, history is preserved (you still have the old value).

**Cost:** more allocations. Mitigated by structural sharing in libraries like Immer / Immutable.js.

### 3. Higher-order functions

Functions that take or return other functions.

```ts
// Take a function as parameter
[1,2,3].map(x => x * 2)    // map takes (x) => x*2
[1,2,3].filter(x => x > 1)
[1,2,3].reduce((sum, x) => sum + x, 0)

// Return a function
const adder = (n: number) => (x: number) => x + n;
const add5 = adder(5);
add5(3);  // 8
```

**Why:** abstraction over computation. `map`, `filter`, `reduce` capture iteration patterns; you supply the per-element logic. Composition replaces explicit loops.

### 4. Function composition

Build complex transformations by chaining simple ones.

```ts
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const processName = pipe(
  (s: string) => s.trim(),
  (s: string) => s.toLowerCase(),
  (s: string) => s.replace(/\s+/g, "-")
);

processName("  Hello World  ");  // "hello-world"
```

Each step is small, pure, testable. The pipeline is the program.

## Monads — taming side effects

A monad wraps a value plus a context (Maybe = optional, Either = error or result, IO = effect, Promise = async). Two operations:

- `return / of` — wrap a value: `Maybe.of(5) → Maybe(5)`
- `bind / flatMap / chain` — apply a function that itself returns a monad

```ts
// Without Maybe — null checks scattered
function getCity(user) {
  if (!user) return null;
  if (!user.address) return null;
  return user.address.city ?? null;
}

// With Maybe — null check is the monad's responsibility
const city = Maybe.of(user)
  .map(u => u.address)
  .map(a => a.city);
```

**Why monads:** they let you compose effectful code as if it were pure, surfacing the effect (`Maybe`, `Either`, `Promise`, etc.) in the type rather than hiding it in flow control.

## Side-effect isolation

Effects (DB writes, HTTP calls, file I/O, randomness, time) are unavoidable in real software. FP doesn't eliminate them — it **isolates** them.

Pattern: **functional core, imperative shell**.
- The core is pure functions over data
- The shell calls the core, then performs effects with the result

```ts
// Pure core
const calculatePrice = (cart: Cart, discounts: Discount[]) => { ... }

// Imperative shell
async function checkout(cartId) {
  const cart = await db.cart.find(cartId);            // effect
  const discounts = await db.discounts.active();      // effect
  const price = calculatePrice(cart, discounts);      // pure
  await stripe.charge(cart.userId, price);            // effect
}
```

This is testable: the core has unit tests with no mocks; the shell has integration tests.

## When to reach for FP

- **Data transformation pipelines** (ETL, parsers, compilers)
- **Concurrent / parallel code** (immutable = lock-free)
- **Stream processing** (RxJS, Akka Streams)
- **State management** (Redux is FP — reducers are pure functions)
- **Math, algorithmic code** (functions compose like math functions)

## When OOP fits better

- **Long-lived stateful entities** with their own lifecycle (User, Connection)
- **Polymorphism over heterogeneous types** (the visitor pattern is awkward in FP)
- **Modeling a domain** (DDD aggregates)

## Anti-patterns in FP

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| **Hidden mutation** | Pure function returning a list that aliases an internal one | Defensive copy or use a persistent collection |
| **Lambda soup** | 7 nested `.map().filter().reduce()` | Name intermediate values; extract helpers |
| **Monad transformer hell** | `IO<Either<Maybe<T>>>` | Use a single effect type (e.g., fp-ts `Task`) or decompose |
| **Premature point-free** | `pipe(filter(gt(0)), map(mul(2)))` instead of `xs => xs.filter(...).map(...)` | Readability beats cleverness |

## Related

- [[CON-oop-fundamentals]] — the alternative paradigm
- [[CON-clean-code]] — both paradigms agree on naming and clarity
- [[CON-concurrency-parallelism]] — FP's immutability is concurrency's friend
