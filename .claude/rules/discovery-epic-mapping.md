---
name: Discovery → Epic Mapping Rule
description: Maps one discovery doc to one or more epics, each producing exactly one `/new-sprint` invocation with explicit dependency ordering.
scope: universal
---

# Discovery → Epic Mapping Rule

Authoritative mapping between a discovery doc and the sprints (epics) it produces. Apply when running `/discovery` Step 4 and `/new-sprint` Step 1.

## The rule

**One discovery doc → one or more epics. One epic → exactly one `/new-sprint` invocation.**

| Discovery scope | Epic Breakdown table | Next Steps |
|------------------|---------------------|------------|
| Fits in one sprint | empty | one `/new-sprint [SP-N] "[epic description]"` line |
| Spans multiple sprints | one row per epic, in dependency order | one `/new-sprint` line per row, sequential `[SP-N]` IDs |

## Constraints

- Epics in the Epic Breakdown table must have an explicit `Depends On` cell — `—` for the first epic, an earlier epic ID for any later one.
- Shared entities (auth model, user table, design tokens) must be listed in the discovery doc's **Shared entities / cross-epic concerns** subsection. Ownership belongs to **the first epic that introduces them**; later epics consume, never re-declare.
- Each `/new-sprint` invocation must reference the originating discovery doc in its sprint overview metadata (e.g. `Origin: docs/discovery/disc-NNN-name.md`). No orphan sprints.

## Why

A discovery doc captures user-and-problem context once. Splitting that context across multiple sprints without an explicit mapping leads to duplicated assumptions, conflicting designs, and shared entities owned by no one. Forcing the mapping at discovery time surfaces scope creep before code starts.

## Verification

After running `/discovery`:

- If `Estimated sprints = 1` → Epic Breakdown is empty AND Next Steps has exactly one `/new-sprint` line.
- If `Estimated sprints > 1` → Epic Breakdown has at least 2 rows AND Next Steps has the same number of `/new-sprint` lines in dependency order.

After running `/new-sprint`:

- The sprint overview cites the discovery doc under `Origin:`.
- The chosen epic from the Epic Breakdown matches one row exactly — title, scope, dependencies copy through.
