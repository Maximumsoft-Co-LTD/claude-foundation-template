---
type: concept
tags: [infra, networking, DNS, VPC, load-balancer, CDN, SSL]
related: [CON-cloud-fundamentals, CON-sre-fundamentals, CON-security-fundamentals]
updated: 2026-03-25
---

# Networking Basics

## DNS (Domain Name System)

```
User types: www.example.com
    ↓
Browser checks local cache
    ↓ miss
OS checks /etc/hosts
    ↓ miss
Recursive Resolver (ISP/8.8.8.8)
    ↓
Root Name Server → .com NS
    ↓
.com Name Server → example.com NS
    ↓
example.com Name Server → 93.184.216.34
    ↓
Browser connects to 93.184.216.34
```

**DNS Record Types:**
| Record | Purpose | Example |
|--------|---------|---------|
| A | Domain → IPv4 | example.com → 93.184.216.34 |
| AAAA | Domain → IPv6 | example.com → 2001:db8::1 |
| CNAME | Domain → Domain | www → example.com |
| MX | Mail server | → mail.example.com |
| TXT | Arbitrary text | SPF, DKIM, domain verification |
| NS | Name servers | → ns1.example.com |

**TTL (Time to Live):** How long DNS response is cached. Lower TTL = faster propagation of changes but more DNS queries.

## Load Balancer

```
Internet → Load Balancer → App Server 1
                        → App Server 2
                        → App Server 3
```

**Types:**
```
Layer 4 (Network LB): Routes by IP + TCP/UDP port (fast, simple)
Layer 7 (Application LB): Routes by HTTP headers, path, host (smarter)
  → /api/* → API servers
  → /static/* → S3/CDN
  → Host: admin.example.com → admin servers
```

**Health Checks:** LB pings each server (GET /health). Remove unhealthy servers automatically.

## VPC (Virtual Private Cloud)

```
VPC (10.0.0.0/16) — isolated network in cloud

  Public Subnet (10.0.1.0/24)       ← has route to Internet Gateway
    - Load Balancer
    - Bastion host (SSH jump server)

  Private Subnet (10.0.2.0/24)      ← no direct internet access
    - App servers (EC2)
    - Can reach internet via NAT Gateway (outbound only)

  Database Subnet (10.0.3.0/24)     ← most isolated
    - RDS instance
    - No internet access at all
```

**Security Groups** (virtual firewall at instance level):
```
App Server SG:
  Inbound: port 3000 from Load Balancer SG only
  Outbound: port 5432 to DB SG, 443 to internet

DB SG:
  Inbound: port 5432 from App Server SG only
  Outbound: none
```

## CDN (Content Delivery Network)

```
User in Bangkok → Bangkok CDN Edge ← cached
                                   ← if miss → Origin (Singapore)

CDN Edge servers in 200+ cities globally
→ Static assets (images, JS, CSS) served from nearest edge
→ Dramatically reduces latency for global users
```

**What to put on CDN:**
- Static assets (images, fonts, CSS, JS bundles)
- API responses (if cacheable — GET requests)
- Video/media files

**What NOT to CDN:**
- User-specific data
- Real-time data
- Authenticated API responses (usually)

## SSL/TLS (HTTPS)

```
HTTPS = HTTP + TLS encryption

Why:
  ✅ Encrypts data in transit (man-in-the-middle can't read)
  ✅ Authenticates server identity (certificate)
  ✅ Required for modern browser features (PWA, HTTP/2)
  ✅ SEO ranking signal
  ✅ User trust (🔒 in browser)

TLS 1.3 = current standard (faster, more secure than 1.2)

Certificate:
  Let's Encrypt = free, auto-renew (90 days)
  AWS ACM = free for AWS resources
  Self-signed = only for internal/development

HTTPS setup:
  1. Get certificate (Let's Encrypt / ACM)
  2. Configure at Load Balancer (terminate SSL there)
  3. HTTP → HTTPS redirect at LB level
  4. Internal traffic (LB → app) can be HTTP (within VPC)
```

## HTTP/2 vs HTTP/3

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|-|---------|--------|--------|
| Protocol | TCP | TCP | UDP (QUIC) |
| Multiplexing | ❌ (1 req/connection) | ✅ | ✅ |
| Header compression | ❌ | ✅ HPACK | ✅ QPACK |
| Server push | ❌ | ✅ | ✅ |
| Best for | Legacy | Most apps | Mobile, lossy networks |

## Related

- [[CON-cloud-fundamentals]] — networking lives in cloud VPCs
- [[CON-security-fundamentals]] — network security: firewalls, SSL
- [[CON-scalability-patterns]] — load balancer enables horizontal scaling
- [[../../../00-MOC/MOC-Infrastructure]]
