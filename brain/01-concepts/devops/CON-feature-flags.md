---
type: concept
tags: [devops, feature-flags, deployment, release, fundamentals]
related: [CON-trunk-based-development, CON-deployment-strategies, CON-cicd-pipeline]
updated: 2026-04-29
source: template
---

# Feature Flags

## Core idea

A **feature flag** (also: feature toggle) is a runtime switch that controls whether a code path is active.

The deep idea: **decouple deploy from release.** Code can be deployed (running in production) without being released (visible to users) — and vice versa.

Without flags: deploy = release. They happen together. Risk is concentrated.
With flags: deploy whenever the code is correct; release whenever the business is ready. Risk is spread.

## The decoupling

```
Deploy:   "the code is on prod servers"
Release:  "the user can experience the feature"

Without flags:                With flags:
deploy ── release             deploy ─────────── release
        ↑                              ↑                   ↑
        same event             code lands hidden    flag flipped on
```

This is what enables **trunk-based development** ([[CON-trunk-based-development]]) — incomplete features land in `main` behind a flag.

## Flag types

### Release flags
Hide unfinished features. Lifetime: weeks. Removed once feature is fully rolled out.

```ts
if (flags.enabled('new-checkout-flow', userId)) { ... }
```

### Experiment flags (A/B test)
Bucket users into variants for measurement. Lifetime: until the experiment concludes.

```ts
const variant = flags.variant('checkout-button-color', userId);  // 'control' | 'red' | 'blue'
```

### Operational flags (kill switches)
Disable a feature in production without redeploying. Lifetime: indefinite — these protect prod.

```ts
if (flags.enabled('use-new-pricing-service')) {
  return newPricingService.calc(...);
}
return legacyPricing.calc(...);  // fallback if new service is degraded
```

### Permission / entitlement flags
Gate features by plan tier or user group. Lifetime: as long as the product exists.

> **Heuristic:** if a flag will live forever, it's not really a flag — it's a permission, config, or feature flag system entitlement. Treat it as durable infrastructure, not toggle code.

## Targeting strategies

| Strategy | Use |
|----------|-----|
| **Percentage rollout** | 1% → 10% → 50% → 100% |
| **User ID hash** | Deterministic — user X always gets the same variant |
| **Environment** | On in dev, off in prod |
| **Plan tier / role** | "enterprise" customers get the new export feature |
| **Date / time window** | Black Friday banner |
| **Geographic** | EU-only because of GDPR variant |

Most flags combine several (e.g., "5% rollout to free-tier users in US").

## How they're stored

| Storage | Pros | Cons |
|---------|------|------|
| Hardcoded constant | Simple | Requires deploy to flip |
| Environment variable | Flips with restart | Still requires restart |
| Config file | Hot-reloadable | Manual ops |
| Database row | Dynamic | DB load on every check |
| **Feature flag service** (LaunchDarkly, Unleash, ConfigCat, Flipt, Statsig) | SDK + caching, targeting, audit log | Cost, dependency |

Production-grade flag systems cache locally and update via streaming, so flag checks are sub-millisecond and survive provider outages.

## The off-by-default invariant

**Default to `false`.** A new flag rollout is opt-in. If the flag service is unreachable, code paths default to the safe behavior (usually the old code).

```ts
// good
const enabled = await flags.isEnabled('new-flow', userId).catch(() => false);

// bad — fail-open could leak unfinished feature
const enabled = await flags.isEnabled('new-flow', userId).catch(() => true);
```

## Flag lifecycle

```
1. Create flag (off by default)
2. Merge code paths behind the flag
3. Deploy (code reaches prod, flag still off)
4. Internal team enables flag for themselves
5. % rollout: 1% → 10% → 50% → 100%
6. Decision: keep or kill the new path
7. ⚠️ DELETE the flag and the unused branch
```

Step 7 is the most often skipped — and the source of "flag debt."

## Anti-patterns and "flag debt"

| Anti-pattern | Effect | Fix |
|--------------|--------|-----|
| **Eternal release flag** | 2 years later still in code, nobody knows what it does | Removal date mandatory; quarterly audit |
| **Nested flags** | `if (flagA && flagB && !flagC) { ... }` | Combinatorial test space; refactor or kill |
| **Flag for trivial change** | "Should we lowercase email?" gets a flag | Just deploy it |
| **Flag without metrics** | Rollout to 100% with no measurement of impact | Wire metrics into the rollout |
| **Flag service is single point of failure** | Service down → site down | SDK with local cache + fail-closed default |
| **Flag-driven business logic** | "Customer pays X if flag=on" | Flags are for **rollouts**, not pricing — promote to a config or entitlement |

## Testing with flags

A flag effectively doubles the test surface. Mitigations:

- **Unit tests** call the flagged code path directly, both branches
- **Integration tests** run with default (production) flag values
- **Staging** mirrors prod flag config
- **Canary** flag-gated rollout *is itself* a test

## Flag observability

Every flag check should be logged with:
- Flag name
- Value returned
- Targeting reason (which rule matched)
- User/context

This lets you debug "why did user X see the new flow?" months later.

## Flags ↔ this template's workflow

When a task introduces a user-visible feature, the requirement doc's **NFR / Rollout** section should specify:
- Flag name (or "no flag — direct rollout")
- Targeting plan (% rollout schedule)
- Removal criteria (what proves the new code path is safe to keep)
- Fallback behavior if the new path errors

## Related

- [[CON-trunk-based-development]] — flags are TBD's enabler
- [[CON-deployment-strategies]] — canary / blue-green pair with flags
- [[../product-manager/CON-metrics-product]] — A/B experiments need solid metrics
- [[CON-cicd-pipeline]] — flags decouple from CI cadence
