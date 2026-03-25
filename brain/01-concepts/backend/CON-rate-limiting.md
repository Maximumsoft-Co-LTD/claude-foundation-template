---
type: concept
tags: [backend, rate-limiting, throttling, api-security, performance]
related: [CON-api-design-principles, CON-api-security, CON-caching-strategies, CON-scalability-patterns]
updated: 2026-03-25
---

# Rate Limiting

Strategies and implementation patterns for controlling request rates.

## Definitions

| Term | Definition | Use Case |
|------|-----------|----------|
| **Rate Limiting** | Hard cap on requests in time window | Prevent abuse, protect infrastructure |
| **Throttling** | Gradual degradation as limits approached | Graceful handling, backpressure |
| **Quota** | Monthly/daily allowance per user/tier | SaaS billing, usage-based pricing |

## Algorithms

### Token Bucket

```
Bucket holds max N tokens, refilled at rate R per second.
Each request costs 1 token. No tokens = reject or queue.

┌──────────────┐
│ ●●●●●●●●●●  │ 10 tokens (max)
│  Refill: 2/s │
└──────────────┘
  Request → ● consumed
  After 1s → ●● added back
```

```python
class TokenBucket:
    def __init__(self, capacity, refill_rate):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate
        self.last_refill = time.time()

    def allow_request(self):
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
```

**Pros**: Handles bursts, fair, simple. **Cons**: Per-user state required.

### Leaky Bucket

```
Requests flow in, leak out at constant rate.
Overflow = reject. Like a queue with max depth.

Incoming ─┐
          ▼
       ┌─────┐
       │░░░░░│ Queue (max N)
       └─────┘
          │
          ▼ (leak at rate R)
```

**Pros**: Smooth output rate, prevents bursts. **Cons**: High latency during peaks.

### Fixed Window

```
Reset counter every N seconds.
Simple but allows bursts at window boundaries.

Window 1 (0-60s)  │  Window 2 (60-120s)
Count: 0→1→...→100│  Count: 0→1→...
                   ↑ RESET at boundary
```

**Pros**: Simple, low memory. **Cons**: Burst at boundaries (100 requests at 59s, 100 at 61s = 200 in 2 seconds).

### Sliding Window

```
Track timestamp of each request in recent window.
More accurate than fixed window.

─────────[60s window]─────────
  • • • • (4 recent requests)
  If 5th arrives and oldest > 60s ago, allow
```

**Pros**: Smooth, accurate. **Cons**: High memory (store all timestamps).

### Comparison

| Algorithm | Burst Handling | Memory | Accuracy | Complexity |
|-----------|----------------|--------|----------|-----------|
| Token Bucket | ✓ Allows | Low | High | Medium |
| Leaky Bucket | ✗ Rejects | Medium | High | Medium |
| Fixed Window | ✗✗ Boundary spike | Very Low | Low | Low |
| Sliding Window | ✗ Rejects | High | Very High | High |

**Recommendation**: Token Bucket for most APIs.

## Implementation Scopes

### Per IP Address

```
Pros: Protects against DDoS without login.
Cons: Unfair to shared IPs (offices, proxies).

Example: 100 req/min per IP
```

### Per User (Authenticated)

```
Pros: Fair, applies to logged-in users across IPs.
Cons: Requires auth; doesn't protect unauthenticated endpoints.

Example: 1000 req/min per user_id
```

### Per API Key

```
Pros: Fine-grained, supports multiple keys per user.
Cons: Extra key management.

Example: 500 req/min per api_key
```

### Per Endpoint

```
Pros: Different limits for different operations.
Cons: Complex rule management.

Example:
  POST /users/register: 10 req/hour (prevent spam)
  GET /users/:id: 1000 req/hour (read-heavy)
```

## HTTP Responses

### 429 Too Many Requests

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1703000000

