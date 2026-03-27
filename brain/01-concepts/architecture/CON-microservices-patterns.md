---
type: concept
tags: [architecture, microservices, circuit-breaker, saga, service-mesh, api-gateway]
related: [CON-event-driven-architecture, CON-domain-driven-design, CON-clean-architecture, CON-cicd-pipeline, CON-container-orchestration]
updated: 2026-03-25
source: template
---

# Microservices Patterns

**Definition:** A set of proven solutions for common challenges in microservice architectures, including service communication, resilience, observability, and deployment.

## API Gateway Pattern

Single entry point for all client requests. Handles routing, authentication, rate-limiting, request/response transformation.

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ https://api.example.com/...
       ↓
┌──────────────────────┐
│   API Gateway        │
│ - Route /orders → O  │
│ - Route /users → U   │
│ - Rate limit         │
│ - Auth (JWT)         │
│ - Request logging    │
└──────┬───────┬───────┘
       ↓       ↓
   ┌───────┐ ┌───────┐
   │ Order │ │ User  │
   │ Svc   │ │ Svc   │
   └───────┘ └───────┘
```

```typescript
// API Gateway
export class ApiGateway {
  constructor(
    private authMiddleware: AuthMiddleware,
    private rateLimiter: RateLimiter,
    private logger: Logger,
    private orderServiceClient: OrderServiceClient,
    private userServiceClient: UserServiceClient
  ) {}

  async handleRequest(req: Request): Promise<Response> {
    // Authentication
    const user = await this.authMiddleware.authenticate(req.headers.authorization);
    if (!user) return new Response(401, { error: 'Unauthorized' });

    // Rate limiting
    if (!this.rateLimiter.allow(user.id)) {
      return new Response(429, { error: 'Too many requests' });
    }

    // Route to appropriate service
    if (req.path.startsWith('/orders')) {
      return await this.orderServiceClient.call(req);
    } else if (req.path.startsWith('/users')) {
      return await this.userServiceClient.call(req);
    }

    return new Response(404, { error: 'Not found' });
  }
}

// Client sees single API
GET https://api.example.com/orders/123
// Gateway routes to internal Order Service
```

**Responsibilities:**
- ✅ Routing to services
- ✅ Authentication/Authorization
- ✅ Rate limiting, throttling
- ✅ Request/response transformation
- ✅ Load balancing
- ❌ Business logic (should be in services)

**Alternatives:**
- Backend for Frontend (BFF) — separate gateway per client type
- Service mesh — sidecar proxies instead of centralized gateway

## Circuit Breaker Pattern

Prevents cascading failures by stopping calls to failing services.

### States

```
CLOSED (normal)
  ↓ Threshold failures → OPEN

OPEN (failing)
  ↓ Timeout → HALF_OPEN

HALF_OPEN (testing)
  ↓ Success → CLOSED
  ↓ Failure → OPEN
```

```typescript
export enum CircuitState {
  CLOSED = 'CLOSED',      // Normal, requests flow
  OPEN = 'OPEN',          // Failing, reject immediately
  HALF_OPEN = 'HALF_OPEN' // Testing, allow one request
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;

  constructor(
    private failureThreshold: number = 5,
    private successThreshold: number = 2,
    private timeout: number = 60000 // ms
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitState.OPEN;
      }
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime.getTime() > this.timeout
    );
  }
}

// Usage
const breaker = new CircuitBreaker(5, 2, 60000);

try {
  const user = await breaker.call(() => userService.getUser(userId));
} catch (error) {
  // Circuit is OPEN; fail fast without calling service
  logger.error('User service unavailable');
  // Return cached data or fallback response
  const cachedUser = await cache.get(`user:${userId}`);
  return cachedUser;
}
```

**Benefits:**
- Fails fast instead of waiting for timeout
- Prevents cascade (one failure doesn't take down entire system)
- Self-healing (HALF_OPEN allows recovery)

**Tools:** Hystrix, Resilience4j (Java), Polly (.NET), aws-lambda-powertools (Python)

## Service Mesh

A dedicated infrastructure layer (using sidecar proxies) handles service-to-service communication.

```
Before Service Mesh:
  User Service → Payment Service
  (direct call, auth, retry, etc. in code)

After Service Mesh:
  User Service → Sidecar Proxy → Network → Sidecar Proxy → Payment Service
  (infrastructure handles auth, retry, circuit breaker, tracing)
```

```
Service A Pod:
┌──────────────┐
│ App Container│ ──┐
└──────────────┘   │
┌──────────────┐   │ mTLS + auth
│Envoy Sidecar │───┼──→ Network
└──────────────┘   │
                   │
Service B Pod:     └──→ Sidecar Proxy → App Container
┌──────────────┐
│Envoy Sidecar │ ← (mTLS encrypted traffic arrives here)
└──────────────┘
┌──────────────┐
│ App Container│ ← (internal communication, plain HTTP)
└──────────────┘
```

**Responsibilities:**
- Service discovery (find available instances)
- Load balancing (distribute requests)
- Circuit breaking (fail fast)
- Retry logic (transient failures)
- Timeout enforcement
- mTLS encryption (service-to-service)
- Distributed tracing (observability)
- Rate limiting

**Popular Service Meshes:**
- **Istio** — mature, feature-rich, complex
- **Linkerd** — lightweight, focused
- **Consul Connect** — integrated with Consul service discovery
- **AWS App Mesh** — AWS-managed, integrates with ECS/EKS

**Tradeoff:** Added complexity and resource overhead for cross-cutting concerns

## Saga Pattern: Distributed Transactions

Coordinates multi-service workflows with compensating transactions (already covered in [[CON-event-driven-architecture]], but key for microservices).

## Strangler Fig Pattern

Gradually replace monolith with microservices without big-bang rewrite.

```
Old State:
┌─────────────────┐
│    Monolith     │
│ - User mgmt     │
│ - Orders        │
│ - Payments      │
│ - Inventory     │
└─────────────────┘

