---
type: concept
tags: [infra, disaster-recovery, RTO, RPO, backup, failover, HA]
related: [CON-sre-fundamentals, CON-cloud-fundamentals]
updated: 2026-03-25
source: template
---

# Disaster Recovery

## Key Metrics

```
RTO (Recovery Time Objective):
  Maximum acceptable downtime
  "We must be back online within 4 hours"
  → How fast must we recover?

RPO (Recovery Point Objective):
  Maximum acceptable data loss period
  "We can't lose more than 1 hour of data"
  → How much data can we afford to lose?

Lower RTO + RPO = more expensive to achieve
```

## DR Strategies (Cost vs Speed)

```
                High Cost ←————————————————→ Low Cost
Fast RTO/RPO   Multi-Site Active-Active
               ↓
               Warm Standby (scaled-down copy)
               ↓
               Pilot Light (core systems only)
               ↓
Slow RTO/RPO   Backup & Restore
```

### Backup & Restore (RPO: hours, RTO: hours)
```
- Daily backups to S3
- Restore from backup on disaster
- Cheapest option
- Longest downtime

Use for: Non-critical, low-traffic systems
```

### Pilot Light (RPO: minutes, RTO: 30-60 min)
```
- Core DB replicated continuously to DR region
- App servers OFF in DR region (pilot light)
- On disaster: turn on app servers, redirect DNS

Use for: Moderate criticality, some downtime acceptable
```

### Warm Standby (RPO: seconds, RTO: 5-15 min)
```
- Scaled-down version always running in DR region
- DB continuously replicated
- On disaster: scale up DR env, redirect DNS

Use for: Important systems, < 15 min downtime budget
```

### Multi-Site Active-Active (RPO: 0, RTO: 0)
```
- Full system running in 2+ regions simultaneously
- Traffic distributed across regions
- If one region fails, traffic to other

Most expensive, most complex
Use for: Mission-critical, banking, e-commerce
```

## Backup Best Practices

```
3-2-1 Rule:
  3 copies of data
  2 different storage media/locations
  1 offsite backup

Database backup:
  ✅ Automated daily full backups
  ✅ Point-in-time recovery (WAL/binlog) for fine-grained restore
  ✅ Test restore regularly (at least quarterly)
  ✅ Separate backup account (protect from ransomware)

Backup retention:
  Daily: 7 days
  Weekly: 4 weeks
  Monthly: 12 months
  Yearly: 7 years (depends on compliance)
```

## High Availability (HA)

```
Availability = (total time - downtime) / total time × 100%

99.9%   = 8.7 hours/year downtime   (1 AZ, auto-restart)
99.95%  = 4.4 hours/year            (multi-AZ RDS, auto-failover)
99.99%  = 52 minutes/year           (multi-AZ + load balancer)
99.999% = 5 minutes/year            (multi-region active-active)

HA requires:
  - Redundancy (no single point of failure)
  - Automated failover (no human needed to switch)
  - Health checks (detect failure fast)
  - Graceful degradation (partial failure ≠ total failure)
```

## DR Runbook Template

```markdown
## Disaster Recovery Runbook: [System Name]

### Detection
- How is disaster detected? (Monitoring alert / user report)
- Who is first to know? (On-call engineer)

### Assessment (< 5 min)
- What failed? (Region / DB / App servers)
- RTO/RPO requirements: [X hours / Y minutes]
- DR strategy for this system: [Backup Restore / Warm Standby / etc]

### Recovery Steps
1. [ ] Alert stakeholders (PagerDuty incident created)
2. [ ] [Specific recovery step]
3. [ ] Redirect DNS to DR environment
4. [ ] Verify application health
5. [ ] Notify users

### Verification
- How to verify system is working?
- Who signs off on recovery?

### Post-Incident
- Conduct blameless post-mortem within 48 hours
- Update runbook with lessons learned
```

## Related

- [[CON-sre-fundamentals]] — RTO/RPO connect to SLO/error budget
- [[CON-cloud-fundamentals]] — DR uses multi-region cloud architecture
- [[../devops/CON-monitoring-observability]] — monitoring detects disasters
- [[../../../00-MOC/MOC-Infrastructure]]
