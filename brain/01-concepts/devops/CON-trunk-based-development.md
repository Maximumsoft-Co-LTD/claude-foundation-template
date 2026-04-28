---
type: concept
tags: [devops, git, branching, ci-cd, fundamentals]
related: [CON-cicd-pipeline, CON-feature-flags, CON-deployment-strategies, CON-version-control-git]
updated: 2026-04-29
source: template
---

# Trunk-Based Development

## Core idea

**One long-lived branch** (`main` / `trunk`). Every developer commits to it at least daily, in small increments. Long-lived feature branches don't exist — incomplete work hides behind **feature flags** instead of unmerged branches.

This is the branching model that makes continuous delivery actually work.

## The model

```
main: ────●────●────●────●────●────●────●──── (always green, always deployable)
            │    │    │    │    │
        dev1   dev2  dev1  dev3 dev2
        (small commits, ≤1 day each)
```

Vs Git Flow:
```
main:    ────────────────●──────────●──── (only merges from release)
develop: ──●──●──●──●──●─┘──●──●──●─┘
feat/A:    └──●──●──●──┘
feat/B:           └──●──●──●──┘
release:                      └─●──┘
                              (lots of long-lived branches → painful merges)
```

## Rules

1. **Single trunk.** No `develop`, no `release/*`, no long-lived branches.
2. **Small commits, daily.** If a change can't ship in a day, **gate it with a feature flag**.
3. **Trunk is always green.** CI runs every commit; if it fails, fix or revert immediately.
4. **Short-lived branches OK.** Local branch + PR → merge same day is fine; a week-old PR is a smell.
5. **No "code freeze."** Trunk is permanently shippable.

## Why it works

**Merge conflicts shrink.** Two devs touching the same file for two hours create much less pain than two devs touching it for two weeks.

**CI signal stays sharp.** With many small commits, when CI fails you know exactly which commit broke it. With a single mega-PR, the bisect target is a 500-line diff.

**Continuous delivery becomes possible.** You can deploy `main` at any moment because it's always green and always merged.

**DORA metrics correlate.** High-performing teams using TBD deploy 208× more frequently with 106× faster lead times than low-performers (State of DevOps reports).

## What enables it

TBD without these supports collapses:

| Support | Why it matters |
|---------|---------------|
| Fast CI (≤10 min) | Slow CI breaks the daily-merge cadence |
| **[[CON-feature-flags]]** | The mechanism that lets unfinished work merge safely |
| Strong test suite | Confidence to merge directly to `main` |
| Pair / mob review or PR-light culture | Avoids reviews bottlenecking merges |
| Automated rollback | Safety net for when trunk does break |

If your CI takes 30 minutes and tests are sparse, TBD will hurt before it helps. Fix CI and tests first.

## TBD vs feature branches — when each fits

| Situation | Branching model |
|-----------|-----------------|
| SaaS / web service with continuous delivery | **TBD** |
| Library with versioned releases (every 6 months) | Feature branches + release branches |
| Multi-month feature with no flag-able sub-pieces | Long-lived feature branch (rare) |
| Open-source projects with external contributors | Fork-based (PRs from forks; trunk-based internally) |

## TBD with feature flags — concrete pattern

```ts
// New checkout flow merged to main, OFF for users
if (flags.isEnabled('new-checkout-flow', userId)) {
  return renderNewCheckout();
}
return renderOldCheckout();
```

Workflow:
1. Dev writes new code path behind flag, merges to main (flag default: off)
2. CI/CD ships main to prod every commit (or every hour) — new code is in prod but inert
3. PM/dev toggles flag for internal users → 1% → 10% → 100%
4. After full rollout, **delete the flag and the old code path** (this step is critical and often skipped)

## The dark side — flag debt

Feature flags are powerful but accumulate. Every flag is a runtime branch + a code path that could be on or off in any combination. After 50 flags you're testing 2^50 possible states.

**Hygiene rules:**
- Every flag has an owner and a planned removal date
- Tracking ticket lives until the old code path is deleted, not until rollout is 100%
- Quarterly flag audit — kill expired flags
- Flags for permanent capabilities (e.g., "user has feature X") aren't really flags — promote them to entitlements / config

## TBD ↔ this template's workflow

This template uses a **TBD-compatible** branch model:
- One branch per task (`SP[N]/SP[N]-T[NNN]-...`) — short-lived, ideally ≤1 day
- Tasks merge to `main` after `/code-review` and `/testing`
- No long-lived `develop` branch
- Tests are mandatory (`/testing` before `/git-commit`)

You're not full TBD without continuous deploy + feature flags, but the per-task short branch is consistent with TBD.

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| **"Almost trunk-based"** with a `develop` branch | Merge pain at every release | Drop `develop`; merge directly to `main` |
| **TBD without CI** | Trunk breaks all the time | Fix CI **first**, then adopt TBD |
| **TBD without flags** | Half-built features ship visible to users | Add a flag system |
| **Eternal flags** | Codebase = nest of `if (flag)` | Removal date is mandatory |
| **Branch lives 2 weeks** | "We do TBD but..." | Either ship it or flag it |

## Related

- [[CON-feature-flags]] — TBD's enabling mechanism
- [[CON-cicd-pipeline]] — fast CI is non-negotiable
- [[CON-deployment-strategies]] — TBD pairs with continuous delivery
- [[../developer/CON-version-control-git]] — Git workflow comparison
