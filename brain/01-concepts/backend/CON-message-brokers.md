---
type: concept
tags: [backend, queue, kafka, rabbitmq, sqs, nats, messaging, broker]
related: [CON-async-patterns, CON-event-driven-architecture, CON-distributed-transactions]
updated: 2026-04-29
source: template
---

# Message Brokers

> [[CON-async-patterns]] covers the **patterns** (queue, pub/sub, EDA, idempotency).
> This note covers the **technologies** — when to pick Kafka vs RabbitMQ vs SQS vs NATS.

## Decision Cheatsheet

| Need | Pick | Why |
|------|------|-----|
| Event log, replay, high throughput | **Kafka** | Append-only log, retention, partitions = parallelism |
| Work queue with rich routing, transactional semantics | **RabbitMQ** | Per-message ack, exchanges (direct/topic/fanout/headers), DLX |
| AWS-managed, low ops, FIFO + standard | **SQS** | Zero infra, integrates with Lambda, decent for fan-out via SNS |
| Lightweight, low latency, microservices RPC | **NATS** | µs latency, request/reply, JetStream for persistence |
| Redis-native streams, already running Redis | **Redis Streams** | XADD/XREAD, consumer groups, no extra infra |
| GCP-native | **Pub/Sub** | Auto-scale, at-least-once, ordered delivery (per key) |

## Mental Model: Log vs Queue

```
LOG (Kafka, Redis Streams, Pub/Sub)
   producer ── append ──▶ [m1, m2, m3, m4, m5, ...]
                              ▲     ▲
                          consumer A  consumer B   ← each tracks its own offset
   - retention measured in time/size, not consumption
   - many consumer groups → independent reads
   - replay = seek to old offset
   - durability = disk-backed log

QUEUE (RabbitMQ, SQS)
   producer ──▶ [m1] [m2] [m3] ──▶ consumer (ack → delete)
   - message gone after ack
   - one consumer per message (within a queue)
   - retry via redelivery / DLQ (dead-letter queue)
   - good for "work to be done"
```

**Rule of thumb:**
- Need to replay events for new consumer / rebuild state? → **Log**
- Each task should be done exactly once by one worker? → **Queue**

## Kafka

```
Topic           = named log
Partition       = ordered subset of a topic; unit of parallelism
Offset          = position in a partition
Consumer Group  = set of consumers sharing partitions (each partition → 1 consumer in group)
Retention       = time- or size-based (e.g., 7 days, 100GB)
```

**When it shines:**
- Event sourcing, CDC (Debezium), audit trails
- Stream processing (Kafka Streams, Flink, ksqlDB)
- High-throughput pipelines (millions msg/s)

**Watch out for:**
- Partition count is nearly immutable (rebalancing pain)
- Ordering guaranteed **per partition only**, not per topic
- Operational overhead: ZooKeeper (or KRaft), broker tuning, monitoring lag
- Consumer must be idempotent — at-least-once, never exactly-once across systems

```yaml
# Producer config knobs that matter
acks: all              # wait for all in-sync replicas (durability)
enable.idempotence: true
linger.ms: 10          # batch for throughput
compression.type: zstd

# Consumer config knobs that matter
isolation.level: read_committed
enable.auto.commit: false   # commit after processing, not poll
```

## RabbitMQ (AMQP)

```
Producer ──▶ Exchange ──(routing)──▶ Queue ──▶ Consumer
                 │
                 ├─ direct   (exact routing key match)
                 ├─ topic    (pattern match: "order.*.created")
                 ├─ fanout   (broadcast to all bound queues)
                 └─ headers  (match by message headers)
```

**When it shines:**
- Complex routing (one event → many destinations with rules)
- Per-message ack (precise control over retries)
- Transactional semantics (publisher confirms + consumer acks)
- RPC patterns (reply queues + correlation IDs)

**Watch out for:**
- Throughput ceiling lower than Kafka (tens of thousands msg/s, not millions)
- Mirrored queues / quorum queues need careful sizing
- Long queues degrade performance — keep them drained
- Use **DLX (Dead Letter Exchange)** for poison messages

