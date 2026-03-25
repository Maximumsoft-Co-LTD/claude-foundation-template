---
type: concept
tags: [solution-engineer, integration, API, webhook, queue, ETL, ESB]
related: [CON-solution-design-process, CON-architecture-diagrams]
updated: 2026-03-25
---

# System Integration Patterns

## Integration Patterns Overview

```
System A ←→ System B via:

1. Direct API Call (Synchronous)
2. Webhook (Async event notification)
3. Message Queue (Async, reliable delivery)
4. File Transfer / ETL (Batch)
5. Shared Database (Anti-pattern)
6. Event Streaming (Kafka-style)
```

---

## 1. REST API (Synchronous)

```
Client → POST /orders → Service B → Response → Client

Pros: Simple, immediate response, easy to debug
Cons: Tight coupling, B must be available, blocking
Use: Real-time operations (payment, auth, price lookup)
```

---

## 2. Webhook (Async Notification)

```
Service A does something
    ↓ POST to registered URL
Service B's webhook endpoint
    ↓ Return 200 immediately
Service B processes asynchronously

Pros: Decoupled, push-based (no polling)
Cons: Delivery not guaranteed, retry logic needed, security (signature verification)
Use: Payment callbacks (Stripe), GitHub events, SMS delivery status
```

**Security:** Always verify webhook signature
```
HMAC = HMAC-SHA256(payload, shared_secret)
Compare with X-Webhook-Signature header
```

---

## 3. Message Queue (Async, Reliable)

```
Producer → Publish message → Queue → Consumer processes

At-least-once delivery (with ack)
Dead Letter Queue (DLQ) for failed messages

Pros: Decoupled, reliable, handles backpressure, retry built-in
Cons: Complex, message ordering hard, eventual consistency
Use: Order processing, email sending, heavy async tasks
Tools: RabbitMQ, SQS, BullMQ (Redis), Azure Service Bus
```

---

## 4. Event Streaming (Kafka)

```
Producers → Topic → Consumer Group 1 (analytics)
                  → Consumer Group 2 (notifications)
                  → Consumer Group 3 (audit log)

Pros: Fan-out, replay events, decoupled, high throughput
Cons: Complex infrastructure, eventual consistency, hard to debug
Use: Audit logs, analytics pipeline, event-driven microservices
```

---

## 5. ETL / File Transfer (Batch)

```
Extract (System A) → Transform → Load (System B)
  Scheduled: nightly at 2am
  File format: CSV, JSON, XML, Parquet

Pros: Simple, works with legacy systems
Cons: Not real-time (batch delay), large files = memory issues
Use: Data warehousing, legacy system integration, reporting
```

---

## 6. Shared Database (Anti-Pattern)

```
Service A ─┐
           ├→ Shared DB ← Service B
Service C ─┘

❌ Don't do this:
  - Tight schema coupling
  - Any service can corrupt shared data
  - DB becomes bottleneck
  - Can't scale services independently

✅ Instead: Each service owns its DB, integrate via API/events
```

---

## Choosing an Integration Pattern

```
Need immediate response?
  → REST API

Need to notify another system when something happens?
  → Webhook

Need reliable async processing with retry?
  → Message Queue

Need multiple consumers + replay?
  → Event Streaming (Kafka)

Integrating with legacy system?
  → File Transfer / ETL
```

## Integration Checklist

- [ ] Authentication between services (API key, mTLS, OAuth2 client credentials)
- [ ] Error handling + retry with backoff
- [ ] Circuit breaker (stop calling failing service)
- [ ] Timeout defined (no infinite waits)
- [ ] Monitoring + alerting on integration health
- [ ] Idempotency (duplicate messages handled safely)
- [ ] Data contract documented (schema, version)

## Related

- [[CON-solution-design-process]] — when to choose which pattern
- [[CON-architecture-diagrams]] — how to document integrations
- [[../../../00-MOC/MOC-Solution-Engineer]]
