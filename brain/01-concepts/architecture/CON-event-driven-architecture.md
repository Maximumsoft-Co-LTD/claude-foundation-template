---
type: concept
tags: [architecture, event-driven, EDA, CQRS, event-sourcing, kafka, message-queue]
related: [CON-domain-driven-design, CON-async-patterns, CON-microservices-patterns, CON-database-patterns]
updated: 2026-03-25
source: template
---

# Event-Driven Architecture (EDA)

**Definition:** An architectural style where services communicate through events—immutable facts about something that happened in the system. Decouples producers from consumers, enabling loose coupling and asynchronous workflows.

## Core Concept: The Event

An **Event** is an immutable record of something significant that happened:

```typescript
export interface DomainEvent {
  eventId: string;           // Unique event ID
  eventType: string;         // "OrderPlaced", "PaymentProcessed"
  aggregateId: string;       // Root aggregate this event concerns
  aggregateType: string;     // "Order", "Payment"
  timestamp: Date;           // When it happened
  version: number;           // Aggregate version
  data: Record<string, any>; // Event payload
}

// Concrete example
export class OrderPlacedEvent implements DomainEvent {
  eventId = generateId();
  eventType = "OrderPlaced";
  aggregateType = "Order";
  timestamp = new Date();

  constructor(
    readonly aggregateId: string,
    readonly customerId: string,
    readonly items: { productId: string; quantity: number }[],
    readonly totalAmount: number,
    readonly version: number
  ) {}

  get data() {
    return {
      customerId: this.customerId,
      items: this.items,
      totalAmount: this.totalAmount,
    };
  }
}
```

## Event-Driven Architecture Patterns

### 1. Event Notification

Services publish events; other services react independently (no response expected).

```
Order Service         (publishes)      OrderPlacedEvent
    ↓                                       ↓
  saves order                    (subscribed to by)
    ↓                                       ↓
  publishes event          ┌───────────────┼───────────────┐
                           ↓               ↓               ↓
                     Payment Service  Inventory Service  Email Service
                     (processes payment) (reserves stock) (sends confirmation)
```

**Pros:** Loose coupling, parallel processing, scalable
**Cons:** No request-response, eventual consistency, harder to debug

```typescript
// Order Service publishes
await eventPublisher.publish(new OrderPlacedEvent(
  orderId, customerId, items, total, 1
));

// Payment Service subscribes independently
eventSubscriber.on('OrderPlaced', async (event) => {
  await paymentService.processPayment(
    event.customerId,
    event.totalAmount
  );
});

// Inventory Service subscribes independently
eventSubscriber.on('OrderPlaced', async (event) => {
  for (const item of event.data.items) {
    await inventoryService.reserveStock(
      item.productId,
      item.quantity
    );
  }
});
```

### 2. Event-Carried State Transfer

Events include all necessary state; consumers don't need to query the producer.

```typescript
// BAD: Event notification only
export class OrderPlacedEvent {
  constructor(readonly orderId: string) {}
}

// Downstream service must query Order Service
const order = await orderServiceClient.getOrder(orderId);
// Extra RPC, timing issues

// GOOD: Event-carried state
export class OrderPlacedEvent {
  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly items: OrderItem[],
    readonly totalAmount: Money,
    readonly shippingAddress: Address
  ) {}
}

// Downstream service has everything it needs
eventSubscriber.on('OrderPlaced', async (event) => {
  const shipment = new Shipment(
    event.orderId,
    event.items,
    event.shippingAddress
  );
  await shipmentRepository.save(shipment);
  // No RPC needed
});
```

**Tradeoff:** Larger events, but eliminates cascading failures and latency

### 3. Event Sourcing

Store the complete history of all events; rebuild state by replaying events.

