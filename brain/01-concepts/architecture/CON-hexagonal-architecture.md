---
type: concept
tags: [architecture, hexagonal, ports-adapters, onion, testability]
related: [CON-clean-architecture, CON-domain-driven-design, CON-backend-layers, CON-solid-principles]
updated: 2026-05-08
source: template
---

# Hexagonal Architecture (Ports & Adapters)

**Definition:** An architectural style by Alistair Cockburn where the application core defines **ports** (interfaces) for everything it needs from the outside, and the outside world plugs in via **adapters** (implementations). The core depends on no framework, no database, no transport.

The hexagon shape is symbolic — it implies "many sides," not exactly six. Each side is a port.

## The Core Idea

```
                    ┌──────────────────────┐
                    │   HTTP Adapter       │
                    │   (REST controller)  │
                    └──────────┬───────────┘
                               │ drives
              ┌────────────────┼────────────────┐
              │                ↓                │
   ┌──────────┴────────┐  ┌─────────┴─────────┐ │
   │  CLI Adapter      │→ │  Application Core │ │
   │  (cobra command)  │  │                   │ │
   └───────────────────┘  │  Use Cases        │ │
                          │  + Domain Model   │ │
   ┌───────────────────┐  │                   │ │
   │  Test Adapter     │→ │                   │ │
   │  (in-memory)      │  └─────────┬─────────┘ │
   └───────────────────┘            │ uses      │
                                    ↓           │
                          ┌─────────┴──────────┐│
                          │  Repository Port   ││
                          │  (interface)       ││
                          └─────────┬──────────┘│
                                    │ impl by   │
                  ┌─────────────────┼───────────┤
                  ↓                 ↓           ↓
        ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
        │ Postgres        │ │ Mongo        │ │ In-memory    │
        │ Adapter         │ │ Adapter      │ │ Adapter      │
        └─────────────────┘ └──────────────┘ └──────────────┘
```

Two kinds of port:

| Port type | Direction | Who calls whom | Example |
|---|---|---|---|
| **Driving (primary)** | outside → core | adapter drives the core | HTTP controller → `CreateOrderUseCase` |
| **Driven (secondary)** | core → outside | core calls a port; adapter implements it | `UserRepository` interface implemented by `PostgresUserRepository` |

The Dependency Inversion Principle is what makes this work: both sides depend on the port (an abstraction), never on each other directly.

## Folder Structure (Hexagonal-Flavored)

```
src/
├── domain/                       # Pure business model, zero imports from outer
│   ├── User.ts
│   ├── Order.ts
│   └── exceptions/
├── application/                  # Use cases + ports
│   ├── usecases/
│   │   ├── CreateOrderUseCase.ts
│   │   └── GetUserUseCase.ts
│   └── ports/
│       ├── driving/              # Inbound contracts (rare to declare; usually = use case classes)
│       │   └── OrderService.ts
│       └── driven/               # Outbound contracts (the common case)
│           ├── UserRepository.ts
│           ├── PaymentGateway.ts
│           └── EmailSender.ts
├── adapters/
│   ├── driving/                  # Inbound — drives the core
│   │   ├── http/
│   │   │   └── UserController.ts
│   │   ├── cli/
│   │   │   └── CreateUserCommand.ts
│   │   └── grpc/
│   │       └── UserGrpcHandler.ts
│   └── driven/                   # Outbound — implements driven ports
│       ├── postgres/
│       │   └── PostgresUserRepository.ts
│       ├── mongo/
│       │   └── MongoUserRepository.ts
│       └── stripe/
│           └── StripePaymentGateway.ts
└── main.ts                       # Composition root: wire adapters to ports
```

The split `adapters/driving/` vs `adapters/driven/` is the visual signature of hexagonal — Clean Architecture lumps both under "interface adapters."

## Code Example (Port + Adapter)

### Driven port (interface in core)

```typescript
// application/ports/driven/UserRepository.ts
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

### Use case depends on the port, not on a concrete DB

```typescript
// application/usecases/CreateUserUseCase.ts
export class CreateUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { name: string; email: string }): Promise<User> {
    const user = User.create(input.name, input.email);
    await this.users.save(user);
    return user;
  }
}
```

### Adapter implements the port

```typescript
// adapters/driven/postgres/PostgresUserRepository.ts
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return row.rowCount === 0 ? null : User.fromRow(row.rows[0]);
  }

  async save(user: User): Promise<void> {
    await this.db.query('INSERT INTO users ...', [user.id, user.name, user.email]);
  }
}
```

### Composition root wires it together

```typescript
// main.ts
const db = new Pool({ ... });
const userRepo: UserRepository = new PostgresUserRepository(db);
const createUser = new CreateUserUseCase(userRepo);
// HTTP adapter receives the use case
app.post('/users', new UserController(createUser).handle);
```

Swap Postgres for Mongo? Replace one line in `main.ts`. Use case unchanged. Tests unchanged.

## Test Strategy (the killer feature)

```typescript
// Test the use case with an in-memory adapter — no DB, no HTTP, no mocks at port boundary
class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, User>();
  async findById(id: string) { return this.users.get(id) ?? null; }
  async save(user: User) { this.users.set(user.id, user); }
}

