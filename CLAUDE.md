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
/discovery → /new-sprint → /fe-design → /be-design → /implement
    → /issue (loop) → /code-review → /testing
    → /retro-task → /git-commit → /next-task (→ repeat per task)
    → /retro-sprint (once ALL tasks in sprint are done)
```

### Commands

| Command | Args | When to use |
|---------|------|-------------|
| `/discovery` | `[disc-id] [name]` | Before planning anything — understand the problem first |
| `/new-sprint` | `[sprint-id] [epic description]` | Turn a discovered epic into a sprint with scaffolded sub-tasks |
| `/fe-design` | `[task-id]` | Write FE design + TDD test plan before touching any code |
| `/be-design` | `[task-id]` | Write BE design + TDD test plan before touching any code |
| `/implement` | `[task-id]` | Write failing tests then implement following FE + BE design docs |
| `/issue` | `[task-id] [description]` | Write failing test → fix → log during implementation |
| `/code-review` | `[task-id]` | Review code against design docs and all ACs |
| `/testing` | `[task-id]` | Run full suite, cross-check every AC has a test |
| `/retro-task` | `[task-id]` | Write retrospective for one task, mark it done |
| `/retro-sprint` | `[sprint-id]` | Aggregate all task retros → sprint retro, evaluate goals |
| `/git-commit` | `[task-id]` | Stage selectively + commit with conventional message |
| `/next-task` | `[task-id]` _(optional)_ | Load next todo task after finishing current one |

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
| `todo` | `/new-sprint` |
| `in-progress` | `/next-task`, `/fe-design`, `/be-design`, `/implement` |
| `blocked` | `/issue` (when impact blocks other tasks) |
| `review` | `/code-review` |
| `testing` | `/testing` |
| `done` | `/retro-task` |

### TDD Rules
- Tests are written **before** implementation code — always.
- Integration tests use **real dependencies** (real DB, real services) — never mocks at the integration layer.
- A bug fix always starts with a **failing test** that reproduces the bug.
- Never skip, `.only`, or comment out a failing test — fix the code instead.

### ID Format
- Sprint: `SP[N]` — e.g. `SP1`, `SP2`, `SP3`
- Task: `SP[N]-T[NNN]` — e.g. `SP1-T001`, `SP2-T003`
  - Task number is **global and never resets** across sprints
  - Sprint 1 might use T001–T004, Sprint 2 continues from T005

### Commit Format
```
[task-id] type: short description (max 72 chars)
```
Types: `feat` `fix` `test` `docs` `refactor` `chore`
Example: `SP2-T003 feat: add user authentication endpoint`

### Branch Format
```
[sprint-id]/[task-id]-[short-description]
```
Example: `SP2/SP2-T003-user-auth`

---

## Docs Structure

```
docs/
├── discovery/
│   └── disc-001-[name].md              ← /discovery output
├── sprints/
│   └── SP1/
│       ├── SP1-overview.md             ← /new-sprint output (epic doc)
│       ├── SP1-retro.md                ← /retro-sprint output
│       ├── SP1-T001/
│       │   ├── SP1-T001-requirement.md ← fill manually after /new-sprint
│       │   ├── SP1-T001-frontend.md    ← /fe-design output
│       │   ├── SP1-T001-backend.md     ← /be-design output
│       │   ├── SP1-T001-issues.md      ← /issue output (auto-created)
│       │   └── SP1-T001-retro.md       ← /retro-task output
│       └── SP1-T002/
│           └── ...
│   └── SP2/
│       ├── SP2-T003/                   ← task number continues from SP1
│       └── ...
├── DISCOVERY-TEMPLATE.md
├── SPRINT-OVERVIEW-TEMPLATE.md
├── REQUIREMENT-TEMPLATE.md
├── FRONTEND-DESIGN-TEMPLATE.md
├── BACKEND-DESIGN-TEMPLATE.md
└── BACKLOG.md
```