```typescript
// Traditional: store current state
{
  orderId: "ORD-123",
  status: "SHIPPED",
  totalAmount: 100
}

// Event Sourcing: store all events
[
  { type: "OrderPlaced", orderId: "ORD-123", totalAmount: 100, timestamp: "2026-03-25T10:00:00Z" },
  { type: "OrderConfirmed", orderId: "ORD-123", timestamp: "2026-03-25T10:05:00Z" },
  { type: "PaymentProcessed", orderId: "ORD-123", paymentId: "PAY-456", timestamp: "2026-03-25T10:06:00Z" },
  { type: "OrderShipped", orderId: "ORD-123", trackingNumber: "TRK-789", timestamp: "2026-03-25T11:00:00Z" }
]

// Rebuild order state
let order = new Order();
for (const event of events) {
  order.apply(event);
}
// order.status === "SHIPPED"
// order.totalAmount === 100
// order.trackingNumber === "TRK-789"
```

**Aggregate with Event Sourcing:**

```typescript
export class Order {
  private id: OrderId;
  private status: OrderStatus;
  private items: LineItem[] = [];
  private totalAmount: Money;
  private changes: DomainEvent[] = [];

  // Rebuild from history
  static fromHistory(events: DomainEvent[]): Order {
    const order = new Order();
    for (const event of events) {
      order.apply(event);
    }
    return order;
  }

  // Apply event (mutation)
  private apply(event: DomainEvent): void {
    if (event instanceof OrderPlacedEvent) {
      this.id = event.aggregateId;
      this.items = event.data.items;
      this.totalAmount = event.data.totalAmount;
      this.status = OrderStatus.PENDING;
    } else if (event instanceof OrderConfirmedEvent) {
      this.status = OrderStatus.CONFIRMED;
    } else if (event instanceof OrderShippedEvent) {
      this.status = OrderStatus.SHIPPED;
    }
  }

  // Command that triggers event
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error("Only pending orders can be confirmed");
    }
    const event = new OrderConfirmedEvent(this.id, new Date(), 1);
    this.apply(event);
    this.changes.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return this.changes;
  }
}

// Repository stores events
export class EventSourcedOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    for (const event of order.getUncommittedEvents()) {
      await this.eventStore.append(event);
    }
    order.clearUncommittedEvents();
  }

  async findById(id: OrderId): Promise<Order> {
    const events = await this.eventStore.getEvents(id);
    return Order.fromHistory(events);
  }
}
```

**Benefits:**
- Complete audit trail (why did order ship?)
- Temporal queries (show order state at 3 PM yesterday)
- Event replay for debugging
- Separate read model (CQRS) for different views

