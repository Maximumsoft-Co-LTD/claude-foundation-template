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
/discovery → /new-sprint → /requirement → /fe-design → /be-design
    → /implement → /issue (loop) → /code-review → /testing
    → /retro-task → /git-commit → /retro-sprint
```

**Parallel mode:** `/run-tasks [id] [id] ...` runs Phase 1 (design) then Phase 2 (implement) across multiple tasks simultaneously.

---

## Concepts

- [[../01-concepts/CON-sprint-lifecycle]] — Full lifecycle from discovery to retro
- [[../01-concepts/CON-story-points]] — How to size tasks (1 → 13, 13 = block)
- [[../01-concepts/CON-vertical-slice]] — What makes a valid task
- [[../01-concepts/CON-tdd-rules]] — Test-first discipline
- [[../01-concepts/CON-branch-commit-format]] — Git conventions
- [[../01-concepts/CON-task-id-format]] — Global IDs, never reset
- [[../01-concepts/CON-document-structure]] — Where every file lives

## Command Reference

| Command | Purpose |
|---------|---------|
| `/discovery` | Structured 10-topic exploration before any planning |
| `/new-sprint` | Create sprint, propose + confirm task breakdown |
| `/requirement` | Draft ACs + user stories for one task |
| `/fe-design` | Frontend TDD plan + implementation approach |
| `/be-design` | Backend endpoint spec + TDD plan |
| `/implement` | Write failing tests → implement → green |
| `/issue` | Bug-first: failing test → fix → log |
| `/code-review` | AC coverage check + quality review |
| `/testing` | Full suite run + AC-test cross-check |
| `/retro-task` | Per-task retrospective, mark done |
| `/retro-sprint` | Aggregate retro + extract learnings to CLAUDE.md |
| `/git-commit` | Selective stage + conventional commit |
| `/next-task` | Load next todo task from BACKLOG.md |
| `/run-tasks` | Orchestrate multiple tasks in parallel |
| `/brain-update` | Extract retro learnings → brain (new) |

## Status Lifecycle

```
discovery → backlog → todo → in-progress → review → testing → done
                                    ↕
                                 blocked
```

## Patterns for This Workflow

- [[../03-patterns/PAT-001-tdd-flow]]
- [[../03-patterns/PAT-002-parallel-agent-implementation]]
- [[../03-patterns/PAT-003-discovery-before-sprint]]

## Decisions Related to Workflow

- [[../02-decisions/DEC-003-vertical-slice-tasks]]
- [[../02-decisions/DEC-001-real-deps-integration-tests]]
- [[../02-decisions/DEC-002-posttooluse-lint-hooks]]
