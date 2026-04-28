---
type: MOC
topic: workflow
tags: [sprint, commands, lifecycle, tdd]
updated: 2026-03-25
---

# 🗺️ MOC — Workflow

> Map of all knowledge related to the sprint workflow, commands, and development lifecycle.

---

## Core Flow

```
/discovery → /new-sprint → /requirement (unified: story + FE design + BE design + Implementation Plan + tests)
    → /implement → /issue (loop) → /code-review → /testing
    → /retro-task → /git-commit → /next-task (loop per task) → /retro-sprint
```

**Parallel mode:** `/run-tasks [id] [id] ...` (Agent tool) or `/run-tasks-p [id] [id] ...` (headless `claude -p`) runs the full per-task pipeline across multiple tasks simultaneously, one agent per vertical-slice story.

---

## Concepts

### Sprint mechanics
- [[../01-concepts/CON-sprint-lifecycle]] — Full lifecycle from discovery to retro
- [[../01-concepts/CON-story-points]] — How to size tasks (1 → 13, 13 = block)
- [[../01-concepts/CON-vertical-slice]] — What makes a valid task
- [[../01-concepts/CON-tdd-rules]] — Test-first discipline
- [[../01-concepts/CON-branch-commit-format]] — Git conventions
- [[../01-concepts/CON-task-id-format]] — Global IDs, never reset
- [[../01-concepts/CON-document-structure]] — Where every file lives

### Quality gates (three-gate model)
- [[../01-concepts/CON-confidence-gate]] — **Before** acting: ≥90% confidence required
- [[../01-concepts/CON-self-check-rule]] — **After** writing: re-read every file
- [[../01-concepts/CON-verification-before-completion]] — **End of task**: evidence required, no claims without test output

### Subagent-driven execution
- [[../01-concepts/CON-bite-sized-tasks]] — 2–5 min subtask granularity (the contract subagents execute)
- [[../01-concepts/CON-two-stage-review]] — Spec compliance separate from code quality

### Brain & knowledge
- [[../01-concepts/CON-brain-access-protocol]] — Navigate via MOC; do NOT read full brain

### Claude Code platform primitives
- [[../01-concepts/CON-claude-code-skills]] — Skill primitive
- [[../01-concepts/CON-claude-code-hooks]] — Lifecycle hooks
- [[../01-concepts/CON-mcp-integration]] — MCP servers (context7, claude-in-chrome)

## Command Reference

| Command | Purpose |
|---------|---------|
| `/discovery` | Structured 10-topic exploration before any planning |
| `/brainstorm` | Open-ended ideation (superpowers bridge — alt to `/discovery`) |
| `/new-sprint` | Create sprint, propose + confirm task breakdown |
| `/requirement` | Unified per-task doc: story + FE design + BE design + Implementation Plan + tests |
| `/write-plan` | Bite-sized implementation plan (superpowers bridge) |
| `/implement` | Write failing tests → implement → green |
| `/execute-plan` | Run plan via subagents with worktree isolation (superpowers bridge) |
| `/issue` | Bug-first: failing test → fix → log |
| `/code-review` | AC coverage check + quality review |
| `/testing` | Full suite run + AC-test cross-check |
| `/retro-task` | Per-task retrospective, mark done, capture brain entries |
| `/retro-sprint` | Aggregate retro + consolidate sprint-level brain entries |
| `/git-commit` | Selective stage + conventional commit |
| `/next-task` | Load next todo task from BACKLOG.md |
| `/run-tasks` | Orchestrate multiple tasks in parallel (Agent tool) |
| `/run-tasks-p` | Orchestrate multiple tasks in parallel (headless `claude -p`) |

## Superpowers Integration

Template commands always take priority. Superpowers skills enhance specific steps without overriding sprint-aware behavior.

| Bridge Command | Skill | When |
|----------------|-------|------|
| `/brainstorm` | `superpowers:brainstorming` | Open-ended design exploration before sprint |
| `/write-plan` | `superpowers:writing-plans` | Detailed step plan after `/requirement` |
| `/execute-plan` | `superpowers:subagent-driven-development` | Plan execution with worktree isolation |

See [[../03-patterns/PAT-004-superpowers-workflow-integration]] for the full integration pattern, file path overrides, and graceful degradation behavior.

## Status Lifecycle

```
discovery → backlog → todo → in-progress → review → testing → done
                                    ↕
                                 blocked
```

## Patterns for This Workflow

- [[../03-patterns/PAT-001-tdd-flow]] — Red → Green → Refactor
- [[../03-patterns/PAT-002-parallel-agent-implementation]] — FE+BE precursor pattern
- [[../03-patterns/PAT-003-discovery-before-sprint]] — Discover first, plan second
- [[../03-patterns/PAT-004-superpowers-workflow-integration]] — Superpowers layered under template
- [[../03-patterns/PAT-005-subagent-driven-development]] — 3-agent pipeline (implementer → spec → quality)
- [[../03-patterns/PAT-006-worktree-isolation]] — Git worktrees per agent
- [[../03-patterns/PAT-007-headless-parallel-agents]] — `claude -p` subprocess transport

## Decisions Related to Workflow

- [[../02-decisions/DEC-003-vertical-slice-tasks]]
- [[../02-decisions/DEC-001-real-deps-integration-tests]]
- [[../02-decisions/DEC-002-posttooluse-lint-hooks]]
