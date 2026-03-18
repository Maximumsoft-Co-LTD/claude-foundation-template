# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

<!-- TODO: Describe what this project does and its primary purpose. -->

## Development Commands

<!-- TODO: Fill in once tooling is set up. -->

```bash
# Install dependencies
# npm install / yarn / pnpm install

# Start dev server
# npm run dev

# Build
# npm run build

# Run all tests
# npm test

# Run a single test file
# npm test -- path/to/test.file

# Lint
# npm run lint

# Type check
# npm run typecheck
```

## Architecture

<!-- TODO: Main entry points, data flow, key abstractions, non-obvious design decisions. -->

## Team Conventions

<!-- TODO: Branching strategy, PR process, commit format, migration workflow, env setup. -->

## Key Constraints

<!-- TODO: Runtime version, browser support, performance budgets, compliance requirements. -->

---

## Workflow

Two levels: **Sprint (Epic)** → **Tasks (Sub-tasks)**

```
/discovery → /new-sprint → /plan-task → /fe-design → /be-design
    → implement → /issue (loop) → /code-review → /testing
    → /retro-task → /git-commit → /next-task (→ repeat per task)
    → /retro-sprint (once ALL tasks in sprint are done)
```

### Commands

| Command | Args | When to use |
|---------|------|-------------|
| `/discovery` | `[disc-id] [name]` | Before planning anything — understand the problem first |
| `/new-sprint` | `[sprint-id] [epic description]` | Turn a discovered epic into a sprint with scaffolded sub-tasks |
| `/plan-task` | `[sprint-id] [task-id] [task-name]` | Add a task to an existing sprint that wasn't in the original breakdown |
| `/fe-design` | `[sprint-id] [task-id]` | Write FE design + TDD test plan before touching any code |
| `/be-design` | `[sprint-id] [task-id]` | Write BE design + TDD test plan before touching any code |
| `/issue` | `[sprint-id] [task-id] [description]` | Write failing test → fix → log during implementation |
| `/code-review` | `[sprint-id] [task-id]` | Review code against design docs and all ACs |
| `/testing` | `[sprint-id] [task-id]` | Run full suite, cross-check every AC has a test |
| `/retro-task` | `[sprint-id] [task-id]` | Write retrospective for one task, mark it done |
| `/retro-sprint` | `[sprint-id]` | Aggregate all task retros → sprint retro, evaluate goals |
| `/git-commit` | `[sprint-id] [task-id]` | Stage selectively + commit with conventional message |
| `/next-task` | `[sprint-id] [task-id]` _(optional)_ | Load next todo task after finishing current one |

### Status Lifecycle

```
discovery → backlog → todo → in-progress → review → testing → done
                                  ↕
                               blocked
```

| Status | Set by |
|--------|--------|
| `discovery` | `/discovery` |
| `backlog` | `/discovery` (when open questions resolved) |
| `todo` | `/new-sprint`, `/plan-task` |
| `in-progress` | `/next-task`, `/fe-design`, `/be-design` |
| `blocked` | `/issue` (when impact blocks other tasks) |
| `review` | `/code-review` |
| `testing` | `/testing` |
| `done` | `/retro-task` |

### TDD Rules
- Tests are written **before** implementation code — always.
- Integration tests use **real dependencies** (real DB, real services) — never mocks at the integration layer.
- A bug fix always starts with a **failing test** that reproduces the bug.
- Never skip, `.only`, or comment out a failing test — fix the code instead.

### Commit Format
```
[task-id] type: short description (max 72 chars)
```
Types: `feat` `fix` `test` `docs` `refactor` `chore`
Example: `task-002 feat: add user authentication endpoint`

### Branch Format
```
[sprint-id]/[task-id]-[short-description]
```
Example: `sprint-01/task-002-user-auth`

---

## Docs Structure

```
docs/
├── discovery/
│   └── disc-001-[name].md              ← /discovery output
├── sprints/
│   └── sprint-01/
│       ├── sprint-01-overview.md       ← /new-sprint output (epic doc)
│       ├── sprint-01-retro.md          ← /retro-sprint output
│       ├── task-001/
│       │   ├── task-001-requirement.md ← fill manually after /plan-task or /new-sprint
│       │   ├── task-001-frontend.md    ← /fe-design output
│       │   ├── task-001-backend.md     ← /be-design output
│       │   ├── task-001-issues.md      ← /issue output (auto-created)
│       │   └── task-001-retro.md       ← /retro-task output
│       └── task-002/
│           └── ...
├── DISCOVERY-TEMPLATE.md
├── SPRINT-OVERVIEW-TEMPLATE.md
├── REQUIREMENT-TEMPLATE.md
├── FRONTEND-DESIGN-TEMPLATE.md
├── BACKEND-DESIGN-TEMPLATE.md
└── BACKLOG.md
```
