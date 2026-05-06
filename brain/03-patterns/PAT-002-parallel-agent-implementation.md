---
type: pattern
id: PAT-002
category: implementation
tags: [parallel, agents, vertical-slice, performance]
related: [CON-vertical-slice, DEC-003-vertical-slice-tasks, PAT-005-subagent-driven-development]
updated: 2026-05-05
supersedes: PAT-002 (within-task FE/BE split — see History)
---

# PAT-002 — Parallel Agent Implementation (Between Tasks, Not Within)

## Problem

A sprint contains multiple independent tasks (vertical-slice user stories). Running them sequentially blocks calendar time when no dependency exists between them. But splitting a SINGLE task between two agents (one for FE, one for BE) produces broken contracts — the FE agent invents a request shape, the BE agent invents a response shape, and the two never converge without a rework round.

## Solution

Parallelise at the **task** boundary, not the **layer** boundary:

```
Sprint backlog: [SP1-T001 (foundation), SP1-T002 (deps T001), SP1-T003 (independent)]
    ↓
Tier 1 (no deps):       Agent X owns SP1-T001 end-to-end (FE + BE + tests)
                        Agent Y owns SP1-T003 end-to-end (FE + BE + tests)
    ↓ wait
Tier 2 (depends T001):  Agent Z owns SP1-T002 end-to-end
```

Each agent owns ONE task fully — its FE, BE, data, tests, and verification. The contract owner stays in one head, so the API and the UI agree by construction.

## Trigger Conditions

- Sprint has 2+ tasks that share no `Depends On` relationship → parallelise.
- Each task is self-contained (no shared in-flight contract with another running task).

## When NOT to Use

- Two tasks with a shared in-flight contract (one task defines the API the other consumes mid-sprint) → run sequentially.
- A single task that "feels too big to give one agent" → the answer is to **split the task** at `/new-sprint` Step 3 vertical-slice rules, NOT to split the agent.

## Within-task work always stays single-owner

For a single task:
- Write shared types first (if any).
- Write all failing tests (FE + BE) — single owner.
- Implement BE first, then FE (FE typically consumes the BE contract).
- Run tests after each logical unit.

If the task needs a sub-agent for context-budget reasons, spawn ONE sub-agent that owns the WHOLE task end-to-end. Never two parallel agents split by layer.

## How to apply

- `/run-tasks` (or `/run-tasks-p` for headless) builds dependency tiers — each task in a tier is one agent.
- `/implement` Step 2 + Step 3 follow single-owner-end-to-end (see updated command spec).

## History

The original PAT-002 (2026-03-25) prescribed within-task FE/BE parallel split (Agent C + Agent D). That design contradicted `.claude/rules/parallel-work.md` and was discovered via the SP1 workflow-test (see `docs/sprints/SP1/WORKFLOW-TEST-REPORT.md` F12). This rewrite (2026-05-05) reorients the pattern to between-task parallelism, which is what `/run-tasks` already does correctly.

## Related

- [[../01-concepts/CON-vertical-slice]]
- [[../02-decisions/DEC-003-vertical-slice-tasks]]
- [[PAT-005-subagent-driven-development]] — the 3-agent pipeline within a single task (implementer → spec reviewer → quality reviewer) is sequential, not parallel
- `.claude/rules/parallel-work.md` — the authoritative rule
- `.claude/commands/run-tasks.md` and `run-tasks-p.md` — the commands that apply this pattern
