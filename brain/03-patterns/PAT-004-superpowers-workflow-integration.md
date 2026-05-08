---
type: pattern
id: PAT-004
category: workflow
tags: [superpowers, skills, workflow, brainstorm, write-plan, execute-plan]
related: [CON-sprint-lifecycle, PAT-003-discovery-before-sprint]
updated: 2026-04-03
---

# PAT-004 — Superpowers Skills Workflow Integration

## Problem

The template workflow has well-defined commands, but certain steps benefit from richer skill capabilities (generative brainstorming, bite-sized planning, subagent execution). Without a clear integration pattern, teams either skip these capabilities or let skill orchestrators override template commands incorrectly.

## Solution

Layer superpowers skills **below** template commands using three bridge commands and advisory integration points inside core commands.

### Priority Hierarchy

```
1. Template slash commands  (/discovery, /implement, etc.)   ← always win
2. Bridge commands          (/brainstorm, /write-plan, /execute-plan)
3. Direct skill invocations (superpowers:brainstorming)       ← explicit only
```

Never let the `using-superpowers` orchestrator intercept a template command. It applies only to freeform messages.

### Bridge Commands

| Bridge Command | Superpowers Skill(s) | Position in Workflow |
|----------------|----------------------|----------------------|
| `/brainstorm` | `superpowers:brainstorming` | Alternative to `/discovery` — open-ended ideation |
| `/write-plan` | `superpowers:writing-plans` | After `/requirement`, before `/execute-plan` or `/implement` |
| `/execute-plan` | `superpowers:subagent-driven-development` + `superpowers:using-git-worktrees` | After `/write-plan`, replaces `/implement` |

### Inline Integration Points (inside template commands)

| Command | Step | Superpowers Skill |
|---------|------|-------------------|
| `/implement` | Step 0b | `using-git-worktrees` — safe worktree isolation |
| `/implement` | Step 4 | `verification-before-completion` — evidence gate |
| `/code-review` | Step 2 | `requesting-code-review` + `receiving-code-review` |
| `/git-commit` | Step 8 | `finishing-a-development-branch` |
| `.claude/skills/debug/` | All steps | `systematic-debugging` — 4-phase root cause |

### File Path Overrides

When invoking superpowers from a template command, always redirect the default save path:

| Superpowers Default | Template Path |
|---------------------|---------------|
| `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` | `docs/discovery/[disc-id]-[name].md` |
| `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md` | `docs/sprints/[sprint-id]/[task-id]/[task-id]-plan.md` |

## When to Use

- Use `/brainstorm` when starting a new feature that needs open-ended exploration before the sprint
- Use `/write-plan` when a task has complex implementation steps that benefit from a detailed bite-sized plan
- Use `/execute-plan` to run the plan via subagents with full worktree isolation

## When NOT to Use

- Do NOT invoke `superpowers:brainstorming` directly inside `/discovery` — use the bridge command `/brainstorm` instead
- Do NOT let superpowers override `/implement` when it is already running
- Do NOT hard-fail if superpowers is not installed — all template commands have inline fallback steps

## Concrete Example

```
# Feature with open-ended requirements
/brainstorm "payment flow redesign"
  → Skill("superpowers:brainstorming") runs
  → Output saved to docs/discovery/disc-007-payment-flow.md

# After /requirement completes
/write-plan SP2-T042
  → Skill("superpowers:writing-plans") runs with task context injected
  → Output saved to docs/sprints/SP2/SP2-T042/SP2-T042-plan.md

# Execution
/execute-plan SP2-T042
  → Worktree created, subagents execute plan steps
  → Full test suite run, ACs verified
```

## Related

- [[../01-concepts/CON-sprint-lifecycle]] — full workflow context
- [[PAT-003-discovery-before-sprint]] — discovery first principle
- [[../00-MOC/MOC-Workflow]] — command reference
