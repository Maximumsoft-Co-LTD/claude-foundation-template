---
type: concept
tags: [architecture, DDD, domain, strategic, tactical, bounded-context]
related: [CON-clean-architecture, CON-microservices-patterns, CON-event-driven-architecture, CON-database-patterns]
updated: 2026-03-25
source: template
---

# Domain-Driven Design (DDD)

**Definition:** A set of principles and patterns for designing software based on deep understanding of the problem domain. Emphasizes collaboration between domain experts and developers, and organizes code around domain concepts (not technical layers).

## Strategic DDD (Big Picture)

Strategic DDD answers: "How should we organize our entire system?"

### Ubiquitous Language

A shared vocabulary between domain experts and developers that:
- Uses domain terminology, not database/technical jargon
- Documents in code, tests, diagrams, and conversations
- Prevents misalignment between business intent and implementation

**Example: Wrong vs Right**

❌ Wrong: "Let's add a `user_records` table with `subscription_status` column"
✅ Right: "A Customer can have active, cancelled, or expired Subscriptions"

### Bounded Context

A boundary within which a domain model applies consistently.

- One team owns one bounded context
- Explicit interfaces between contexts
- Same term can mean different things in different contexts

**Example: E-Commerce System**

```
┌─────────────────────────────────────────────────┐
│ Order Context                                     │
│  - Order (aggregate root)                        │
│  - LineItem (value object)                       │
│  - Order Status (Pending → Confirmed → Shipped)  │
└─────────────────────────────────────────────────┘
                    ↓↑ (Published Language)
┌─────────────────────────────────────────────────┐
│ Payment Context                                   │
│  - Payment (aggregate root)                      │
│  - PaymentStatus (Processing → Succeeded → Done) │
│  - Uses Order ID, not Order object               │
└─────────────────────────────────────────────────┘
                    ↓↑ (Anti-Corruption Layer)
┌─────────────────────────────────────────────────┐
│ Fulfillment Context                              │
│  - Shipment (aggregate root)                     │
│  - Maps Order to internal Picking/Packing steps  │
└─────────────────────────────────────────────────┘
```

### Context Map

Documents relationships between bounded contexts:

| Relationship | Pattern | Definition |
|---|---|---|
| **Published Language** | A→B reads B's events/API contracts | Formal, explicit interface |
| **Open Host Service** | A provides service to multiple consumers | REST API, well-documented |
| **Shared Kernel** | A↔B share domain model | Minimize; risky |
| **Customer-Supplier** | A depends on B, teams align | A has input on B's roadmap |
| **Conformist** | A depends on B, B unaware | A adapts to B's model |
| **Anti-Corruption Layer** | A depends on B, B is legacy/external | Adapter translates B's model |
| **Separate Ways** | A and B don't interact | Duplicate small amount of logic |

## Tactical DDD (Implementation Patterns)

### Value Object

An immutable object that has no identity; equality based on attributes.

```typescript
// BAD: primitive types scattered
const firstName = "John";
const lastName = "Doe";
const amount = 100;
const currency = "USD";

// GOOD: value objects
export class Money {
  constructor(readonly amount: number, readonly currency: string) {
    if (amount < 0) throw new Error("Amount must be positive");
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error("Currency mismatch");
    return new Money(this.amount + other.amount, this.currency);
  }
}

export class PersonName {
  constructor(readonly first: string, readonly last: string) {
    if (!first || !last) throw new Error("Name required");
  }

  fullName(): string {
    return `${this.first} ${this.last}`;
  }
}

const price = new Money(100, "USD");
const customer = new PersonName("John", "Doe");
```

**Benefits:** encapsulation, validation, domain language, immutability

### Entity

A mutable object with identity; two entities are equal if they have the same ID.

