---
name: Discovery → Epic Mapping Rule
description: Defaults to single-epic. Multi-epic only when at least one explicit trigger fires (≥2 bounded contexts, > 13 SP, hard release-sequence dependency, ≥2 user types with non-overlapping journeys, cross-team ownership). Each epic produces one `/new-sprint` invocation.
scope: universal
---

# Discovery → Epic Mapping Rule

Authoritative mapping between a discovery doc and the sprints (epics) it produces. Apply when running `/discovery` Step 3.4 and `/new-sprint` Step 1.

## The rule

**Default = single-epic. Multi-epic only when at least one explicit trigger fires.**

One discovery doc → one epic by default → exactly one `/new-sprint` invocation. Splitting into multiple epics is the exception, not the norm, and the firing trigger MUST be recorded in the discovery doc.

| Outcome | When | Epic Breakdown table | Next Steps |
|---|---|---|---|
| **Single-epic** (default) | Minimal Mode, OR Full Mode with no multi-epic trigger | empty | one `/new-sprint [SP-N] "[epic description]"` line |
| **Multi-epic** | Full Mode AND ≥ 1 multi-epic trigger fires | one row per epic, in dependency order, with firing trigger noted above the table | one `/new-sprint` line per row, sequential `[SP-N]` IDs |

"Estimated sprints > 1" alone is **not** a trigger — it is a symptom. The trigger must be one of the explicit causes below.

## Multi-epic triggers

A discovery doc qualifies for multi-epic ONLY if at least one of these is true. List the firing trigger(s) above the Epic Breakdown table.

1. **≥ 2 distinct bounded contexts** — the scope spans separate domain boundaries (e.g. auth context + billing context + reporting context), each with its own ubiquitous language, aggregates, and team ownership. Cross-domain integration ≠ separate context; only count a context if it has its own invariants and lifecycle.

2. **Total estimated effort > 13 SP** — rough but decisive. Anything ≤ 13 SP fits inside one sprint as a single epic (one team, one focus). Above 13 SP, the discovery either splits into epics or gets de-scoped at `/new-sprint`.

3. **Hard release-sequence dependency** — Phase 1 must ship to production AND be measured (real users, real data, real metric) BEFORE Phase 2 can be designed or built. This is sequencing forced by external reality (regulatory rollout, user feedback gating, data backfill), not preference for "phased delivery."

4. **≥ 2 user types with non-overlapping primary journeys** — different personas using completely different flows (e.g. admin onboarding flow vs. end-user checkout flow). Same persona doing two related things in one flow ≠ this trigger.

5. **Cross-team ownership boundary** — two engineering teams (or two distinct codebases / repos) must own the work. One team can split work across sprints without splitting the epic; only count this trigger when ownership actually divides.

If none of the above fires → the discovery is single-epic. Period. Do not invent a trigger to justify a split.

## Constraints

- Epics in the Epic Breakdown table must have an explicit `Depends On` cell — `—` for the first epic, an earlier epic ID for any later one.
- Shared entities (auth model, user table, design tokens) must be listed in the discovery doc's **Shared entities / cross-epic concerns** subsection. Ownership belongs to **the first epic that introduces them**; later epics consume, never re-declare.
- Each `/new-sprint` invocation must reference the originating discovery doc in its sprint overview metadata (e.g. `Origin: docs/discovery/disc-NNN-name.md`). No orphan sprints.

## Why default single-epic

The 10-topic discovery interview surfaces stakeholders, journeys, future scope, and risks comprehensively. Without a default-single-epic bias, the AI reads all that input as "lots of things to do" and splits the work prematurely. Each split adds coordination cost (sequencing, shared-entity ownership, multiple sprint planning rounds) — paid up front, recoverable only by re-merging.

A premature multi-epic split looks decisive on paper but produces:
- Speculative epics that never ship (E2 / E3 in the table that get dropped at `/new-sprint`).
- Shared entities owned by no one because "we'll figure it out in Sprint N+1."
- A discovery doc that reads like a roadmap instead of a focused problem statement.

Single-epic by default, multi-epic when forced — never the other way around.

## Verification

After running `/discovery`:

- If `Mode: minimal` → Epic Breakdown empty AND Next Steps has exactly one `/new-sprint` line. No trigger evaluation.
- If `Mode: full` AND no trigger fired → Epic Breakdown empty AND Next Steps has exactly one `/new-sprint` line.
- If `Mode: full` AND ≥ 1 trigger fired → Epic Breakdown has ≥ 2 rows, the firing trigger(s) are noted above the table, AND Next Steps has the same number of `/new-sprint` lines in dependency order.

After running `/new-sprint`:

- The sprint overview cites the discovery doc under `Origin:`.
- For multi-epic discoveries, the chosen epic from the Epic Breakdown matches one row exactly — title, scope, dependencies copy through.