Step 1: Extract Orders Service
┌─────────────────┐          ┌──────────────┐
│    Monolith     │ ←────→ │ Orders Svc   │
│ - User mgmt     │          └──────────────┘
│ - Payments      │
│ - Inventory     │

Step 2: Extract Inventory Service
┌─────────────────┐          ┌──────────────┐
│    Monolith     │ ←────→ │ Orders Svc   │
│ - User mgmt     │ ←────→ │ Inventory    │
│ - Payments      │          └──────────────┘
│                 │

Final State:
┌──────────┐
│ API Gw   │
└────┬─────┘
     │
  ┌──┴──┬──────┬─────┐
  ↓     ↓      ↓     ↓
┌──┐ ┌────┐ ┌───┐ ┌───┐
│U │ │Ord │ │Pay│ │Inv│
└──┘ └────┘ └───┘ └───┘
```

**Process:**
1. Identify bounded context to extract (Orders)
2. Create new service with its own database
3. API Gateway routes Orders requests to new service
4. Monolith acts as fallback during transition
5. Gradually move more contexts out
6. Monitor, test, rollback if needed

**Advantages:**
- Low risk (can rollback)
- Validate microservice approach incrementally
- Team learns gradually
- Reduce blast radius

## Service Discovery

How do services find each other?

### Client-Side Discovery

Client queries service registry, gets list of instances.

```typescript
// Client code
const registryClient = new ConsulClient('consul.local');
const instances = await registryClient.getInstances('payment-service');
const instance = loadBalancer.selectInstance(instances);
const result = await http.get(`http://${instance.host}:${instance.port}/pay`);
```

**Pros:** Simple, no extra network hop
**Cons:** Client logic complex, different per language/framework

### Server-Side Discovery

Client calls a gateway/load balancer; it queries registry.

```typescript
// Client code (simple)
const result = await http.get('http://api-gateway/payment/pay');

// Gateway code
app.get('/payment/pay', async (req, res) => {
  const instances = await registryClient.getInstances('payment-service');
  const instance = loadBalancer.selectInstance(instances);
  const result = await http.get(`http://${instance.host}:${instance.port}/pay`);
  res.json(result);
});
```

**Pros:** Client simple, centralized routing
**Cons:** Gateway is bottleneck/SPOF

**Tools:** Consul, Eureka, etcd, Kubernetes DNS

## When NOT to Use Microservices

❌ **Distributed monolith:** Coupled services that must scale together
❌ **Small team:** Operational overhead too high
❌ **Single responsibility:** All logic tightly coupled; can't decompose
❌ **High latency sensitivity:** RPC across services adds 10s-100s ms
❌ **Data consistency critical:** Distributed transactions are hard
❌ **Early stage:** Unknown domains; premature decomposition
❌ **Performance-critical:** GHz-scale latencies needed

**Red flag:** Microservices solving organizational problem, not technical one.

## Monolith-to-Microservices Decision Tree

```
Start: Monolith

Is the codebase complex and hard to change?
  ├─ No → Stay monolith
  └─ Yes ↓

Can you identify clear bounded contexts?
  ├─ No → Refactor to modular monolith first
  └─ Yes ↓

Do you have multiple teams wanting to deploy independently?
  ├─ No → Stay monolith (or modular monolith)
  └─ Yes ↓

Can you afford operational complexity (deployment, monitoring, logging)?
  ├─ No → Modular monolith or slow migration
  └─ Yes ↓

Go ahead: Extract with Strangler Fig pattern
```

## Implementation Checklist

- [ ] Each service owns its database (no shared DB)
- [ ] Services communicate via API (REST, gRPC) or events
- [ ] API Gateway handles cross-cutting concerns
- [ ] Circuit breakers prevent cascading failures
- [ ] Service discovery automated
- [ ] Monitoring & observability (logging, tracing, metrics)
- [ ] Each service independently deployable
- [ ] Clear service boundaries (DDD bounded contexts)
- [ ] Async communication where possible (event-driven)
- [ ] Saga pattern for distributed transactions

## Common Pitfalls

❌ **Sharing databases between services** — creates hidden coupling
❌ **Synchronous chains** — A→B→C→D (4 network hops, cascading failures)
❌ **Chatty services** — frequent small RPCs (latency killer)
❌ **No circuit breaker** — cascade of failures
❌ **No service discovery** — hardcoded IPs/hostnames
❌ **Missing observability** — distributed tracing is essential
❌ **Premature microservices** — before domain is clear
❌ **Not treating network as unreliable** — will timeout, retry, chaos

## Related Notes

- [[CON-event-driven-architecture]] — async communication patterns
- [[CON-domain-driven-design]] — service boundaries from bounded contexts
- [[CON-clean-architecture]] — service internals organized cleanly
- [[CON-cicd-pipeline]] — independent deployment per service
- [[CON-container-orchestration]] — Kubernetes for service deployment
