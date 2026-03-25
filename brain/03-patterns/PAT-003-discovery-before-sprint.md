---
type: pattern
id: PAT-003
category: process
tags: [discovery, planning, upfront-thinking]
related: [CON-sprint-lifecycle]
updated: 2026-03-25
---

# PAT-003 — Discovery Before Every Sprint

## Problem

Teams jump into sprint planning without fully understanding the problem. This leads to:
- Scope changes mid-sprint
- Tasks that need to be split or rewritten
- Missing requirements discovered during implementation
- "We should have known this at the start" retrospective items

## Solution

Always run `/discovery` before `/new-sprint`. The discovery session covers 10 structured topics:

```
1. Problem         — what problem? who experiences it?
2. Users           — primary users + stakeholders
3. Goals           — what does success look like?
4. As-Is Journey   — how do users handle it today?
5. To-Be Journey   — how will the solved flow feel?
6. Context         — previous attempts, related systems
7. Constraints     — tech stack, deadline, budget, compliance
8. Approaches      — options considered + trade-offs
9. Unknowns        — open questions that could affect scope
10. Risks          — biggest risks + is this 1-sprint or multi-sprint?
```

Only ask about topics that aren't already answered. Output: `docs/discovery/disc-NNN-name.md`.

## When to Skip

Discovery is **recommended**, not enforced. `/new-sprint` will warn if no discovery doc exists and ask to confirm proceeding. Teams can skip for:
- Very small tasks with obvious scope
- Continuation of a previously discovered epic

## Coverage Check

After proposing tasks, `/new-sprint` cross-checks them against the discovery doc:
- Every in-scope item → covered by a task
- Every goal → covered by at least one task
- Every user journey → delivered end-to-end by tasks

Uncovered items must be explicitly added to a task or marked out-of-scope.

## Related

- [[../01-concepts/CON-sprint-lifecycle]]
- `/discovery` command in `.claude/commands/discovery.md`
- `/new-sprint` command's Step 3b (coverage check)
