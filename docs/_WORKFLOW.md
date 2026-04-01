<!-- This file is a Mermaid-based visual flow reference. For the text-based one-page cheat sheet used daily, see docs/WORKFLOW-QUICKREF.md. For command definitions, see .claude/commands/. -->

# Workflow Reference

## Full Flow (single task)

```mermaid
flowchart TD
    A([/discovery]) --> B([/new-sprint\nscaffold tasks\nSP-N-T-NNN global IDs])

    B --> C

    subgraph TASK ["↻ repeat per task"]
        C([/next-task\nreconcile statuses\npick next todo]) --> R([/requirement\ndraft ACs +\nrequirement doc])
        R --> D([/design fe\nFE design + TDD plan])
        R --> E([/design be\nBE design + TDD plan])
        D --> F
        E --> F
        F([/implement\nwrite failing tests\nthen implement]) -->|bugs found| G([/issue\nTDD fix + log])
        G -->|more bugs| G
        G --> H
        F -->|no bugs| H
        H([/code-review\nreview code\nupdate requirement.md ✓/✗]) -->|critical issues| G
        H -->|approved| I([/testing\nfull suite\nAC coverage check])
        I -->|failing| G
        I -->|all pass| J([/retro-task\nwrite retro\nmark done])
        J --> K([/git-commit\nstage + commit])
        K -->|more tasks| C
    end

    K -->|all tasks done| L([/retro-sprint\naggregate retros\nevaluate goals\nupdate brain ✦])
```

> **Design layer skipping:** FE-only tasks → run only `/design fe`. BE-only tasks → run only `/design be`. Infra/docs tasks → skip `/design` entirely.

## Parallel Flow (multiple tasks)

Use `/run-tasks [task-id] [task-id] ...` instead of the single-task loop above when running multiple tasks in the same sprint simultaneously. Agents are spawned per task and coordinated via `docs/sprints/[sprint-id]/cross-task-context.md`.

## ID Format

| Type | Format | Example |
|------|--------|---------|
| Sprint | `SP[N]` | `SP1`, `SP2` |
| Task | `SP[N]-T[NNN]` (global, never resets) | `SP1-T001`, `SP2-T003` |
| Branch | `SP[N]/SP[N]-T[NNN]-short-desc` | `SP1/SP1-T002-user-auth` |
| Commit | `SP[N]-T[NNN] type: description` | `SP2-T003 feat: add auth` |

## Status Lifecycle

```
discovery → backlog → todo → in-progress → review → testing → done
                                    ↕
                                 blocked
```

| Status | Set by |
|--------|--------|
| `discovery` | `/discovery` |
| `backlog` | `/discovery` (when open questions resolved) |
| `todo` | `/new-sprint` |
| `in-progress` | `/requirement`, `/next-task`, `/design fe`, `/design be`, `/implement` |
| `blocked` | `/issue` (when blocking other tasks) |
| `review` | `/code-review` |
| `testing` | `/testing` |
| `done` | `/retro-task` |

## Commands Quick Reference

| Command | Args | Purpose |
|---------|------|---------|
| `/discovery` | `[disc-id] [name]` | Understand problem before planning |
| `/new-sprint` | `[SP[N]] [epic description]` | Create sprint, scaffold all tasks |
| `/requirement` | `[task-id]` | Draft ACs + requirement doc before design |
| `/run-tasks` | `[task-id] [task-id] ...` | Run multiple tasks in parallel |
| `/design fe` | `[task-id]` | FE design + TDD test plan |
| `/design be` | `[task-id]` | BE design + TDD test plan |
| `/implement` | `[task-id]` | Write failing tests → implement |
| `/issue` | `[task-id] [desc]` | TDD fix + log bug (optional — only when bugs found) |
| `/code-review` | `[task-id]` | Review code + update requirement.md ACs |
| `/testing` | `[task-id]` | Full suite + AC coverage check |
| `/retro-task` | `[task-id]` | Write retro, mark task done |
| `/git-commit` | `[task-id]` | Stage selectively + commit |
| `/next-task` | `[task-id]?` | Reconcile statuses → load next task |
| `/retro-sprint` | `[sprint-id]` | Sprint retro + brain update (after ALL tasks done) |
| `/status` | — | Read-only sprint progress snapshot |
| `/debug` | `[task-id] [desc]` | Systematic 4-phase root cause investigation |