**Drawbacks:**
- Complex (events are immutable truth)
- Schema evolution (old events may have different format)
- Snapshots needed for performance (don't replay 10k events every time)

## CQRS (Command Query Responsibility Segregation)

Separate the model for writing (commands) from reading (queries).

```
                    Write Model (Events)
                           ↓
     ORDER SERVICE
           ↓
       Command         (OrderConfirmed)
  (ConfirmOrder)           ↓
           ↓          Event Store
      Event Store           ↓
           ↓          Denormalizer
    Denormalizer            ↓
           ↓         Read Models
      Read Models       ┌──────────────────┐
                        │ - OrderList       │
                        │ - OrderDetails    │
                        │ - CustomerOrders  │
                        └──────────────────┘
                             ↑
                        (served to API)
```

**Write Model:** Commands mutate aggregates, events are published
**Read Model:** Denormalized views optimized for specific queries

```typescript
// WRITE: Command handler
export class ConfirmOrderCommandHandler {
  async handle(command: ConfirmOrderCommand): Promise<void> {
    const order = await this.orderRepository.findById(command.orderId);
    order.confirm();
    await this.orderRepository.save(order);
    // Events published automatically
  }
}

// READ: Query handler (serves denormalized data)
export class GetOrdersForCustomerQueryHandler {
  async handle(query: GetOrdersForCustomerQuery): Promise<OrderListItem[]> {
    return await this.orderListProjection.findByCustomerId(
      query.customerId
    );
  }
}

// READ: Projection (maintains read model)
export class OrderListProjection {
  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    await this.db.insert('order_list', {
      orderId: event.aggregateId,
      customerId: event.data.customerId,
      status: 'PENDING',
      totalAmount: event.data.totalAmount,
      createdAt: event.timestamp,
    });
  }

  async onOrderConfirmed(event: OrderConfirmedEvent): Promise<void> {
    await this.db.update('order_list', {
      status: 'CONFIRMED',
      confirmedAt: event.timestamp,
    }, { orderId: event.aggregateId });
  }
}
```

**Benefits:**
- Optimized read models (precomputed views, denormalization)
- Independent scaling (heavy queries don't affect writes)
- Different data shapes for different clients
- Temporal queries (show state at point in time)

**Complexity:** Eventual consistency between write and read models

## Choreography vs Orchestration

How do multi-service workflows coordinate?

### Choreography (Event-driven)

Services emit events; other services react. No central controller.

```
Order Placed → OrderPlacedEvent
  ↓
Payment Service subscribed
  ↓ processes payment
  ↓ PaymentProcessedEvent
    ↓
    Inventory Service subscribed
      ↓ reserves stock
      ↓ InventoryReservedEvent
        ↓
        Fulfillment Service subscribed
          ↓ schedules shipment
          ↓ ShipmentScheduledEvent
```

```typescript
// Choreography: each service reacts to events
eventBus.subscribe('OrderPlaced', async (event) => {
  const payment = await paymentService.process(event.customerId, event.totalAmount);
  eventBus.publish(new PaymentProcessedEvent(...));
});

eventBus.subscribe('PaymentProcessed', async (event) => {
  await inventoryService.reserve(event.orderId, event.items);
  eventBus.publish(new InventoryReservedEvent(...));
});
```

**Pros:** Decoupled, no single point of failure, responsive
**Cons:** Hard to understand workflow, difficult to handle failures, no central visibility

### Orchestration (Service-driven)

Central orchestrator (saga) coordinates services. Services don't know about each other.

```
Saga (Order Orchestrator)
  ↓ Command: ProcessPayment
  ↓ Waits for: PaymentProcessedEvent
Payment Service
  ↓ Command: ReserveInventory
  ↓ Waits for: InventoryReservedEvent
Inventory Service
  ↓ Command: ScheduleShipment
  ↓ Waits for: ShipmentScheduledEvent
Fulfillment Service
```

```typescript
// Orchestration: saga coordinates
export class OrderSaga {
  async orchestrate(orderId: string): Promise<void> {
    try {
      // Step 1: Process payment
      const paymentResult = await this.paymentService.process(orderId);
      if (!paymentResult.success) throw new Error("Payment failed");

      // Step 2: Reserve inventory
      const inventoryResult = await this.inventoryService.reserve(orderId);
      if (!inventoryResult.success) throw new Error("Inventory unavailable");

      // Step 3: Schedule shipment
      await this.fulfillmentService.schedule(orderId);
    } catch (error) {
      // Compensate: undo in reverse order
      await this.inventoryService.releaseReservation(orderId);
      await this.paymentService.refund(orderId);
      throw error;
    }
  }
}
```

**Pros:** Clear workflow, explicit failure handling, centralized visibility
**Cons:** Orchestrator becomes bottleneck, tightly couples services

## Saga Pattern: Handling Distributed Transactions

A saga is a sequence of local transactions coordinated by choreography or orchestration.

```
Saga: Process Order
┌─────────────────────────────────────┐
│ Transaction 1: Create Order         │
│ - Compensating Tx: Delete Order     │
└─────────────────────────────────────┘
            ↓ success
┌─────────────────────────────────────┐
│ Transaction 2: Process Payment      │
│ - Compensating Tx: Refund Payment   │
└─────────────────────────────────────┘
            ↓ success
┌─────────────────────────────────────┐
│ Transaction 3: Reserve Inventory    │
│ - Compensating Tx: Release Stock    │
└─────────────────────────────────────┘
            ↓ success → Saga complete
            ↓ failure → Run compensation in REVERSE
                 Release Stock
                 ← Refund Payment
                 ← Delete Order
```

## Message Brokers Comparison

| Aspect | Kafka | RabbitMQ | AWS SQS | Google Pub/Sub |
|--------|-------|----------|---------|---|
| **Model** | Event log | Message queue | FIFO queue | Publish-Subscribe |
| **Persistence** | Months (partitions) | In-memory (disk) | Hours-days | Days |
| **Throughput** | Very high | Moderate | High | High |
| **Ordering** | Per partition | Per queue | Strict FIFO | No guarantee |
| **Replay** | Yes (retain log) | No | No | No |
| **Deployment** | Self-hosted | Self-hosted | Managed | Managed |
| **Use Case** | Event log, streaming | Task queues | Decoupling services | Real-time analytics |

## At-Least-Once Delivery & Idempotency

Events may be delivered multiple times. Services must handle duplicates.

```typescript
// IDEMPOTENT HANDLER
export class PaymentEventHandler {
  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    // Check if already processed
    const existingPayment = await this.paymentRepository.findByOrderId(
      event.aggregateId
    );
    if (existingPayment) {
      // Already processed this event, skip
      return;
    }

    // Process payment
    const payment = await this.paymentGateway.charge(
      event.data.customerId,
      event.data.totalAmount
    );

    // Save with event ID to prevent duplicate processing
    await this.paymentRepository.save({
      paymentId: payment.id,
      orderId: event.aggregateId,
      eventId: event.eventId, // Track which event triggered this
      amount: event.data.totalAmount,
    });
  }
}

// Idempotency key pattern
export class ProcessPaymentCommand {
  constructor(
    readonly orderId: string,
    readonly amount: Money,
    readonly idempotencyKey: string // Unique per request
  ) {}
}

// Service uses key to prevent double-charging
if (await this.idempotencyStore.exists(command.idempotencyKey)) {
  return await this.idempotencyStore.getResult(command.idempotencyKey);
}

const result = await this.paymentGateway.charge(
  command.amount,
  idempotencyKey: command.idempotencyKey
);

await this.idempotencyStore.store(command.idempotencyKey, result);
return result;
```

## Eventual Consistency Trade-offs

Events create a window where state is inconsistent across services.

```
Time 0: Order placed
  ↓ Order Service state: PENDING ✓
  ↓ Inventory Service state: (not yet reserved) ✗
  ↓ Payment Service state: (not yet processed) ✗

Time 100ms: Events delivered
  ↓ Order Service state: PENDING ✓
  ↓ Inventory Service state: RESERVED ✓
  ↓ Payment Service state: (still processing) ✗

Time 200ms: All services processed
  ↓ Order Service state: PENDING ✓
  ↓ Inventory Service state: RESERVED ✓
  ↓ Payment Service state: PROCESSED ✓
```

**Acceptability depends on domain:**
- ✅ Acceptable: e-commerce (order shows as "processing" until payment clears)
- ✅ Acceptable: analytics (data 1 second late is fine)
- ❌ Unacceptable: bank transfers (must be immediately consistent)

## Implementation Checklist

- [ ] Events are immutable and include full context (event-carried state)
- [ ] Event handlers are idempotent (handle duplicate delivery)
- [ ] Dead-letter queue for failed events (retry mechanism)
- [ ] Event versioning strategy (schema evolution)
- [ ] Monitoring: event lag, handler failures, delivery delays
- [ ] Saga definition (orchestration or choreography)
- [ ] Compensating transactions for saga rollback
- [ ] Read models updated from events (projections)
- [ ] CQRS separates write and read concerns (if applicable)
- [ ] Event store or message broker configured for retention

## Common Pitfalls

❌ **Forgetting idempotency** — handlers process same event twice
❌ **Tight coupling via events** — treating events as RPC responses
❌ **Missing compensations** — saga fails with no undo mechanism
❌ **No event versioning** — old events break when schema changes
❌ **Too much state in read model** — defeats denormalization purpose
❌ **Ignoring ordering** — assuming events arrive in order they were emitted

## Related Notes

- [[CON-domain-driven-design]] — domain events are DDD concept
- [[CON-microservices-patterns]] — events enable loose service coupling
- [[CON-async-patterns]] — async processing, queues, workers
- [[CON-database-patterns]] — event store, read models, projections
