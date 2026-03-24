# Claude Foundation Template

A structured workflow template for software development with Claude Code. Provides sprint management, TDD-first conventions, design documentation standards, and parallel task execution — all driven through Claude slash commands.

## What's Included

| Path | Description |
|------|-------------|
| `CLAUDE.md` | Project instructions loaded by Claude Code on every session (lean — ~50 lines) |
| `.claude/commands/` | Slash command definitions (`/discovery`, `/implement`, etc.) |
| `.claude/commands/_WORKFLOW-REF.md` | Full workflow reference: commands, status lifecycle, story points, TDD rules |
| `docs/templates/` | Skeleton document templates for every workflow stage |
| `docs/BACKLOG.md` | Living backlog, auto-updated by workflow commands |
| `docs/_WORKFLOW.md` | Mermaid flow diagram + quick reference |

## Getting Started

### 1. Clone and configure

```bash
git clone <this-repo> my-project
cd my-project
```

Open `CLAUDE.md` and fill in the four sections:

- **Project Overview** — what the project does
- **Architecture** — main entry points, key abstractions
- **Team Conventions** — branching, PR process, env setup
- **Key Constraints** — runtime versions, compliance requirements

### 2. Start a discovery

```
/discovery disc-001 my-feature
```

Creates `docs/discovery/disc-001-my-feature.md` and asks clarifying questions to define scope before any planning begins.

### 3. Create a sprint

```
/new-sprint SP1 "Build user authentication"
```

Scaffolds tasks in `docs/sprints/SP1/`, assigns story points, and populates `docs/BACKLOG.md`.

### 4. Run tasks

**Single task (sequential):**
```
/requirement SP1-T001
/fe-design SP1-T001
/be-design SP1-T001
/implement SP1-T001
/code-review SP1-T001
/testing SP1-T001
/retro-task SP1-T001
/git-commit SP1-T001
```

**Multiple tasks in parallel:**
```
/run-tasks SP1-T001 SP1-T002 SP1-T003
```

Phase 1 (requirement + design) runs in parallel, pauses for your review, then Phase 2 (implement + review + test + retro) runs in parallel.

## Workflow

```
/discovery → /new-sprint → /requirement → /fe-design → /be-design → /implement
    → /issue (loop) → /code-review → /testing
    → /retro-task → /git-commit → /next-task
    → /retro-sprint (once all tasks done)
```

### All Commands

| Command | Args | Purpose |
|---------|------|---------|
| `/discovery` | `[disc-id] [name]` | Understand problem before planning |
| `/new-sprint` | `[SP[N]] [epic description]` | Create sprint, scaffold tasks |
| `/requirement` | `[task-id]` | Draft ACs + requirement doc |
| `/run-tasks` | `[task-id] [task-id] ...` | Run multiple tasks in parallel |
| `/fe-design` | `[task-id]` | Frontend design + TDD test plan |
| `/be-design` | `[task-id]` | Backend design + TDD test plan |
| `/implement` | `[task-id]` | Write failing tests → implement |
| `/issue` | `[task-id] [desc]` | TDD bug fix + log |
| `/code-review` | `[task-id]` | Review code against design + ACs |
| `/testing` | `[task-id]` | Full suite + AC coverage check |
| `/retro-task` | `[task-id]` | Write retro, mark task done |
| `/retro-sprint` | `[sprint-id]` | Sprint retro (after all tasks done) |
| `/git-commit` | `[task-id]` | Stage selectively + commit |
| `/next-task` | `[task-id]?` | Load next todo task |

## ID & Commit Conventions

```
Sprint:  SP1, SP2, SP3 ...
Task:    SP1-T001, SP1-T002 ... (global, never resets across sprints)
Branch:  SP1/SP1-T001-short-description
Commit:  SP1-T001 feat: short description (max 72 chars)
```

Commit types: `feat` `fix` `test` `docs` `refactor` `chore`

## Story Points & Doc Depth

Points follow Fibonacci scale (1–8). They control documentation depth — not velocity estimates.

| Points | Size | Docs required |
|--------|------|---------------|
| 1 | Trivial | Problem + ACs + approach |
| 2 | Small | + User stories + test data |
| 3 | Medium-small | + Full requirement + core design sections |
| 5 | Medium | + System-level design, analytics |
| 8 | Large | + ADRs, perf benchmarks, a11y, full rigor |
| 13 | Too big | Block — break it down first |

Full section requirements per point level: `.claude/commands/_WORKFLOW-REF.md`

## TDD Rules

- Tests are written **before** implementation — always.
- Integration tests use **real dependencies** — never mocks at the integration layer.
- A bug fix always starts with a **failing test** that reproduces the bug.
- Never skip, `.only`, or comment out a failing test.

## Docs Structure

```
docs/
├── discovery/
│   └── disc-001-[name].md
├── sprints/
│   └── SP1/
│       ├── SP1-overview.md
│       ├── SP1-retro.md
│       └── SP1-T001/
│           ├── SP1-T001-requirement.md
│           ├── SP1-T001-frontend.md
│           ├── SP1-T001-backend.md
│           ├── SP1-T001-issues.md
│           └── SP1-T001-retro.md
├── templates/
└── BACKLOG.md
```

## Task Status Lifecycle

```
discovery → backlog → todo → in-progress → review → testing → done
                                   ↕
                                blocked
```

## License

MIT
