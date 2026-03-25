---
type: pattern
id: PAT-002
category: implementation
tags: [parallel, agents, FE, BE, performance]
related: [CON-vertical-slice, DEC-003-vertical-slice-tasks]
updated: 2026-03-25
---

# PAT-002 — Parallel Agent Implementation (FE + BE)

## Problem

Implementing a vertical slice sequentially (BE first, then FE) blocks FE work and doubles calendar time. The two layers are largely independent once the API contract is agreed.

## Solution

After design is confirmed, split implementation into two parallel sub-agents:

```
Main context: run DB migrations (if any)
    ↓ (fire in parallel)
Agent C — FE Implementation          Agent D — BE Implementation
  Write components per design doc       Write endpoints per design doc
  Implement state + API calls           Implement service + repository
  Handle loading/error states           Handle validation + error codes
  Run FE tests after each unit          Run BE tests after each unit
  Report bugs (do not call /issue)      Report bugs (do not call /issue)
    ↓ (wait for both)
Main context: collect bug reports → /issue per bug
    ↓
Full test suite (FE + BE in parallel)
```

## Trigger Conditions

Activate parallel agents when the design docs show:
- `HAS_FE`: FE design has test plan items
- `HAS_BE`: BE design has test plan items
- Both are true → spawn Agent C and Agent D

## Pre-condition: Shared Types

If FE and BE share type/interface definitions (`SHARED_TYPES = true`), write those in the main context first, then spawn agents.

## When NOT to Use

- FE-only or BE-only tasks → implement sequentially in main context
- Tasks where FE state depends on real BE responses at every step (tight coupling) → sequential

## Bug Handling

Agents log bugs during implementation but do NOT call `/issue` themselves. They surface the bug descriptions to the main context, which calls `/issue [task-id] [description]` once per bug after both agents complete.

## Related

- [[../01-concepts/CON-vertical-slice]]
- [[../02-decisions/DEC-003-vertical-slice-tasks]]
- `/implement` command in `.claude/commands/implement.md`
