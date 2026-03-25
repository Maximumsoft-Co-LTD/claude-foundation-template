---
type: concept
tags: [architecture, clean-architecture, hexagonal, onion, SOLID]
related: [CON-solid-principles, CON-domain-driven-design, CON-backend-layers, CON-microservices-patterns]
updated: 2026-03-25
---

# Clean Architecture

**Definition:** An architectural approach that organizes code into concentric circles where dependencies point inward only. Domain logic remains independent of frameworks, databases, and external systems.

## The Four Circles (Innermost to Outermost)

### 1. **Entities** (Innermost)
- Core business objects with business rules
- Framework-agnostic plain classes (no annotations)
- Represent concepts that could be reused across projects
- Example: `User`, `Order`, `Account` classes

### 2. **Use Cases** (Application Business Rules)
- Orchestrate entities to implement user workflows
- One use case per user story
- No dependencies on frameworks or databases
- Example: `CreateOrderUseCase`, `ProcessPaymentUseCase`
- Dependencies point downward to Entities

### 3. **Interface Adapters** (Controllers, Gateways, Presenters)
- Convert external data formats to internal use case format
- Controllers: translate HTTP → use case input
- Gateways: translate use case → database queries
- Presenters: translate use case output → HTTP response
- Dependencies point inward to use cases

### 4. **Frameworks & Drivers** (Outermost)
- Web frameworks (Express, Spring, Django)
- Databases (PostgreSQL, MongoDB)
- HTTP libraries, file systems
- Thin layer — orchestration only

## The Dependency Rule

**Source code dependencies can only point inward.** Nothing in an inner circle can know about outer circles.

- Entities know nothing about use cases
- Use cases know nothing about frameworks
- Controllers know about use cases but not vice versa
- Framework changes do not force inner code changes

## Hexagonal Architecture (Ports & Adapters)

A variant emphasizing external dependencies:

```
┌─────────────────────────────────────┐
│        Application (Domain)         │
│  ┌──────────────────────────────┐   │
│  │   Use Cases & Entities       │   │
│  └──────────────────────────────┘   │
│         ↑            ↑              │
│      PORT 1       PORT 2            │
└──────────┼─────────┼────────────────┘
           │         │
    ADAPTER 1    ADAPTER 2
    (REST API)   (Database)
```

- **Ports:** interfaces that define contracts (UserRepository, PaymentGateway)
- **Adapters:** implementations (PostgresUserRepository, StripePaymentGateway)
- Database adapter swapped → use cases unchanged

## Folder Structure Example

```
src/
├── domain/                       # Entities & business rules
│   ├── User.ts
│   ├── Order.ts
│   └── exceptions/
├── application/                  # Use cases
│   ├── CreateOrderUseCase.ts
│   ├── GetUserUseCase.ts
│   └── ports/                    # Interfaces (contracts)
│       ├── UserRepository.ts     # Port
│       └── PaymentGateway.ts     # Port
├── infrastructure/               # Adapters & frameworks
│   ├── repositories/
│   │   └── PostgresUserRepository.ts  # Adapter
│   ├── gateways/
│   │   └── StripePaymentGateway.ts   # Adapter
│   ├── http/
│   │   └── UserController.ts         # HTTP Adapter
│   └── config/
│       └── DatabaseConfig.ts
└── main.ts                       # Framework entry point
```

## Comparison: Layered vs Clean vs Hexagonal

| Aspect | Layered | Clean | Hexagonal |
|--------|---------|-------|-----------|
| **Dependency Direction** | Downward only | Inward only | Inward only |
| **Domain Isolation** | Weak | Strong | Strong |
| **Testability** | Moderate | High | High |
| **Database Independence** | No | Yes | Yes |
| **Framework Independence** | No | Yes | Yes |
| **Complexity** | Low | Medium | Medium |
| **Best For** | Simple CRUD apps | Complex domains | Plugin-based systems |

## Benefits

✅ **Testability** — mock external dependencies, test domain logic in isolation
✅ **Maintainability** — changes in framework don't ripple to business logic
✅ **Framework Independence** — swap Express for Fastify without touching domain
✅ **Database Independence** — switch PostgreSQL to MongoDB; repositories handle it
✅ **Clarity** — domain intent is explicit, not buried in framework annotations
✅ **Scalability** — clear boundaries between concerns

## Common Mistakes

❌ **Leaking Framework into Domain**
```typescript
// BAD: @Entity annotation in domain
import { Entity, Column } from 'typeorm';

@Entity()
export class User {
  @Column() name: string;
}
```

✅ **Correct: Framework-agnostic domain**
```typescript
// GOOD: Plain domain class
export class User {
  constructor(public name: string) {}
}

// Adapter maps to framework
@Entity()
export class UserORM {
  @Column() name: string;
}
```

❌ **Use Case Knowing About HTTP**
```typescript
// BAD: use case imports Express
export class CreateUserUseCase {
  execute(req: Request): Response { // coupled to HTTP
    // ...
  }
}
```

✅ **Correct: Use case agnostic to delivery**
```typescript
// GOOD: DTO passed, domain logic returns result
export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface CreateUserResponse {
  userId: string;
  name: string;
}

export class CreateUserUseCase {
  execute(request: CreateUserRequest): CreateUserResponse {
    // pure logic
  }
}

// HTTP Controller adapts to use case
@Post('/users')
async createUser(req: Request): Promise<Response> {
  const result = await useCase.execute({
    name: req.body.name,
    email: req.body.email,
  });
  return res.json(result);
}
```

## When to Use Clean Architecture

- ✅ Domain-heavy applications (complex business rules)
- ✅ Long-lived systems (worth the upfront design cost)
- ✅ Multiple delivery mechanisms (REST, gRPC, CLI)
- ✅ High test coverage requirements
- ❌ CRUD-only apps (over-engineered)
- ❌ Rapid prototypes (too much ceremony)

## Implementation Checklist

- [ ] Domain classes are framework-free POJOs/POTSs
- [ ] Use cases are one per workflow
- [ ] Repositories are interfaces (ports) in application layer
- [ ] Controllers/handlers map external data to use case DTOs
- [ ] No imports from outer layers to inner layers
- [ ] Business logic is testable without database/HTTP
- [ ] Framework could be swapped without changing domain

## Related Notes

- [[CON-solid-principles]] — principles that Clean Architecture enables
- [[CON-domain-driven-design]] — DDD entities & aggregates fit cleanly here
- [[CON-backend-layers]] — how layers are structured in practice
- [[CON-microservices-patterns]] — clean architecture at service boundary
