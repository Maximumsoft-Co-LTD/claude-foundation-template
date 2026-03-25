---
type: concept
tags: [devops, deployment, blue-green, canary, rolling, feature-flag]
related: [CON-cicd-pipeline, CON-monitoring-observability]
updated: 2026-03-25
---

# Deployment Strategies

## Strategy Comparison

| Strategy | Downtime | Rollback Speed | Risk | Complexity |
|----------|----------|---------------|------|------------|
| Recreate | Yes | Redeploy | High | Low |
| Rolling | No | Slow | Medium | Low |
| Blue/Green | No | Instant | Low | Medium |
| Canary | No | Instant | Lowest | High |
| Feature Flag | No | Instant | Lowest | Medium |

---

## Recreate

```
Old version → KILL ALL → Deploy new version → Start

Pros: Simple, no compatibility issues
Cons: Downtime during switch
Use: Dev/staging environments, non-critical systems
```

---

## Rolling Update

```
Instance 1: [v1] → [v2]
Instance 2: [v1] → [v2]   (while instance 1 serves v2)
Instance 3: [v1] → [v2]   (while 1+2 serve v2)

Pros: No downtime, simple
Cons: v1 and v2 run simultaneously → must be backward compatible
Use: Kubernetes default strategy
```

---

## Blue/Green

```
Blue (v1) currently receives 100% traffic
Green (v2) deployed and tested in background
    ↓
Switch load balancer: Green receives 100% traffic
Blue stays up (instant rollback = switch back)

Pros: Zero downtime, instant rollback
Cons: Requires 2x infrastructure cost during switch
Use: High-traffic production, when you want clean switch
```

---

## Canary Release

```
v1: 100% traffic
    ↓ Deploy v2 to 5% of users
v1: 95% | v2: 5%
    ↓ Monitor for 15-30 min
    ↓ If OK: ramp to 25% → 50% → 100%
    ↓ If errors: rollback (stop sending to v2)

Pros: Real user feedback, minimal blast radius
Cons: Complex routing, longer rollout
Use: Large traffic, critical features, A/B testing
```

---

## Feature Flags

```typescript
// Code ships to production, feature controlled by flag
if (featureFlags.isEnabled('new-checkout', user.id)) {
  return <NewCheckout />
} else {
  return <OldCheckout />
}

// Enable for: % of users, specific users, specific regions
```

**Providers:** LaunchDarkly, Flagsmith, Unleash, AWS AppConfig

**Use cases:**
- Dark launch (code in prod, feature off)
- A/B testing
- Kill switch for problematic features
- Gradual rollout by user segment

---

## Choosing a Strategy

```
Is this a small team/early stage?
  → Rolling update (simple, no downtime)

Need instant rollback?
  → Blue/Green

Large user base, testing new features carefully?
  → Canary

Frequent code deploys, decouple from feature release?
  → Feature Flags
```

## Related

- [[CON-cicd-pipeline]] — strategies implemented in CD pipeline
- [[CON-monitoring-observability]] — monitor during/after deployment
- [[../../../00-MOC/MOC-DevOps]]
