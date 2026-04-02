# Workflow Reference

## Full Flow

**Single task (sequential):**
```
/discovery → /new-sprint → /requirement → /design fe → /design be → /implement
    → /issue (loop) → /code-review → /testing
    → /retro-task → /git-commit → /next-task (→ repeat per task)
    → /retro-sprint (once ALL tasks in sprint are done — includes brain update)
```

**Multiple tasks in parallel (subagent-driven):**
```
/discovery → /new-sprint → /run-tasks [task-id] [task-id] ...
    Phase 1: requirement + design fe + design be (parallel) → ⏸ user reviews all plans
    Phase 2: per task 3-agent pipeline:
        Implementer agent → Spec Reviewer agent → Quality Reviewer agent
        (loops back on failure, proceeds on pass)
    → /git-commit (per task, with branch finish options)
    → /retro-sprint (includes brain update)
```

**Multiple tasks in parallel (headless / token-efficient):**
```
/discovery → /new-sprint → /run-tasks-p [task-id] [task-id] ...
    Same Phase 1 + Phase 2 structure as /run-tasks, but uses claude -p subprocesses
    instead of Agent tool — outputs go to .claude/rtp/[run-id]/ logs, not parent context.
    → /git-commit (per task) → /retro-sprint
```
Use `/run-tasks-p` when running many tasks and parent context size is a concern.

## Commands

| Command | Args | When to use |
|---------|------|-------------|
| `/discovery` | `[disc-id] [name]` | Before planning anything — understand the problem first |
| `/new-sprint` | `[sprint-id] [epic description]` | Turn a discovered epic into a sprint with scaffolded sub-tasks |
| `/requirement` | `[task-id]` | Draft ACs + requirement doc for a task before design begins |
| `/design` | `[fe\|be] [task-id]` | Write FE or BE design + implementation plan + TDD test plan before touching any code |
| `/implement` | `[task-id]` | Write failing tests then implement following FE + BE design docs |
| `/issue` | `[task-id] [description]` | Write failing test → fix → log during implementation |
| `/code-review` | `[task-id]` | Two-stage review: spec compliance → code quality |
| `/testing` | `[task-id]` | Run full suite, cross-check every AC has a test |
| `/retro-task` | `[task-id]` | Write retrospective for one task, mark it done |
| `/git-commit` | `[task-id]` | Stage, commit, then choose: merge / PR / keep / discard |
| `/next-task` | `[task-id]` _(optional)_ | Load next todo task; auto-reconcile stale BACKLOG statuses; show task context card |
| `/retro-sprint` | `[sprint-id]` | Aggregate all task retros → sprint retro, evaluate goals + extract brain knowledge |
| `/debug` | `[description]` | 4-phase systematic debugging — for standalone incidents outside sprint context |
| `/run-tasks` | `[task-id] [task-id] ...` | Run multiple tasks in parallel through the full flow (Agent tool) |
| `/run-tasks-p` | `[task-id] [task-id] ...` | Same as `/run-tasks` but uses `claude -p` subprocesses — leaner parent context |
| `/brainstorm` | `[disc-id] [name]` | Conversational discovery via superpowers:brainstorming — alternative to `/discovery` |
| `/write-plan` | `[task-id]` | Detailed bite-sized implementation plan via superpowers:writing-plans — after `/design be` |
| `/execute-plan` | `[task-id]` | Subagent-driven plan execution via superpowers:subagent-driven-development — after `/write-plan` |

## /issue vs /debug — Which to use?

| Situation | Command |
|-----------|---------|
| Bug found during active implementation — you know what broke | `/issue [task-id] [desc]` |
| Critical issue found after code-review — specific failing check | `/issue [task-id] [desc]` |
| Unknown root cause — symptom without clear origin | `/debug [task-id] [desc]` |
| Flaky test, intermittent failure, unexpected regression | `/debug [task-id] [desc]` |
| Production incident — no sprint context | `/debug [desc]` (no task-id) |

**Rule:** `/issue` is fix-first (calls `/debug` Phases 1–3 internally). `/debug` is investigation-first for unknown/complex causes. When in doubt: if you can name the likely root cause, use `/issue`. If you're guessing, use `/debug` first.

---

## Skills (optional, insert where needed)

### Quality & Review
| Skill | Args | Insert after |
|-------|------|--------------|
| `/db-schema-review` | `[task-id]` | `/design be` — review schema design before writing any code |
| `/security-review` | `[task-id]` | `/implement` — secrets, injection, insecure defaults, dep risk |
| `/accessibility-review` | `[task-id]` | `/testing` — WCAG 2.1 AA audit for FE tasks |
| `/test-coverage` | `[task-id]` | `/testing` — coverage gaps mapped to ACs, missing test list |
| `/adr` | `[task-id] [title]` | during `/design fe` or `/design be` — record a non-trivial decision |