test('create user persists', async () => {
  const repo = new InMemoryUserRepository();
  const useCase = new CreateUserUseCase(repo);
  const result = await useCase.execute({ name: 'A', email: 'a@x.io' });
  expect(await repo.findById(result.id)).toEqual(result);
});
```

The in-memory adapter is **not a mock** — it's a real implementation of the port. That's why it's robust: changing the port forces changing both the prod and test adapters together.

## Hexagonal vs Clean Architecture

They are siblings, not rivals. Both enforce the same Dependency Rule.

| Aspect | Clean | Hexagonal |
|---|---|---|
| **Origin** | Robert C. Martin (2012) | Alistair Cockburn (2005) |
| **Mental model** | Concentric circles (Entities → Use Cases → Adapters → Frameworks) | Hexagon with ports on every side |
| **Layer count** | 4 named layers | 2 (core + adapters), each port-typed |
| **Naming spotlight** | "Use Case" is first-class | "Port" and "Adapter" are first-class |
| **Folder hint** | `domain / application / interface-adapters / infrastructure` | `domain / application / adapters/{driving,driven}` |
| **Best fit** | Domain-heavy services with rich use case orchestration | Plugin-style systems where the same core is driven by many frontends and persisted by swappable backends |

In practice they often **collapse to the same code** — the difference is the vocabulary the team uses to discuss it.

## When to Use Hexagonal

- ✅ Same domain logic exposed via multiple delivery channels (REST + gRPC + CLI + scheduled job)
- ✅ Persistence layer might change (Postgres now, Mongo later, or both at once)
- ✅ High test coverage on domain logic without touching real infra
- ✅ Multiple inbound clients with different shapes (mobile vs web vs partner API)
- ✅ Hexagonal *plus* DDD when bounded contexts are clear
- ❌ CRUD-only apps with one frontend and one DB — overhead with no payoff
- ❌ Throwaway prototypes
- ❌ Teams that won't enforce "no framework imports in core" — without discipline, the hexagon collapses

## Common Mistakes

❌ **Port owned by the adapter side**

```typescript
// BAD: port lives next to Postgres adapter, leaks SQL types
// adapters/postgres/UserRepository.ts
export interface UserRepository {
  findByQuery(sql: string): Promise<User[]>;  // SQL leaks into core
}
```

✅ **Port lives in the application layer, speaks the domain**

```typescript
// application/ports/driven/UserRepository.ts
export interface UserRepository {
  findActiveSince(date: Date): Promise<User[]>;  // domain language
}
```

❌ **Domain entity carries ORM annotations**

```typescript
@Entity()  // BAD — framework leaking into core
export class User { @Column() name: string; }
```

✅ **Separate domain entity from persistence model**

```typescript
// domain/User.ts — plain class, zero imports
export class User { constructor(public readonly id: string, public name: string) {} }

// adapters/driven/postgres/UserRow.ts — ORM annotations live here
@Entity() export class UserRow { @Column() name: string; /* ... */ }
```

❌ **Use case takes an HTTP `Request`** — couples core to Express/Fiber/etc. Pass a DTO instead.

❌ **One giant `Repository` port with 30 methods** — that's a leaky abstraction. Split per aggregate or per use case need.

❌ **Mocking the adapter in tests instead of writing an in-memory adapter** — mocks drift from the real implementation; an in-memory implementation forces both to honor the port contract.

## Implementation Checklist

- [ ] Domain has zero imports from `adapters/`, `infrastructure/`, or any framework
- [ ] Every external dependency (DB, queue, HTTP client, clock, randomness) goes through a driven port
- [ ] Driving adapters (HTTP/CLI/gRPC) translate to use case input/output — no business logic
- [ ] At least one test uses an in-memory adapter for each driven port
- [ ] Composition root (`main.ts` / `cmd/main.go` / `Program.cs`) is the only place where ports meet adapters
- [ ] Swapping one adapter for another requires changing only the composition root

## Related Notes

- [[CON-clean-architecture]] — sibling pattern; share the Dependency Rule, differ in vocabulary
- [[CON-domain-driven-design]] — pairs naturally; aggregates fill the core
- [[CON-backend-layers]] — pragmatic layered structure when full hexagonal is overkill
- [[CON-solid-principles]] — Dependency Inversion is the load-bearing principle here
