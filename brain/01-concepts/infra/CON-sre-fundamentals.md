---
type: concept
tags: [infra, SRE, SLI, SLO, SLA, error-budget, reliability]
related: [CON-cloud-fundamentals, CON-scalability-patterns]
updated: 2026-03-25
source: template
---

# SRE Fundamentals (Site Reliability Engineering)

## Core Philosophy

**SRE = Software Engineering applied to Operations**

> "Hope is not a strategy" — measure everything, automate everything, design for failure

## SLI / SLO / SLA

### SLI — Service Level Indicator

A quantitative measure of service behavior:
```
Common SLIs:
  Availability:   % of requests returning 2xx/3xx (not 5xx)
  Latency:        % of requests served < 200ms
  Error Rate:     % of failed requests
  Throughput:     Requests per second
  Durability:     % of stored data accessible when needed
```

### SLO — Service Level Objective

Internal target for your SLI:
```
"99.9% of requests succeed" = 43.8 min downtime/month
"99.5% of requests < 200ms latency"

SLO is agreed within the organization
Choose SLOs that matter to users (not just impressive numbers)
```

### SLA — Service Level Agreement

External commitment to users/customers, with consequences:
```
"We guarantee 99.9% uptime or give service credit"
SLA ≤ SLO (buffer needed for unexpected events)
SLA violation → financial/reputational consequences
```

## Error Budget

```
Error Budget = 1 - SLO

If SLO = 99.9%:
  Error Budget = 0.1% per month
               = 43.8 minutes of downtime/month
               = ~1.4 minutes/day

Budget status:
  Budget remaining > 50% → deploy features freely
  Budget remaining < 50% → slow down, focus on reliability
  Budget exhausted       → feature freeze, only reliability work
```

## Incident Management

```
Detection (MTTD — Mean Time to Detect)
    ↓ Alert fires
Response (MTTR — Mean Time to Respond)
    ↓ On-call acknowledges
Diagnosis
    ↓ Root cause identified
Resolution (MTTR — Mean Time to Resolve)
    ↓ System restored
Post-mortem (blameless)
    ↓ Learn + prevent recurrence
```

## Blameless Post-Mortem

**Goal:** Learn from incidents, not assign blame

```
Structure:
  1. Timeline — what happened and when
  2. Root Cause — 5 Whys until systemic cause found
  3. Impact — users affected, downtime, data loss
  4. Resolution — what fixed it
  5. Action Items — prevent recurrence (owner + deadline)

"5 Whys" example:
  Why did the server crash? → Out of memory
  Why out of memory? → Memory leak in auth service
  Why wasn't it caught? → No memory alerting
  Why no alerting? → Not part of our setup checklist
  Why not in checklist? → No post-incident process existed
  → Fix: Add alerting to setup checklist + monitoring runbook
```

## Toil — What to Automate

**Toil** = manual, repetitive, automatable work that scales with traffic

```
Signs of toil:
  - "We restart the service every week"
  - "I manually approve deployments"
  - "I check the DB size every Monday"

SRE rule: Keep toil < 50% of time
Remaining time → engineering work (automating the toil)
```

## Related

- [[CON-cloud-fundamentals]] — infrastructure that SRE manages
- [[CON-scalability-patterns]] — reliability through design
- [[../devops/CON-monitoring-observability]] — SLI measurement tools
- [[../../../00-MOC/MOC-Infrastructure]]