```typescript
// Consumer with retry + DLX
channel.consume('orders', async (msg) => {
  try {
    await processOrder(JSON.parse(msg.content.toString()))
    channel.ack(msg)
  } catch (err) {
    if (msg.fields.deliveryTag > 3) {
      channel.nack(msg, false, false)  // → DLX
    } else {
      channel.nack(msg, false, true)   // requeue
    }
  }
})
```

## AWS SQS

```
Standard Queue  → at-least-once, best-effort ordering, near-unlimited throughput
FIFO Queue      → exactly-once* (within 5-min dedup window), strict ordering per group
                  *exactly-once = SQS dedupes; your consumer still must be idempotent

Visibility Timeout = how long a message is hidden after a consumer pulls it
                     (must exceed worker processing time, else duplicate processing)
```

**When it shines:**
- Already on AWS, want managed simplicity
- Decoupling Lambda / Fargate / ECS workers
- Pair with **SNS** for fan-out (SNS → multiple SQS queues)

**Watch out for:**
- No replay (once acked, gone)
- 256 KB max payload (use S3 + pointer for larger)
- Long polling > short polling (cost + latency)
- Use **DLQ** with `maxReceiveCount` (e.g., 5 retries → DLQ)

## NATS / NATS JetStream

```
Core NATS       = at-most-once, in-memory, sub-ms latency, fire-and-forget
JetStream       = adds persistence + at-least-once + replay (Kafka-lite)
```

**When it shines:**
- Microservices request/reply (`req.reply()` built-in)
- IoT / edge messaging (small footprint)
- Service discovery + control plane signaling

**Trade-off:** simpler than Kafka, less battle-tested at extreme scale.

## Patterns Worth Knowing

### Outbox Pattern (atomic DB write + event publish)

Problem: dual-write fail — DB commits but broker publish fails (or vice versa).

```
1. In ONE DB transaction:
     INSERT INTO orders ...
     INSERT INTO outbox (event_type, payload) VALUES (...)
2. Separate worker polls outbox table → publishes to broker → marks row sent
   (or use CDC like Debezium to tail the outbox table)
```

Guarantee: events published iff transaction committed. See [[CON-distributed-transactions]].

### Idempotent Consumer

Every message gets an ID. Consumer keeps `processed_message_ids` (TTL'd in Redis or a DB table) and skips duplicates. Mandatory for at-least-once brokers (Kafka, SQS standard, RabbitMQ).

### Backpressure

Slow consumer + fast producer = unbounded queue growth.
- **Kafka:** bounded by retention; consumer lag metric is your alarm
- **RabbitMQ:** queue length limits + flow control (publisher slowdown)
- **SQS:** DLQ + alarm on `ApproximateNumberOfMessagesVisible`

### Partition Key Design

Per-key ordering = same key always lands on same partition.
- ✅ `order_id` → all events for one order ordered
- ❌ `random()` → no ordering, but maximum parallelism
- ⚠️ Hot key (e.g., `tenant_id` for a giant tenant) → unbalanced partitions

## Choosing a Broker — Decision Tree

```
Are you on AWS and want zero ops?
  └─ Yes → SQS (+ SNS for fan-out)

Do you need event replay / event sourcing / stream processing?
  └─ Yes → Kafka (or Redpanda for Kafka API w/o ZooKeeper)

Do you need rich routing rules and per-message acks?
  └─ Yes → RabbitMQ

Are you doing microservice request/reply at low latency?
  └─ Yes → NATS

Already running Redis and queues are <10k msg/s?
  └─ Yes → Redis Streams or BullMQ
```

## Anti-patterns

- ❌ Using a broker as your **source of truth** (broker = transport, DB = truth)
- ❌ Synchronous request/reply over a queue (defeats the point — use HTTP/gRPC)
- ❌ One giant topic for everything (no consumer can specialize, no replay scope)
- ❌ Skipping the DLQ — poison messages will block the queue
- ❌ Trusting "exactly-once" marketing — design idempotent consumers anyway

## Related

- [[CON-async-patterns]] — patterns above the broker layer
- [[CON-event-driven-architecture]] — EDA architecture using brokers
- [[CON-distributed-transactions]] — outbox, saga, idempotency
- [[../../../00-MOC/MOC-Backend]]
- [[../../../00-MOC/MOC-Data]]
