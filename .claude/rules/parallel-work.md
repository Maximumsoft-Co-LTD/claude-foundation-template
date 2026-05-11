---
name: Parallel Work Rule
description: Requires sub-agent dispatch to split at the user-story level (one task per agent), never by layer (FE/BE split forbidden).
scope: universal
---

# Parallel Work Rule

When dispatching multiple sub-agents for parallel implementation, the unit of split is **one user story (task) per agent** — never one layer per agent.

## The rule

- ✅ One agent owns `SP1-T001` end-to-end (its FE, BE, data, tests).
- ❌ One agent does FE for `SP1-T001`, another agent does BE for the same `SP1-T001`.

## Why

Layer-split agents produce contracts that don't match. The FE agent invents a request shape; the BE agent invents a response shape; the two never converge in a single working flow without a rework round. Splitting at the user-story (vertical-slice) level keeps the contract owner inside one head, so the API and the UI agree by construction.

## How to apply

- `/run-tasks` Step 1 builds tiers — each task in a tier is one agent. Never split a task between two agents.
- Sub-agent prompts must scope the agent to a single `[task-id]`. Multi-task agents become coordination problems.
- When a task feels too large to give one agent, the response is to split the **task** (using `/new-sprint` Step 3 vertical-slice rules), not the agent.

## Ties in with

- `.claude/commands/new-sprint.md` Step 3 HARD-GATE — vertical slice check ensures every task can be owned by one agent end-to-end.
- `.claude/commands/run-tasks.md` Step 1.5 — `CODEBASE_MANIFEST` is filtered per agent type, but each agent still owns one whole task.