{
  "error": "rate_limit_exceeded",
  "message": "Try again in 60 seconds"
}
```

### Headers

| Header | Meaning | Example |
|--------|---------|---------|
| `Retry-After` | Seconds to wait (or HTTP-date) | `60` or `Wed, 25 Mar 2026 10:00:00 GMT` |
| `X-RateLimit-Limit` | Max requests in window | `1000` |
| `X-RateLimit-Remaining` | Requests left | `42` |
| `X-RateLimit-Reset` | Unix timestamp of reset | `1703000000` |

**Best practice**: Always include X-RateLimit-* headers so clients can adjust proactively.

## Distributed Rate Limiting with Redis

For horizontal scaling, store state in Redis:

```python
import redis
import time

redis_client = redis.Redis(host='localhost', port=6379)

def is_rate_limited(user_id, limit=100, window=60):
    """Check if user has exceeded rate limit (sliding window with Redis)."""
    key = f"rate_limit:{user_id}"
    now = time.time()
    window_start = now - window

    # Remove old entries
    redis_client.zremrangebyscore(key, 0, window_start)

    # Count requests in window
    count = redis_client.zcard(key)

    if count < limit:
        redis_client.zadd(key, {str(now): now})
        redis_client.expire(key, window + 1)
        return False

    return True
```

**Advantages**: Shared state, atomic operations, automatic expiry.

**Trade-off**: Redis latency (usually <1ms); worth it for consistency.

## Graceful Degradation

### Queuing

```python
# Instead of reject, queue the request
if is_rate_limited(user_id):
    queue_request(user_id, request)
    return 202, {'status': 'queued', 'position': queue.position()}
```

### Priority Tiers

```python
# Premium users get higher limits
if user.tier == 'premium':
    limit = 10000
elif user.tier == 'standard':
    limit = 1000
else:
    limit = 100
```

### Cost-Based Limiting

```python
# Heavy operations cost more
cost = {'GET /users': 1, 'POST /compute': 50}
remaining = user_budget - cost[operation]

if remaining >= 0:
    process_request()
else:
    return 429, {'cost': cost[operation], 'budget_remaining': user_budget}
```

## Client-Side Retry with Backoff

Always implement retry logic in clients:

```python
import time
import random

def retry_with_backoff(func, max_retries=5):
    """Exponential backoff with jitter."""
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError as e:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) + random.random()
                print(f"Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise

# Usage
response = retry_with_backoff(lambda: api_client.get('/users'))
```

**Formula**: `wait = (2^attempt) + random(0, 1)` seconds

Example waits: 1-2s, 2-3s, 4-5s, 8-9s, 16-17s

**Why jitter**: Prevents thundering herd (all clients retry at same time).

## Real-World Example

```python
from flask import Flask, request, jsonify
from redis import Redis
import time

app = Flask(__name__)
redis_client = Redis()

@app.before_request
def rate_limit():
    user_id = request.user.id if hasattr(request, 'user') else request.remote_addr
    key = f"rate_limit:{user_id}"
    limit = 100
    window = 60

    now = int(time.time())
    pipe = redis_client.pipeline()

    # Sliding window: remove old, count recent, add current
    pipe.zremrangebyscore(key, 0, now - window)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, window + 1)

    results = pipe.execute()
    count = results[2]

    remaining = max(0, limit - count)

    # Add headers
    response.headers['X-RateLimit-Limit'] = str(limit)
    response.headers['X-RateLimit-Remaining'] = str(remaining)
    response.headers['X-RateLimit-Reset'] = str(now + window)

    if count > limit:
        response.status = 429
        response.headers['Retry-After'] = str(window)
        return {'error': 'rate_limit_exceeded', 'retry_after': window}

@app.route('/api/data', methods=['GET'])
def get_data():
    return {'data': '...'}
```

## See Also

- [[CON-api-design-principles]] — API design patterns
- [[CON-api-security]] — security considerations
- [[CON-caching-strategies]] — caching + rate limiting together
- [[CON-scalability-patterns]] — distributed systems