### Development Workflow
| Skill | Args | Insert after |
|-------|------|--------------|
| `/refactor` | `[task-id] [type] [target]` | after `/retro-task` (tech debt) — safe, test-first restructuring |

### Maintenance
| Skill | Args | Insert after |
|-------|------|--------------|
| `/dependency-update` | `[scope]` | pre-sprint — audit + safe upgrade plan for all deps |
| `/env-setup` | `[component?]` | project clone — bootstrap dev environment from scratch |

### Delivery
| Skill | Args | Insert after |
|-------|------|--------------|
| `/pr-create` | `[task-id]` | `/git-commit` — push branch + open PR with pre-filled body |
| `/changelog` | `[sprint-id] [version]` | `/retro-sprint` — user-facing release notes from commits + retros |

### Session Management
| Skill | Args | Insert after |
|-------|------|--------------|
| `/session-handoff` | `[task-id]` | end of any mid-task session — serialize context for resumption |

### Superpowers Skills (requires [obra/superpowers](https://github.com/obra/superpowers) plugin)

Invoked via `Skill("superpowers:<name>")`. Template commands take priority — these provide richer behavior at specific integration points. See `.claude/rules/superpowers.md` for priority and path override rules.

| Superpowers Skill | Used by | Purpose |
|---|---|---|
| `using-superpowers` | Auto-loaded at session start | Skill-check-before-action orchestrator |
| `brainstorming` | `/brainstorm` (alt to `/discovery`) | Conversational design exploration, visual companion |
| `writing-plans` | `/write-plan` | Detailed bite-sized implementation plans |
| `executing-plans` | `/execute-plan` (fallback) | Plan execution with review checkpoints |
| `subagent-driven-development` | `/execute-plan`, `/run-tasks` Phase 2 | Fresh subagent per task + two-stage review |
| `dispatching-parallel-agents` | invoked inside `subagent-driven-development` | Parallel independent task dispatch |
| `test-driven-development` | invoked inside `subagent-driven-development` | TDD iron law with rationalization prevention |
| `systematic-debugging` | `.claude/skills/debug/SKILL.md` | 4-phase root cause investigation |
| `verification-before-completion` | `/implement` Step 4 | Evidence-before-claims gate |
| `requesting-code-review` | `/code-review` Step 2a | Subagent spec compliance review dispatch |
| `receiving-code-review` | `/code-review` Step 3c | Technical evaluation of review feedback |
| `using-git-worktrees` | `/implement` Step 0b, `/execute-plan` Step 2 | Isolated workspace setup with safety checks |
| `finishing-a-development-branch` | `/git-commit` Step 8 | Branch completion with 4 structured options |
| `writing-skills` | Meta | Creating new SKILL.md files for this template |

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
| `in-progress` | `/requirement`, `/next-task`, `/design`, `/implement` |
| `blocked` | `/issue` (when impact blocks other tasks) |
| `review` | `/code-review` |
| `testing` | `/testing` |
| `done` | `/retro-task` |

## Story Points Scale

| Points | Size | Rule |
|--------|------|------|
| **1** | Trivial | Minimal docs — what changes + ACs + brief approach |
| **2** | Small | Core docs — ACs + user stories + approach + basic tests |
| **3** | Medium-small | Standard docs — full requirement + core design sections |
| **5** | Medium | Extended docs — most sections, system-level design |
| **8** | Large | All sections + full rigor (ADRs, perf benchmarks, analytics, a11y) |
| **13** | Too big | ⛔ Block — break into smaller tasks before proceeding |

## Required Sections by Points

| Doc | 1pt | 2pt | 3pt | 5pt | 8pt |
|-----|-----|-----|-----|-----|-----|
| **Requirement** | Problem + ACs + Out of Scope | + User Stories + Dependencies + Test Data + Rollout Strategy | + Feature Flow + System Behavior + Business Rules + Metrics | + Design References + Analytics + UI Copy + DO/DON'T | + NFR + Open Questions |
| **Design (fe)** | Approach + Existing Code Context + Component list + TDD (min. 1 test/AC) | + Env/Config Deps + Component Breakdown + API Contracts + State & Data Flow + Fail State table | + UI/UX Overview + Loading States + Impl Plan + E2E Tests + Fail Case Matrix + Async Sequence | + User Journey + Behavior Mapping + Routing + Responsive + State Inventory + Edge Cases | + Analytics Events + Performance + full Fail Flows + A11y + Design Decisions |
| **Design (be)** | Endpoint spec + Existing Code Context + TDD (min. 1 test/AC) | + API Versioning + Input Validation + full TDD Test Plan | + Data Models + Service Layer + Business Logic + Error Handling + Impl Plan | + Auth Matrix + Sequence Diagram + Data Contracts + Events + Security + Logging + Env Vars + Migrations + Ext Deps | + Class Diagram + Caching + Performance + Design Decisions |

