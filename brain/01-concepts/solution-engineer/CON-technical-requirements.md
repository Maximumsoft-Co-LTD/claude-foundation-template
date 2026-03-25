---
type: concept
tags: [solution-engineer, requirements, NFR, functional, non-functional]
related: [CON-solution-design-process, CON-system-integration-patterns, CON-sre-fundamentals, CON-scalability-patterns]
updated: 2026-03-25
---

# Technical Requirements: Functional and Non-Functional

Requirements are the contract between customer and solution team. Poorly written requirements lead to scope creep, rework, and unhappy customers.

## Functional vs Non-Functional Requirements

### Functional Requirements (What It Does)

Describes specific behaviors and features.

**Format:** "The system shall [action] when [condition] so that [outcome]"

**Examples:**
- "The system shall allow users to upload CSV files and validate data format before import"
- "The system shall send email notifications within 30 seconds of event occurrence"
- "The system shall support role-based access control with minimum 5 roles"

**Characteristics:**
- ✅ Specific, testable
- ✅ User or system-facing
- ✅ Directly impacts user experience
- ✅ Usually in backlog/story form

### Non-Functional Requirements (How Well It Does It)

Describes quality attributes and constraints.

**Format:** "The system shall [quality attribute] with [measurable criteria]"

**Examples:**
- "The system shall be available 99.9% (SLA: < 8.77 hours downtime/year)"
- "The system shall support 10,000 concurrent users without performance degradation"
- "The system shall encrypt all data in transit and at rest using AES-256"
- "The system shall respond to queries in < 2 seconds for 95th percentile"

## The FURPS+ Model

FURPS is a comprehensive framework for non-functional requirements:

| Category | Definition | Examples |
|---|---|---|
| **Functionality** | Features and completeness | Covered above; use functional requirements |
| **Usability** | Ease of use, UI quality | Response time < 3 seconds, <3 clicks to accomplish task |
| **Reliability** | Uptime, data integrity | 99.9% availability, zero data loss |
| **Performance** | Speed, throughput | < 2s response time, 1000 requests/sec |
| **Supportability** | Maintainability, debuggability | Logs captured for troubleshooting, APIs documented |

**Plus (+):** Design, implementation, physical, regulatory

## Performance Requirements

### Latency (Response Time)

How fast does the system respond?

```
Guideline:
< 100ms: Instant (felt by user)
100-300ms: Fast (user notices; acceptable)
300-1000ms: Perceptible (noticeably slow)
> 1000ms: Unresponsive (user frustrated)
```

**Example requirement:**
"API shall respond to GET requests in < 200ms at 50th percentile, < 1000ms at 95th percentile"

### Throughput (Capacity)

How much load can the system handle?

```
Requests per second: 1000 req/s = 86.4 million/day
Concurrent users: 10,000 concurrent users
Data volume: 1TB new data/month
```

**Example requirement:**
"The system shall process 5000 transactions per second during peak hours (9am-5pm EST)"

### Availability (Uptime)

How often is the system up?

| Availability | Downtime/Year | Use Case |
|---|---|---|
| 99% | 87.6 hours | Tolerable for internal tools |
| 99.5% | 43.8 hours | Standard for SaaS |
| 99.9% | 8.77 hours | Critical for revenue-generating systems |
| 99.99% | 52 minutes | Mission-critical (payment, medical) |

**Example requirement:**
"The system shall maintain 99.9% availability, measured monthly, excluding scheduled maintenance"

## Security Requirements

### Authentication

How do we know who you are?

```
OAuth 2.0 / OpenID Connect (recommended for modern systems)
SAML (enterprise integration)
MFA / 2FA (additional security)
API keys (service-to-service)
```

**Example requirement:**
"The system shall support OAuth 2.0 and SAML 2.0 authentication, requiring MFA for admin accounts"

### Authorization

What are you allowed to do?

```
Role-Based Access Control (RBAC): User has role, role has permissions
Attribute-Based Access Control (ABAC): More fine-grained, supports context
```

**Example requirement:**
"The system shall enforce role-based access control with minimum roles: Admin, Manager, User, Guest"

### Data Protection

How is data secured?

```
Encryption in Transit: TLS 1.3 minimum
Encryption at Rest: AES-256
Key Management: AWS KMS or similar
PII Handling: Identify, classify, mask sensitive data
```

**Example requirement:**
"All data in transit shall be encrypted using TLS 1.3; all data at rest shall be encrypted using AES-256"

### Compliance

Regulations you must follow.

| Regulation | Use Case | Key Requirements |
|---|---|---|
| **GDPR** | EU customers | Right to erasure, consent, data portability |
| **HIPAA** | Healthcare data | Audit logs, access controls, encryption |
| **SOC 2** | Customers require security audit | Controls for confidentiality, integrity, availability |
| **PCI-DSS** | Payment data | Strict controls, annual audits |
| **FedRAMP** | US government | Specific security controls, compliance documentation |

## Scalability Requirements

### Vertical Scaling

How big can a single instance grow?

```
Memory: 64GB, 128GB, 256GB
CPU: 16 cores, 32 cores, 64 cores
Storage: 1TB, 10TB, 100TB
```

### Horizontal Scaling

Can you add more instances?

```
"The system shall horizontally scale to 100 instances without performance degradation"
"The database shall support read replicas for scaling queries"
```

## Writing Good Non-Functional Requirements

### SMART Criteria

- **Specific** — Not "fast" but "< 200ms at p95"
- **Measurable** — Quantifiable, testable
- **Achievable** — Realistic with current tech
- **Relevant** — Tied to business need
- **Time-bound** — Under what conditions? (peak load, normal operation)

**Bad NFR:** "The system should be scalable and performant"
**Good NFR:** "The system shall horizontally scale to 10k concurrent users with response time < 500ms at p95"

## Requirements Traceability Matrix (RTM)

Maps requirements to design, tests, and validation:

| Req ID | Requirement | Design Element | Test Case | Status |
|---|---|---|---|---|
| FR-001 | User can upload CSV | UploadComponent | test_csv_upload_valid | ✅ |
| FR-002 | System validates format | DataValidator | test_csv_validation_errors | ✅ |
| NFR-001 | Availability 99.9% | Multi-region setup | test_failover_failback | ⚙️ |
| NFR-002 | Response time < 2s | Query optimization | test_response_time_p95 | ⚙️ |

**Use:** Ensure every requirement is addressed in design and tested before release.

## Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| **Gold-plating** | Over-specifying "just in case" | Focus on current need; revisit later |
| **Vague metrics** | "High availability" without numbers | Define SLA in percentages |
| **Untestable requirements** | "System should be robust" | Specify measurable criteria |
| **Forgotten edge cases** | "User can login" but what about rate limits, account lockout? | Think through failure scenarios |
| **Scope creep** | Requirements added mid-project | Freeze requirements before design; handle new ones in backlog |

## Related References

See [[CON-solution-design-process]] for gathering requirements, [[CON-sre-fundamentals]] for SLA/SLO definition, and [[CON-scalability-patterns]] for scaling architecture.
