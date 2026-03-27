---
type: concept
tags: [backend, caching, Redis, performance, cache-invalidation]
related: [CON-backend-layers, CON-database-patterns, CON-async-patterns]
updated: 2026-03-25
source: template
---

# Caching Strategies

## Why Cache?

- Reduce DB load (expensive queries)
- Reduce latency (memory >> disk >> network)
- Increase throughput (serve more requests)

**Rule:** Cache only when you have a measured performance problem. Premature caching adds complexity.

## Cache Hierarchy

```
Browser Cache          ← fastest, client-side
    ↓ miss
CDN (e.g., CloudFront) ← static assets, geographic distribution
    ↓ miss
API Gateway Cache      ← rate limit + cache at edge
    ↓ miss
Application Cache      ← Redis / Memcached (in-memory)
    ↓ miss
DB Query Cache         ← DB-level (often disabled in production)
    ↓ miss
Database              ← source of truth
```

## Cache Patterns

### Cache-Aside (Lazy Loading) — Most Common
```typescript
async function getUser(userId: string): Promise<User> {
  // 1. Check cache
  const cached = await redis.get(`user:${userId}`)
  if (cached) return JSON.parse(cached)  // HIT

  // 2. MISS → query DB
  const user = await userRepo.findById(userId)

  // 3. Store in cache with TTL
  await redis.setex(`user:${userId}`, 3600, JSON.stringify(user))  // 1 hour

  return user
}
```
**Pros:** Only caches what's actually requested
**Cons:** First request always hits DB (cache miss penalty)

### Write-Through
```
On every write → update DB AND update cache simultaneously
Pros: Cache always fresh
Cons: Write penalty (both DB + cache), may cache data never read
```

### Write-Behind (Write-Back)
```
Write to cache → return success → async write to DB later
Pros: Very fast writes
Cons: Risk of data loss if cache fails before DB write
Use: High-write scenarios, metrics, counters
```

### Read-Through
```
Cache sits in front of DB
Application always reads from cache
Cache fetches from DB on miss (cache handles it, not app)
Used by: Hibernate 2nd-level cache, some ORM frameworks
```

## Cache Invalidation Strategies

"There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

### TTL (Time to Live)
```redis
SET user:123 "..." EX 3600  ← expire after 1 hour
```
Simple, but data can be stale for up to TTL duration.

### Event-Driven Invalidation
```typescript
// On user update → delete cache
async function updateUser(userId: string, data: Partial<User>) {
  await userRepo.update(userId, data)
  await redis.del(`user:${userId}`)  // Invalidate
  await redis.del(`users:list`)      // Invalidate list cache too
}
```
Pros: Always fresh after write
Cons: Must track all cache keys to invalidate

### Cache Versioning
```
Key: user:v2:123 (include version in key)
On schema change: bump version → old cache auto-expires
```

## Redis Data Structures

| Structure | Use Case | Example |
|-----------|---------|---------|
| String | Simple value, counters | `SET user:123 "{json}"` |
| Hash | Object fields | `HSET user:123 name "Alice"` |
| List | Queue, recent items | `LPUSH recent:views itemId` |
| Set | Unique members, tags | `SADD user:permissions "admin"` |
| Sorted Set | Leaderboard, priority queue | `ZADD leaderboard 100 userId` |
| Stream | Event log, message queue | `XADD events * type "login"` |

## Cache Sizing & Eviction

```
Eviction policies (when cache is full):
  LRU  (Least Recently Used)  → evict oldest unused [recommended]
  LFU  (Least Frequently Used) → evict least accessed
  TTL  (Time-to-Live)          → evict expired keys first
  FIFO (First In First Out)    → evict oldest inserted

Cache hit rate target: > 80%
If < 80%: review what's being cached, TTL values, key design
```

## Cache Key Design

```
Convention: resource:identifier[:subkey]
Examples:
  user:123                      ← single user
  user:123:orders               ← user's orders
  users:list:page:1:limit:20    ← paginated list
  product:456:price             ← specific field

Use consistent prefix per entity
Include version if schema can change: user:v2:123
```

## Related

- [[CON-backend-layers]] — cache lives in service layer
- [[CON-database-patterns]] — caching reduces DB load
- [[CON-async-patterns]] — cache writes can be async
- [[../../../00-MOC/MOC-Backend]]
