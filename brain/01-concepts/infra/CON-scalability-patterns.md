---
type: concept
tags: [infra, scalability, horizontal, vertical, caching, sharding, stateless]
related: [CON-sre-fundamentals, CON-cloud-fundamentals]
updated: 2026-03-25
---

# Scalability Patterns

## Horizontal vs Vertical Scaling

```
Vertical (Scale Up):
  → Bigger machine (more CPU, more RAM)
  → Simple — no code changes
  → Limited — physical ceiling
  → Single point of failure
  → Example: t3.large → t3.2xlarge

Horizontal (Scale Out):
  → More machines (add instances)
  → Requires stateless app
  → Unlimited — keep adding
  → Fault tolerant
  → Example: 1 server → 5 servers behind load balancer
```

**Rule:** Design apps to scale horizontally from the start.

## Stateless Architecture

For horizontal scaling, app must be **stateless**:

```
❌ Stateful (blocks horizontal scaling):
  Session stored in server memory
  → User 1 goes to Server A, User 1's next request to Server B → session lost

✅ Stateless (enables horizontal scaling):
  Session stored in Redis / JWT (client-side)
  → Any server can handle any request
  → Add/remove servers freely
```

## Caching Layers

```
Browser Cache
    ↓ miss
CDN (Content Delivery Network)
    ↓ miss
API Gateway Cache
    ↓ miss
Application Cache (Redis/Memcached)
    ↓ miss
Database Query Cache
    ↓ miss
Database (source of truth)
```

**Cache Invalidation Strategies:**
- TTL (Time to Live) — expire after X seconds
- Event-driven — invalidate on write
- LRU (Least Recently Used) — evict oldest unused

**Cache-aside pattern:**
```
1. Check cache → HIT: return cached
2. MISS: query DB
3. Store in cache (with TTL)
4. Return result
```

## Database Scaling

```
Read-heavy?
  → Read Replicas
    Master handles writes
    Replicas handle reads
    Replicate master → replicas asynchronously

Write-heavy?
  → Sharding (partition by key)
    User 1-1M → Shard 1
    User 1M-2M → Shard 2
    Complex: cross-shard queries, resharding

Both?
  → CQRS (Command Query Responsibility Segregation)
    Write model → optimized for writes
    Read model  → optimized for reads (denormalized, cached)
```

## Load Balancing

```
Round Robin  → request 1→server1, 2→server2, 3→server3, 4→server1...
Least Conn.  → route to server with fewest active connections
IP Hash      → same IP always goes to same server (session affinity)
Weighted     → 70% server1 (powerful), 30% server2 (smaller)
```

## Async Processing (Queue)

Offload heavy/slow operations:

```
Web request → add to queue → return 202 Accepted
                ↓
         Worker processes (async):
           Send email
           Resize image
           Generate report
           Call slow external API
```

Tools: RabbitMQ, Redis Queue (BullMQ), AWS SQS, Kafka

## Related

- [[CON-sre-fundamentals]] — reliability through scalable design
- [[CON-cloud-fundamentals]] — cloud services enable scaling
- [[../backend/CON-caching-strategies]] — application caching
- [[../../../00-MOC/MOC-Infrastructure]]
