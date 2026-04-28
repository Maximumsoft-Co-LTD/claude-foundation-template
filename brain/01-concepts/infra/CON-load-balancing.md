---
type: concept
tags: [infra, load-balancing, scalability, networking]
related: [CON-scalability-patterns, CON-networking-basics, CON-cdn-edge]
updated: 2026-04-29
source: template
---

# Load Balancing

## Core idea

A **load balancer (LB)** distributes incoming traffic across multiple backend servers so no single server is overwhelmed and the system continues serving if one server fails. It is the **front door** of any horizontally scaled system.

## L4 vs L7 — choose the layer

The OSI layer the LB inspects determines what it can do.

### Layer 4 (Transport / TCP-UDP)
- Inspects: source IP, destination IP, ports
- Cannot inspect: HTTP headers, URL, body
- **Pros:** extremely fast (no payload parsing), protocol-agnostic (TCP, UDP, anything)
- **Cons:** cannot route by content
- **Examples:** AWS NLB, HAProxy in TCP mode, IPVS

### Layer 7 (Application / HTTP)
- Inspects: HTTP method, URL path, headers, cookies, body
- **Pros:** content-based routing (`/api/*` → backend A, `/static/*` → backend B), cookie session affinity, HTTP/2 multiplexing, SSL termination
- **Cons:** more CPU per request, protocol-specific
- **Examples:** AWS ALB, NGINX, HAProxy in HTTP mode, Envoy, Cloudflare

**Rule of thumb:** L7 unless you need raw TCP throughput or non-HTTP protocols.

## Algorithms

### Round Robin
Cycle through backends in order. Simple, fair when requests are uniform.

```
req1 → server1, req2 → server2, req3 → server3, req4 → server1, ...
```

**Weakness:** ignores actual load. A slow request on server2 still gets requests routed to it.

**Variant — Weighted Round Robin:** assign weights so a stronger server gets proportionally more requests (e.g., 3:2:1).

### Least Connections
Send the next request to whichever backend currently has the **fewest active connections**.

**Strength:** adapts to actual load. Better than round-robin when request durations vary.

**Weakness:** requires the LB to track per-backend connection state.

### IP Hash / Consistent Hash
Hash the client IP (or a key) → backend index. Same client always hits the same backend.

**Use:** sticky sessions without cookies, cache locality (CDN edge).

**Variant — Consistent Hashing:** preserves most assignments when backends are added or removed (key for distributed caches).

### Least Response Time
Send to the backend with the lowest measured response time. Closest to "real" load awareness, but introduces measurement overhead.

### Random / Random of Two
Pick at random. "Power of two choices" picks two and routes to the less loaded — surprisingly good in practice and very simple to implement.

## Sticky sessions (session affinity)

Some applications hold per-user state in server memory (session, in-process cache). They need every request from one user to hit the same backend.

**Implementation:**
- Cookie-based — LB injects a cookie pointing at a specific backend
- IP-based — hash on client IP (breaks behind NAT or mobile)

**Trade-off:** stickiness undermines load balancing (an unlucky backend gets the heavy users), defeats horizontal scaling, and complicates deploys.

**Better:** make backends stateless — store session in Redis, JWT, or a DB. Then any LB algorithm works.

## Health checks

Critical: an LB must **stop sending traffic** to dead backends.

| Check type | What it tests | Example |
|------------|---------------|---------|
| TCP | Port accepts connection | `nc -z host:port` |
| HTTP | Endpoint returns 2xx | `GET /healthz` returns 200 |
| Active vs Passive | Active polls; passive observes real traffic | Most LBs use both |

The `/healthz` endpoint should:
- Be cheap (no DB query)
- Reflect actual readiness (downstream deps reachable)
- Return 503 quickly when degraded so the LB drains traffic

## SSL termination

L7 LBs typically **decrypt** TLS at the edge and speak plain HTTP to backends.

**Pros:**
- Backends don't burn CPU on TLS
- Centralized cert management
- LB can inspect HTTP for routing/logging

**Cons:**
- Internal traffic is unencrypted (mitigate with mTLS or service mesh)

**Alternative:** SSL passthrough (LB does L4, backends do TLS) — needed when backends require client cert auth.

## Multi-tier load balancing

Real systems use layered LBs:

```
DNS round-robin
  → CDN (Cloudflare/Fastly, geo-routing)
  → Regional L4 LB (AWS NLB)
  → Regional L7 LB (AWS ALB / NGINX)
  → Service mesh (Envoy sidecar) per pod
  → Application
```

Each layer adds capability (TLS, routing, observability) without overloading any single component.

## Choosing for common scenarios

| Scenario | Recommended |
|----------|-------------|
| HTTP API, ≤1k req/s | L7 (NGINX/ALB) with round-robin |
| HTTP API, varying request times | L7 with least-connections |
| WebSocket / gRPC | L7 with least-connections + long-lived conn handling |
| TCP service (Redis, MySQL) | L4 with least-connections |
| Cache layer (must hit same node) | Consistent hashing |
| Per-user sticky required | L7 with cookie affinity, but **first** try to make stateless |

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| **No health checks** | Traffic to dead pod for minutes | Configure `/healthz` |
| **Stickiness as default** | Hot spots, hard scaling | Stateless backends |
| **Single LB instance** | LB itself is SPOF | LB pair + DNS / Anycast |
| **Hash on session ID before user logs in** | Pre-auth requests pile on one backend | Hash on IP or use round-robin pre-auth |
| **`/healthz` checks downstream DB on every poll** | DB pile-up from health checks | Cache health for a few seconds |

## Related

- [[CON-scalability-patterns]] — horizontal scaling depends on LBs
- [[CON-networking-basics]] — DNS, TCP, OSI stack
- [[../devops/CON-deployment-strategies]] — blue/green, canary all sit behind an LB
- [[../backend/CON-rate-limiting]] — rate limit at LB or in the app
