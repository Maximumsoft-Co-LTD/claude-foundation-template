---
type: concept
tags: [devops, monitoring, observability, metrics, logs, traces, alerting]
related: [CON-cicd-pipeline, CON-deployment-strategies]
updated: 2026-03-25
---

# Monitoring & Observability

## The 3 Pillars

```
Metrics → "Is the system healthy?"
  → Quantitative, time-series data
  → CPU, memory, request rate, error rate, latency

Logs → "What happened exactly?"
  → Discrete events with context
  → "User 123 failed login at 2026-03-25 10:23:45"

Traces → "Where did the time go?"
  → Request journey across services
  → API → Service A (50ms) → DB (200ms) → Service B (30ms)
```

## Metrics: The 4 Golden Signals

| Signal | What to Measure | Alert When |
|--------|----------------|-----------|
| Latency | p50, p95, p99 response time | p99 > threshold |
| Traffic | Requests per second | Abnormal spike/drop |
| Errors | Error rate (5xx / total) | > 1% error rate |
| Saturation | CPU, memory, queue depth | > 80% sustained |

## Logging Best Practices

```json
// ✅ Structured logs (JSON)
{
  "level": "error",
  "timestamp": "2026-03-25T10:23:45Z",
  "service": "auth-service",
  "traceId": "abc123",
  "userId": "user_456",
  "event": "login_failed",
  "reason": "invalid_password",
  "ip": "192.168.1.1"
}

// ❌ Unstructured logs (hard to query)
console.log("Error: User login failed")
```

**Log Levels:**
- `DEBUG` — development only (never production)
- `INFO` — normal operations (user logged in, order created)
- `WARN` — unusual but handled (retry succeeded, fallback used)
- `ERROR` — failures requiring attention
- `FATAL` — system cannot continue

## Alerting Rules

```
Alert fatigue = too many alerts → engineers ignore them

Alert only on:
  ✅ User-visible impact (high error rate, high latency)
  ✅ Imminent resource exhaustion (disk 90%+)
  ✅ Security events (multiple failed logins)

Don't alert on:
  ❌ Symptoms with no user impact
  ❌ Things that auto-recover
  ❌ "Interesting" metrics (use dashboards instead)
```

## SLI/SLO/SLA

```
SLI (Indicator):   Percentage of requests < 200ms
SLO (Objective):   99.5% of requests < 200ms (monthly)
SLA (Agreement):   99.0% availability (contractual, penalty if broken)

Error Budget = 100% - SLO = 0.5% allowed failures
  → 0.5% of monthly minutes = ~3.6 hours of downtime
  → If budget burned: freeze new deployments, focus on reliability
```

## Tool Stack

| Category | Tools |
|----------|-------|
| Metrics | Prometheus + Grafana, Datadog, CloudWatch |
| Logs | ELK Stack (Elastic/Logstash/Kibana), Loki+Grafana, Datadog |
| Traces | Jaeger, Tempo, Datadog APM, AWS X-Ray |
| Alerting | PagerDuty, OpsGenie, Grafana Alerts |
| Uptime | StatusPage, UptimeRobot |

## Related

- [[CON-cicd-pipeline]] — set up monitoring alerts post-deploy
- [[CON-deployment-strategies]] — monitor during canary rollout
- [[../infra/CON-sre-fundamentals]] — SLI/SLO in SRE context
- [[../../../00-MOC/MOC-DevOps]]