```typescript
export class Order {
  private id: string;
  private customerId: string;
  private status: OrderStatus;
  private lineItems: LineItem[] = [];

  constructor(id: string, customerId: string) {
    this.id = id;
    this.customerId = customerId;
    this.status = OrderStatus.PENDING;
  }

  addLineItem(product: Product, quantity: number): void {
    this.lineItems.push(new LineItem(product, quantity));
  }

  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error("Can only confirm pending orders");
    }
    this.status = OrderStatus.CONFIRMED;
  }

  equals(other: Order): boolean {
    return this.id === other.id; // identity-based, not content
  }
}

const order1 = new Order("ORD-123", "CUST-456");
const order2 = new Order("ORD-123", "CUST-456");
// order1.equals(order2) === true (same ID)
// order1 === order2 (different objects, but same identity in domain)
```

### Aggregate

A cluster of entities and value objects treated as a unit for consistency.

**Rules:**
- One aggregate = one database transaction
- One aggregate root (entry point)
- Never hold references to other aggregate roots; use IDs instead
- Aggregate boundaries protect invariants

**Example: Order Aggregate**

```
Order (Root)
├── LineItem (Entity, can't exist outside Order)
│   └── Product ID (reference, not Product object)
└── OrderTotal (Value Object)
    ├── Subtotal (Money)
    ├── Tax (Money)
    └── Total (Money)

// NOT a reference to Payment; Order holds only PaymentID
```

```typescript
export class Order {
  private id: OrderId;
  private lineItems: LineItem[] = [];
  private customerId: CustomerId; // reference by ID
  private paymentId?: PaymentId; // reference by ID, NOT Payment object

  addLineItem(productId: ProductId, quantity: number, price: Money): void {
    // Business rule: can't add items after shipped
    if (this.status === OrderStatus.SHIPPED) {
      throw new Error("Cannot modify shipped orders");
    }
    this.lineItems.push(new LineItem(productId, quantity, price));
  }

  confirmPayment(paymentId: PaymentId): void {
    this.paymentId = paymentId;
    this.status = OrderStatus.CONFIRMED;
  }

  // Aggregate protects its invariants
  private validateInvariants(): void {
    if (this.lineItems.length === 0) throw new Error("Order must have items");
    if (this.customerId === null) throw new Error("Order must have customer");
  }
}
```

### Repository

An interface (port) that acts as a collection-like abstraction over persistence.

```typescript
// PORT (in application layer)
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findByCustomerId(customerId: CustomerId): Promise<Order[]>;
  delete(id: OrderId): Promise<void>;
}

// ADAPTER (in infrastructure layer)
export class PostgresOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    const sql = "INSERT INTO orders (id, customer_id, status) VALUES (?, ?, ?)";
    await this.db.query(sql, [order.id, order.customerId, order.status]);
  }

  async findById(id: OrderId): Promise<Order | null> {
    const result = await this.db.query("SELECT * FROM orders WHERE id = ?", [id]);
    return result.length ? this.toDomain(result[0]) : null;
  }

  private toDomain(raw: any): Order {
    // Map from database row to Order aggregate
    const order = new Order(raw.id, raw.customer_id);
    // ... reconstruct aggregate
    return order;
  }
}
```

### Domain Service

A stateless service containing logic that doesn't fit in a single entity or value object.

```typescript
// Belongs to Pricing domain
export class PricingService {
  calculateDiscount(
    totalAmount: Money,
    customerType: CustomerType,
    appliedCoupons: Coupon[]
  ): Money {
    let discount = new Money(0, totalAmount.currency);

    // VIP customers get 10%
    if (customerType === CustomerType.VIP) {
      discount = totalAmount.multiply(0.1);
    }

    // Apply coupon discounts
    for (const coupon of appliedCoupons) {
      discount = discount.add(coupon.value);
    }

    return discount;
  }
}

// Usage in application layer
const useCase = new CheckoutUseCase(pricingService, orderRepository);
```

### Domain Event

Something significant that happened in the domain; other parts of the system may need to react.

