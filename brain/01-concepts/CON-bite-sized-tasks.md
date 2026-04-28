---
type: concept
tags: [workflow, planning, claude-code, implementation-plan]
related: [CON-vertical-slice, CON-story-points, PAT-005-subagent-driven-development]
updated: 2026-04-29
source: template
---

# Bite-Sized Tasks

## Core idea

Every Implementation Plan **subtask checkbox** = a single action that takes **2–5 minutes**. Not "implement the auth module" (too big). Not "rename `x` to `y`" (too small if it's just one file). The right unit is one focused action with a clear, verifiable outcome.

This is the granularity at which `/write-plan` and the superpowers `writing-plans` skill operate, and it's what makes subagent-driven execution reliable.

## Why this granularity?

| Too big (>15 min) | Bite-sized (2–5 min) | Too small (<1 min) |
|-------------------|----------------------|---------------------|
| Subagent loses focus mid-task | Subagent completes cleanly, reports back | Overhead exceeds value |
| Hard to verify | Easy to write a check for | Plan becomes noise |
| Failures cascade | Failures isolated | Reviewer fatigues |
| "Done" is fuzzy | "Done" is binary | Plan unreadable |

The 2–5 minute window is empirically where:
- A subagent's working memory holds the full context without compression
- One unit of progress = one verifiable signal
- A human can review the plan in one read

## What a bite-sized subtask looks like

Good:
- `- [ ] Add NOT NULL constraint to users.email column in migration 0042`
- `- [ ] Write failing test: GET /api/users returns 401 when no auth header`
- `- [ ] Extract password validation into validatePassword() in auth/utils.ts`

Bad — too big:
- `- [ ] Implement user authentication`
- `- [ ] Add backend for the new feature`

Bad — too small:
- `- [ ] Add semicolon on line 47`
- `- [ ] Rename variable to camelCase`

## The verifiability test

A subtask is bite-sized if you can answer YES to all three:

1. **Atomic** — does it do exactly one thing?
2. **Verifiable** — is "done" a binary check (test passes / file exists / endpoint returns X)?
3. **Estimable** — can a human guess "2 minutes" or "5 minutes" without more info?

If any answer is NO → split or merge.

## How it interacts with story points

Story points size the **whole task** (the user story). Bite-sized subtasks are the **steps inside** the Implementation Plan.

| Story points | Approx. # of bite-sized subtasks |
|--------------|----------------------------------|
| 1 pt | 1–3 |
| 2 pt | 3–6 |
| 3 pt | 6–12 |
| 5 pt | 12–25 |
| 8 pt | 25–50 |

Above ~50 subtasks → the task is probably 13 pts (too big) → split it before planning.

## Why subagents need this

A subagent reading a 12-step plan can execute confidently because each step is small enough that the next step is obvious from the previous step's output. A subagent reading "Implement auth" must invent the plan itself, which causes drift, scope creep, and inconsistent decisions across parallel agents.

Bite-sized = **specification**, not aspiration. The plan is the contract; the subagent's job is execution.

## Related

- `superpowers:writing-plans` skill (when superpowers installed)
- `/write-plan` — bridge command
- `/requirement` Step 2 — Implementation Plan section
- [[PAT-005-subagent-driven-development]] — why this granularity matters for parallel execution
