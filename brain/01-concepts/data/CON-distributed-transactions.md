---
type: concept
tags: [database, distributed-systems, transactions, saga, fundamentals]
related: [CON-cap-acid-base, CON-replication-sharding, CON-database-types]
updated: 2026-04-29
source: template
---

# Distributed Transactions

## Core idea

A transaction across multiple services or databases. ACID guarantees apply trivially within one DB; across multiple, you face a hard tradeoff.

The 2026 industry consensus: **prefer eventual consistency via Saga**. Two-Phase Commit (2PC) is technically sound but operationally costly and is no longer recommended for cloud-native systems.

## The setup

A single business operation that touches multiple services:

```
"Place an Order"
  ├─ Reserve inventory  (Inventory service / DB)
  ├─ Charge payment     (Payment service / Stripe)
  └─ Create shipment    (Shipping service / DB)
```

Either **all three succeed**, or **the user owes nothing and gets nothing**. Anything else is bad: charged-but-no-shipment, shipment-but-no-payment, etc.

## Approach 1: Two-Phase Commit (2PC)

A coordinator orchestrates a synchronous protocol:

**Phase 1 — Prepare**
Coordinator asks each participant: "can you commit?" Each replies YES (and locks the resource) or NO.

**Phase 2 — Commit (or Abort)**
If all YES → coordinator tells everyone "COMMIT." If any NO → "ABORT," everyone rolls back.

```
┌─────────────┐
│ Coordinator │
└──────┬──────┘
       │ prepare
       ├──────► Inventory  : YES (locked)
       ├──────► Payment    : YES (locked)
       └──────► Shipping   : YES (locked)
              ──── (coordinator decides: commit) ────
       ├──────► Inventory  : commit
       ├──────► Payment    : commit
       └──────► Shipping   : commit
```

### Why 2PC has fallen out of favor

| Issue | Effect |
|-------|--------|
| **Locks during prepare** | Resources locked across network round-trips → throughput killer |
| **Coordinator is SPOF** | If coordinator dies between prepare and commit, participants are stuck holding locks |
| **Synchronous** | Slowest participant gates everyone |
| **Across cloud services** | You don't control all participants — `Stripe` doesn't speak your 2PC protocol |
| **Cascading failures** | One slow participant locks the whole flow |

**Verdict:** still useful within a single trusted distributed DB (Spanner, CockroachDB do this internally). Almost never used across heterogeneous services anymore.

## Approach 2: Saga

A sequence of local transactions, each followed by a **compensating action** if a later step fails.

**Two flavors:**

### Choreography
Each service publishes events; others react.

```
OrderCreated event
  → Inventory reserves stock, publishes InventoryReserved
    → Payment charges card, publishes PaymentSucceeded
      → Shipping creates shipment, publishes ShipmentCreated

Failure path: Payment publishes PaymentFailed
  → Inventory listens, releases stock
```

**Pros:** no central orchestrator; loose coupling.
**Cons:** flow is hard to trace — read 5 services to understand the order flow.

### Orchestration
A central orchestrator (a state machine) calls each service.

```
function placeOrder():
  reserveInventory()  → on fail: stop
  chargePayment()     → on fail: releaseInventory(), stop
  createShipment()    → on fail: refundPayment(), releaseInventory(), stop
```

**Pros:** flow is in one place — easier to reason about and debug.
**Cons:** orchestrator is a new component to operate.

### Compensating actions

Each step needs a rollback that makes business sense:

| Forward action | Compensation |
|----------------|--------------|
| Reserve inventory | Release inventory |
| Charge card | Refund |
| Send email | (Often impossible — you can't unsend) |
| Allocate shipping | Cancel shipment |

**The hard truth:** compensations are not always perfect inverses. You can refund money but can't always retrieve sent emails or unship physical goods. The Saga must be designed so compensations are **always possible** — sometimes by **delaying** the irreversible action until all reversible ones succeed.

## Approach 3: Outbox + idempotency

A practical near-replacement for cross-service transactions in event-driven systems:

1. Service writes its DB row + an "outbox" event row in **one local transaction** (atomic)
2. Background poller reads outbox, publishes events
3. Consumers handle events idempotently (retries are safe)

This trades immediate consistency for guaranteed eventual consistency, with the property that **the local DB and the events can never get out of sync**.

```sql
BEGIN;
INSERT INTO orders (...);
INSERT INTO outbox (event_type, payload) VALUES ('OrderCreated', '{...}');
COMMIT;
```

A separate process drains `outbox` and publishes to Kafka/Rabbit/SNS. Any failure mid-publish → retry from outbox.

## Idempotency — the foundation of all of this

If a service might be called twice (because a Saga retries, or a message is delivered twice), it must produce the same result both times.

**Patterns:**
- Use a unique idempotency key (UUID per request) — second call returns the first result without side effects
- Make state transitions idempotent — `setStatus('shipped')` is fine to call twice; `incrementCount()` is not
- Use compare-and-set with version numbers (optimistic locking)

Stripe's API is the canonical example — every request can carry an `Idempotency-Key` header.

## Eventual consistency in practice

What does the user see?

```
T0: User places order → 200 OK ("order placed")
T0+10ms: Inventory reserved
T0+50ms: Payment charged
T0+200ms: Shipment created (eventually consistent — it took 200ms to materialize)

If user refreshes order page at T0+100ms:
  → "Awaiting shipping" (correctly reflects current state)
```

The UX is built around the actual state machine, not pretending things happen atomically. **The interface admits the asynchrony** instead of hiding it.

## Decision flow

```
Are all participants in the SAME database?
└─ YES → Use a single ACID transaction. You're done.

Are all participants in databases run by ONE distributed DB engine?
   (Spanner, CockroachDB, YugabyteDB)
└─ YES → That engine offers global ACID. Use it.

Cross-service / cross-region / spans 3rd-party APIs?
└─ Use Saga (orchestration is usually clearer than choreography).
   Add idempotency at every endpoint.
   Use outbox for "DB write + event" atomicity.

Need strict atomicity across services with no eventual-consistency tolerance?
└─ Re-examine the bounded contexts. This is usually a domain modeling issue —
   the operation should live in one service, not be split across services.
```

## Anti-patterns

| Anti-pattern | Effect | Fix |
|--------------|--------|-----|
| **Try to run 2PC across cloud services** | Locks, fragility, sync calls | Saga + compensating actions |
| **No compensation for an irreversible step** | Money / emails sent on a failed Saga | Defer irreversible actions to last; or design escape hatch (manual review queue) |
| **Non-idempotent endpoints in a Saga** | Retry storms, double-charges | Idempotency keys |
| **Synchronous chain across many services** | Latency adds up; one slow service blocks all | Async Saga with events |
| **No monitoring on Saga state** | "Stuck orders" pile up invisibly | Metrics on each Saga stage; dashboard for in-progress > N min |
| **Using events for queries / reads** | Eventually-consistent UI feels broken | Add a read model materialized from events; CQRS |

## Common Saga implementations

| Tool | Pattern |
|------|---------|
| Temporal / Cadence | Workflow-as-code with durable orchestration |
| AWS Step Functions | Cloud-managed orchestration |
| Camunda / Zeebe | BPMN-style orchestration |
| Kafka + custom consumers | Choreography on event log |
| `axon` / `eventuate` | JVM-native CQRS + Saga frameworks |

## Related

- [[CON-cap-acid-base]] — eventual consistency is what Sagas accept in exchange for availability
- [[../architecture/CON-event-driven-architecture]] — Saga is an EDA pattern
- [[../architecture/CON-microservices-patterns]] — Saga is one of the core MS patterns
- [[CON-replication-sharding]] — sharded systems also need this pattern internally
- [[../backend/CON-async-patterns]] — message queues underpin choreography