```typescript
export class OrderConfirmedEvent {
  constructor(
    readonly orderId: OrderId,
    readonly customerId: CustomerId,
    readonly confirmedAt: Date,
    readonly totalAmount: Money
  ) {}
}

// In Order aggregate
export class Order {
  private uncommittedEvents: DomainEvent[] = [];

  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error("Only pending orders can be confirmed");
    }
    this.status = OrderStatus.CONFIRMED;

    // Record event
    this.uncommittedEvents.push(
      new OrderConfirmedEvent(this.id, this.customerId, new Date(), this.total)
    );
  }

  getUncommittedEvents(): DomainEvent[] {
    return this.uncommittedEvents;
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }
}

// Application layer publishes events
export class ConfirmOrderUseCase {
  async execute(orderId: OrderId): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    order.confirm();
    await this.orderRepository.save(order);

    // Publish events → triggers payment processing, inventory updates, etc.
    for (const event of order.getUncommittedEvents()) {
      await this.eventPublisher.publish(event);
    }
    order.clearUncommittedEvents();
  }
}
```

### Factory

A pattern for creating complex aggregates with invariant validation.

```typescript
export class OrderFactory {
  create(customerId: CustomerId, items: OrderLineItem[]): Order {
    // Invariants checked before creation
    if (!customerId) throw new Error("Customer required");
    if (items.length === 0) throw new Error("Order must have items");

    const order = new Order(OrderId.generate(), customerId);
    for (const item of items) {
      order.addLineItem(item.productId, item.quantity, item.price);
    }

    return order;
  }
}
```

## Bounded Context → Microservice Mapping

| Level | Concept | Mapped To |
|-------|---------|-----------|
| Domain | Subdomain (problem space) | Business capability |
| Bounded Context | Explicit consistency boundary | Microservice |
| Aggregate | Consistency unit | Database transaction |
| Entity | Identity-based object | Database record |
| Value Object | Immutable attribute | Embedded column/JSON |

**Example: E-Commerce Domain**

```
Subdomains:
  - Catalog (product info)
  - Order Management (create, confirm, ship orders)
  - Inventory (stock levels)
  - Payments (process payments)
  - Shipping (coordinate delivery)

Bounded Contexts (and Microservices):
  - Catalog Service (owns Product model)
  - Order Service (owns Order model, references Product by ID)
  - Inventory Service (owns Stock model)
  - Payment Service (owns Payment model)
  - Shipping Service (owns Shipment model)

Aggregates (consistency units):
  - Product (root) ← Catalog context
  - Order (root) ← Order context
  - Stock (root) ← Inventory context
  - Payment (root) ← Payment context
```

## Implementation Checklist

- [ ] Established ubiquitous language with domain experts
- [ ] Identified bounded contexts and context map
- [ ] Modeled core aggregates with entities and value objects
- [ ] Aggregates enforce their own invariants
- [ ] Repositories as ports (interfaces), not implementations
- [ ] No references between aggregate roots; use IDs
- [ ] Domain events published for cross-context communication
- [ ] Service layer for logic spanning multiple aggregates
- [ ] Factories for complex aggregate creation
- [ ] Domain model independent of persistence framework

## Common Pitfalls

❌ **Skipping domain analysis** — jumping to code without understanding domain
❌ **Wrong aggregate boundaries** — too large (harder to change) or too small (no invariant protection)
❌ **Entities holding references to other aggregate roots** — creates tight coupling
❌ **Domain logic in service layer** — anemic entities, logic scattered
❌ **Value objects as mutable** — defeats the purpose of value object pattern

## Related Notes

- [[CON-clean-architecture]] — DDD entities fit cleanly in innermost circles
- [[CON-event-driven-architecture]] — domain events drive async communication
- [[CON-microservices-patterns]] — each context becomes a service boundary
- [[CON-database-patterns]] — repository pattern enables DB independence
