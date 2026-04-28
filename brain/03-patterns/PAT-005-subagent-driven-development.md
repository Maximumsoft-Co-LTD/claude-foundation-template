---
type: pattern
id: PAT-005
category: workflow
tags: [subagent, claude-code, parallel, code-review, pipeline]
related: [CON-bite-sized-tasks, CON-two-stage-review, CON-verification-before-completion, PAT-006-worktree-isolation]
updated: 2026-04-29
source: template
---

# PAT-005 — Subagent-Driven Development (3-Agent Pipeline)

## Problem

Single-agent implementation tends to:
- Skip TDD when "tests are obvious"
- Inflate confidence ("this looks right")
- Mix spec compliance and code quality concerns
- Lose context across long tasks

A human reviewer fixes this — but humans don't scale to N parallel tasks. We need a **mechanical** review pipeline that produces audit trails.

## Solution

Per task, dispatch **three sequential subagents** with focused roles:

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Implementer │ → │  Spec Reviewer   │ → │  Quality Reviewer│
│  (TDD only)  │    │  (AC compliance) │    │  (code quality)  │
└──────────────┘    └──────────────────┘    └──────────────────┘
       │                    │                       │
       ▼                    ▼                       ▼
  worktree +          re-read diff,          re-read diff,
  bite-sized plan     check ACs only         check quality only
```

Each agent has:
- **Fresh context** (no leaked state from previous tasks)
- **Scoped tools** (implementer can write; reviewers read-only)
- **One job** (focused prompt, no role mixing)

On reviewer failure → loop back to implementer with the finding. On pass → next stage.

## Used by

- `/run-tasks` Phase 2 (Agent tool — output visible to parent)
- `/run-tasks-p` Phase 2 (`claude -p` subprocess — leaner parent context)
- `/execute-plan` (single-task version of the pipeline)
- `superpowers:subagent-driven-development` (the underlying skill, when installed)

## Why three agents, not one or two?

| Configuration | Failure mode |
|---------------|--------------|
| 1 agent (all-in-one) | Skips TDD, conflates concerns, no audit trail |
| 2 agents (impl + review) | Reviewer mixes spec and quality concerns |
| **3 agents (impl + spec + quality)** | Each agent has one focus; clean handoffs |
| 4+ agents | Coordination overhead exceeds the value |

The 3-agent split maps directly to [[CON-two-stage-review]]: spec compliance and code quality are different cognitive modes, and the implementer is yet a third mode.

## Agent roles in detail

### Implementer
- **Tools:** Write, Edit, Read, Bash (test runner), Grep, Glob
- **Input:** Bite-sized Implementation Plan (from `/requirement` or `/write-plan`)
- **Job:** Walk plan top-to-bottom; per checkbox: write failing test, watch RED, implement, watch GREEN, mark checkbox.
- **Output:** Diff + test output + which checkboxes are done.

### Spec Reviewer
- **Tools:** Read, Grep, Glob (no Write/Edit)
- **Input:** Diff + requirement doc
- **Job:** Map every AC → at least one test that exercises it. Flag gaps.
- **Output:** Pass / Fail (with AC gap list).

### Quality Reviewer
- **Tools:** Read, Grep, Glob
- **Input:** Diff (only the changed files)
- **Job:** Check naming, structure, edge cases, security, performance, maintainability.
- **Output:** Pass / Fail (with severity-tagged findings: blocker / major / minor / nit).

## Loop-back behavior

```
spec_review.failed → implementer (with gap list as new instructions)
quality_review.failed (blocker/major) → implementer (with findings)
quality_review.failed (minor/nit only) → record in retro, do not loop
```

Max 3 implementer loops per task. If still failing after 3, escalate to human — the task is mis-scoped.

## Why subagents over a single threaded agent?

**Context isolation.** A subagent works in its own context window, then reports a compressed summary. The parent context stays clean. Critical when running multiple tasks in parallel.

**Scoped tools = safety.** A reviewer cannot accidentally modify code. A documentation agent cannot run shell commands. Tool restrictions encode the role.

**Parallelism.** Multiple tasks can run in parallel because each has its own subagent tree. Wall-clock time → linear in slowest task, not sum of tasks.

**Reproducibility.** A subagent prompt is a contract. Same input → similar output. Single-agent flows drift more.

## When NOT to use

- Trivial tasks (1 pt) — pipeline overhead exceeds value
- Tasks requiring back-and-forth with the user — subagents shouldn't ask the user mid-task
- Exploratory / discovery work — `/discovery` and `/brainstorm` are interactive by design

## Concrete example

```
/run-tasks SP2-T042 SP2-T043 SP2-T044

Phase 1 (parallel):
  /requirement runs for each task → 3 unified docs ready
  ⏸ User reviews all 3 plans, confirms

Phase 2 (per task, parallel across tasks):
  SP2-T042:
    Implementer agent → diff_42, all tests green
    Spec Reviewer agent → 1 AC gap (auth header check missing)
    Implementer agent (loop 2) → fix added, all tests green
    Spec Reviewer agent → pass
    Quality Reviewer agent → 1 minor (variable name) → record, no loop
    DONE

  SP2-T043: similar 3-agent pipeline running in parallel
  SP2-T044: similar 3-agent pipeline running in parallel
```

## Trade-offs

| Pro | Con |
|-----|-----|
| Audit trail per agent | Higher token cost than single-agent |
| Catches issues before human review | Pipeline orchestration adds complexity |
| Parallel-safe | Loop-backs increase wall-clock for hard tasks |
| Reproducible | Subagent prompts must be carefully written |

In practice, the parallelism speedup more than offsets the per-task token overhead for sprints with ≥3 tasks.

## Related

- [[CON-bite-sized-tasks]] — granularity that makes implementer agents reliable
- [[CON-two-stage-review]] — why spec and quality are separate stages
- [[CON-verification-before-completion]] — evidence required at the end of each agent's run
- [[PAT-006-worktree-isolation]] — how parallel agents avoid conflicts
- [[PAT-007-headless-parallel-agents]] — same pipeline via `claude -p` subprocesses
- [[PAT-002-parallel-agent-implementation]] — the FE+BE precursor pattern (now superseded by 3-agent pipeline for full-stack tasks)