## Superpowers-Inspired Principles

These principles are adopted from [obra/superpowers](https://github.com/obra/superpowers) and enforced across all commands. Principles marked ✦ now have an invocable superpowers skill backing them (requires superpowers plugin).

| Principle | Enforced in | Rule |
|-----------|-------------|------|
| **Verification before completion** ✦ | `/implement` Step 4 | No completion claims without fresh test evidence · `superpowers:verification-before-completion` |
| **Multiple test runs are intentional** | `/implement` Step 4, `/code-review` Step 0, `/testing` Step 7b, `/git-commit` Step 8 | Each run is a freshness gate — time elapses between phases. This is not duplication. |
| **Two-stage review** ✦ | `/code-review` Steps 2a-2b | Spec compliance first, then code quality · `superpowers:requesting-code-review` |
| **Receiving review feedback** ✦ | `/code-review` Step 3c | Verify before implementing, push back with reasoning · `superpowers:receiving-code-review` |
| **Systematic debugging** ✦ | `/debug` | 4-phase root cause process, max 3 fix attempts · `superpowers:systematic-debugging` |
| **Subagent-driven development** ✦ | `/run-tasks` Step 6, `/execute-plan` | 3-agent pipeline: implementer → spec reviewer → quality reviewer · `superpowers:subagent-driven-development` |
| **Finishing a branch** ✦ | `/git-commit` Step 8 | 4 structured options: merge / PR / keep / discard · `superpowers:finishing-a-development-branch` |
| **HARD-GATE: approach approval** | `/discovery` Step 3b | No `/new-sprint` until user explicitly picks an approach |
| **HARD-GATE: task breakdown** | `/new-sprint` Step 3 | Wait for user to confirm sub-task table before writing docs |
| **HARD-GATE: AC confirmation** | `/requirement` Step 3 | Wait for "confirm" before saving requirement doc |
| **HARD-GATE: design clarification** | `/design` Step 1b | If ambiguities exist, collect all into one message and wait |
| **HARD-GATE: staging confirmation** | `/git-commit` Step 5 | Show file list, wait for yes/no/edit — never `git add -A` silently |
| **Bite-sized task granularity** ✦ | `/design` Step 2, `/write-plan` | Every Implementation Plan step = single action, 2-5 min · `superpowers:writing-plans` |
| **Worktree isolation** ✦ | `/implement` Step 0b, `/execute-plan` Step 2 | Create isolated git worktree per task before any code · `superpowers:using-git-worktrees` |

## Discovery Coverage Check — Two Levels (Both Required)

- `/new-sprint` Step 3b: **task-level** — does every discovery goal have a task assigned?
- `/requirement` Step 2b: **AC-level** — does every discovery goal have an AC in this task?

Both checks are required. They operate at different granularity and do not duplicate each other.

---

## TDD Rules

Full rules auto-loaded from `.claude/rules/testing.md`. Key points:
- Test first — always. Code written before test = **delete it**.
- Verify RED is mandatory — watch test fail before implementing.
- Real dependencies at integration layer — never mocks.
- Rationalization red flags table — see `rules/testing.md`.

## ID Format
- Sprint: `SP[N]` — e.g. `SP1`, `SP2`, `SP3`
- Task: `SP[N]-T[NNN]` — e.g. `SP1-T001`, `SP2-T003`
  - Task number is **global and never resets** across sprints

## Commit Format
```
[task-id] type: short description (max 72 chars)
```
Types: `feat` `fix` `test` `docs` `refactor` `chore`

## Branch Format
```
[sprint-id]/[task-id]-[short-description]
```

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
│       │   ├── SP1-T001-requirement.md ← /requirement output
│       │   ├── SP1-T001-frontend.md    ← /design fe output
│       │   ├── SP1-T001-backend.md     ← /design be output
│       │   ├── SP1-T001-issues.md      ← /issue output (auto-created)
│       │   └── SP1-T001-retro.md       ← /retro-task output
│       └── SP1-T002/
│   └── SP2/
│       ├── SP2-T003/                   ← task number continues from SP1
├── templates/
└── BACKLOG.md
```
