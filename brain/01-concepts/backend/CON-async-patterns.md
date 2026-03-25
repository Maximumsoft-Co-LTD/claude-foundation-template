---
type: concept
tags: [backend, async, queue, pub-sub, event-driven, webhook]
related: [CON-backend-layers, CON-caching-strategies]
updated: 2026-03-25
---

# Async Patterns

## Why Async?

Synchronous (blocking) operations hurt performance when:
- Operation takes > 500ms (email, image processing, PDF generation)
- Operation depends on unreliable external service
- High concurrency → blocking = threads waiting = poor throughput

**Rule:** If a user doesn't need to wait for the result → make it async.

## Core Patterns

### Message Queue (Task Queue)

```
Producer (Web Server)          Queue          Consumer (Worker)
    PUT order in DB    →   [order.created]  → Send confirmation email
    Return 201 fast               ↓           Resize product images
                          Persistent store    Generate PDF receipt
```

**Guarantees:**
- At-least-once delivery (consumer acks after processing)
- Retry on failure (with backoff)
- Dead Letter Queue (DLQ) for poison messages

```typescript
// Producer
await queue.send('order.created', { orderId: '123', userId: '456' })
return res.status(201).json({ orderId: '123' })  // Return immediately

// Consumer (separate process)
queue.process('order.created', async (job) => {
  await emailService.sendConfirmation(job.data)
  await imageService.resizeProductImages(job.data.orderId)
  // job auto-acked on success
})
```

**Tools:** BullMQ (Redis), RabbitMQ, AWS SQS, Azure Service Bus

---

### Pub/Sub (Publish-Subscribe)

```
Publisher → Topic → Subscriber A (analytics)
                  → Subscriber B (notifications)
                  → Subscriber C (audit log)
```

One event → many independent consumers (fan-out)

```typescript
// Publish event
await eventBus.publish('user.registered', {
  userId: '123', email: 'user@example.com', timestamp: Date.now()
})

// Independent consumers
eventBus.subscribe('user.registered', async (event) => {
  await analytics.track('registration', event)
})
eventBus.subscribe('user.registered', async (event) => {
  await emailService.sendWelcome(event.email)
})
```

**Key difference from Queue:** Queue = one consumer per message. Pub/Sub = all subscribers get copy.

---

### Event-Driven Architecture

```
Service A does something → emits domain event
Service B, C, D react independently

Order Service:  order.placed →
  Inventory Service: reserves stock
  Payment Service:   charges card
  Email Service:     sends confirmation
  Analytics Service: records metric

No direct coupling between services!
```

**Benefits:** Loose coupling, independent scaling, easy to add new consumers
**Challenges:** Eventual consistency, distributed tracing needed, harder to debug

---

### Scheduled Jobs (Cron)

```
"Every day at 2am: send digest emails"
"Every hour: sync data from external API"
"Every 5 minutes: check for expired sessions"

// Using cron syntax: minute hour day month weekday
0 2 * * *   → daily at 2am
0 * * * *   → every hour
*/5 * * * * → every 5 minutes
```

**Tools:** node-cron, APScheduler (Python), Kubernetes CronJob, AWS EventBridge

---

### Idempotency (Critical for Async)

When retrying failed jobs, same job may run twice. Operations must be idempotent:

```typescript
// ❌ Not idempotent — double charge if retried
async function chargeCard(orderId: string) {
  await stripe.charge(amount)
  await db.update('orders', orderId, { charged: true })
}

// ✅ Idempotent — check before charging
async function chargeCard(orderId: string) {
  const order = await db.findById('orders', orderId)
  if (order.charged) return  // Already done, skip

  await stripe.charge(amount, { idempotencyKey: orderId })
  await db.update('orders', orderId, { charged: true })
}
```

**Pattern:** Use idempotency key (orderId, requestId) to deduplicate.

## Choosing Between Patterns

```
User must wait for result?
  → Synchronous API call

User doesn't need to wait (fire and forget)?
  → Message Queue

One event → multiple independent reactions?
  → Pub/Sub or Event Bus

Repeated scheduled work?
  → Cron Job

High-volume event stream, replay needed?
  → Kafka / Event Streaming
```

## Related

- [[CON-backend-layers]] — async jobs in service layer
- [[CON-caching-strategies]] — cache writes often async
- [[../solution-engineer/CON-system-integration-patterns]] — integration uses these patterns
- [[../../../00-MOC/MOC-Backend]]
