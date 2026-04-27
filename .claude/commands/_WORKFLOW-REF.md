# Workflow Reference

## Bootstrap (one-time, per target repo)

Bootstrap is a shell script, not a slash command — you run it before Claude Code knows about the target repo.

```bash
# Remote — clone template and install into target
curl -fsSL https://raw.githubusercontent.com/Maximumsoft-Co-LTD/claude-foundation-template/main/install.sh | bash -s -- [target-path]

# Local — already have the template cloned
cd /path/to/claude-foundation-template
./install.sh [target-path] --local
```

Copies `.claude/`, `brain/`, `docs/`, and a new stack-aware `CLAUDE.md` into the target. Scans target stack and adapts path-scoped rules in `.claude/rules/{frontend,backend}.md`. Safe merge — never overwrites `settings.json`, existing brain notes, or an existing `CLAUDE.md`. After install, the target's first `/discovery` run fills the `TBD` sections in `CLAUDE.md` from the README.

## Full Flow

**1 task = 1 user story = 1 doc.** Requirement, FE design, BE design, Implementation Plan, and test plans all live in one `[task-id]-requirement.md`. There is no separate `/design fe` or `/design be` — design lives inside `/requirement`.

**Single task (sequential):**
```
/discovery → /new-sprint → /requirement → /implement
    → /issue (loop) → /code-review → /testing
    → /retro-task → /git-commit → /next-task (→ repeat per task)
    → /retro-sprint (once ALL tasks in sprint are done — includes brain update)
```

**Multiple tasks in parallel (subagent-driven):**
```
/discovery → /new-sprint → /run-tasks [task-id] [task-id] ...
    Phase 1: requirement (parallel, unified doc per task) → ⏸ user reviews all plans
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
| `/new-sprint` | `[sprint-id] [epic description]` | Turn a discovered epic into a sprint with scaffolded stories |
| `/requirement` | `[task-id]` | Write the unified story doc: requirement + FE design + BE design + Implementation Plan + TDD test plan |
| `/implement` | `[task-id]` | Write failing tests then implement following the unified requirement doc |
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
| `/write-plan` | `[task-id]` | Standalone bite-sized implementation plan via superpowers:writing-plans — after `/requirement` |
| `/execute-plan` | `[task-id]` | Subagent-driven plan execution via superpowers:subagent-driven-development — after `/write-plan` |
| `/create-pr` | `[task-id]` | Push branch + open GitHub PR pre-filled from the unified requirement doc — after `/git-commit` |

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
| `/db-schema-review` | `[task-id]` | during `/requirement` (BE tasks) — review schema design before writing any code |
| `/security-review` | `[task-id]` | `/implement` — secrets, injection, insecure defaults, dep risk |
| `/accessibility-review` | `[task-id]` | `/testing` — WCAG 2.1 AA audit for FE tasks |
| `/test-coverage` | `[task-id]` | `/testing` — coverage gaps mapped to ACs, missing test list |
| `/adr` | `[task-id] [title]` | during `/requirement` — record a non-trivial FE or BE design decision |

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
| `/create-pr` | `[task-id]` | `/git-commit` — push branch + open GitHub PR pre-filled from the unified requirement doc (workflow-aware wrapper around the `pr-create` skill) |
| `/pr-create` | `[task-id]` | `/git-commit` — same PR creation flow without the preconditions / confirmation gate / backlog update — use when you want the raw skill |
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
| `in-progress` | `/requirement`, `/next-task`, `/implement` |
| `blocked` | `/issue` (when impact blocks other tasks) |
| `review` | `/code-review` |
| `testing` | `/testing` |
| `done` | `/retro-task` |

## Story Points Scale

| Points | Size | Rule |
|--------|------|------|
| **1** | Trivial | Minimal docs — what changes + ACs + brief approach |
| **2** | Small | Core docs — ACs + user stories + approach + basic tests |
| **3** | Medium-small | Standard docs — full requirement + core design sections + Implementation Plan |
| **5** | Medium | Extended docs — most sections, system-level design |
| **8** | Large | All sections + full rigor (ADRs, perf benchmarks, analytics, a11y) |
| **13** | Too big | ⛔ Block — break into smaller tasks before proceeding |

## Required Sections by Points (unified requirement doc)

The unified doc includes Story & Requirements + FE Design (if applicable) + BE Design (if applicable) + Scope Overview & Implementation Plan + Test Plans + NFR/Rollout. Sections tagged `[FE]` are filled for fullstack/fe-only tasks, `[BE]` for fullstack/be-only tasks.

| Section group | 1pt | 2pt | 3pt | 5pt | 8pt |
|---------------|-----|-----|-----|-----|-----|
| **Story & Requirements** | Problem + ACs + Value + Definition of Done + Out of Scope | + User Stories + Dependencies | + Feature Flow + System Behavior + Business Rules + Metrics | + Analytics + Non-Functional Requirements + UI Copy + DO/DON'T + Open Questions | + Rollout |
| **Existing Code Context** | reuse-first minimal | + Project patterns | | | |
| **FE Design** | Approach + Component list + State Inventory skeleton | + Component Breakdown + API Contracts + State & Data Flow + **State Inventory (5-state table + transition diagram)** + FE Env/Config | + UI/UX Overview + Loading States + Async Sequence + Fail Case Matrix | + User Journey + Behavior Mapping + Routing + Responsive + Edge Cases + Accessibility + FE Performance | + FE Design Decisions (ADRs) |
| **BE Design** | API Endpoints + Error responses | + API Versioning + Input Validation | + Data Models + Service Layer + Business Logic + Error Handling | + Auth Matrix + Sequence Diagram + Data Contracts + Events + Security + Logging + Env Vars + Migrations + External Deps + BE Performance | + Class Diagram + Caching + BE Design Decisions (ADRs) |
| **Scope Overview & Implementation Plan** | (skip or minimal) | Scope Overview (3–6 bullets) | Full Implementation Plan + Subtask checkboxes | | |
| **Test Plans** | 1 TDD per AC | Full TDD Test Plan (unit + integration) | + E2E Test Plan + Test Data | | |

## Superpowers-Inspired Principles

These principles are adopted from [obra/superpowers](https://github.com/obra/superpowers) and enforced across all commands. Principles marked ✦ now have an invocable superpowers skill backing them (requires superpowers plugin).

| Principle | Enforced in | Rule |
|-----------|-------------|------|
| **Verification before completion** ✦ | `/implement` Step 4 | No completion claims without fresh test evidence · `superpowers:verification-before-completion` |
| **Multiple test runs are intentional** | `/implement` Step 4, `/code-review` Step 0, `/testing` Step 7, `/git-commit` Step 8 | Each run is a freshness gate — time elapses between phases. This is not duplication. |
| **Two-stage review** ✦ | `/code-review` Steps 2a-2b | Spec compliance first, then code quality · `superpowers:requesting-code-review` |
| **Receiving review feedback** ✦ | `/code-review` Step 3c | Verify before implementing, push back with reasoning · `superpowers:receiving-code-review` |
| **Systematic debugging** ✦ | `/debug` | 4-phase root cause process, max 3 fix attempts · `superpowers:systematic-debugging` |
| **Subagent-driven development** ✦ | `/run-tasks` Step 6, `/execute-plan` | 3-agent pipeline: implementer → spec reviewer → quality reviewer · `superpowers:subagent-driven-development` |
| **Finishing a branch** ✦ | `/git-commit` Step 8 | 4 structured options: merge / PR / keep / discard · `superpowers:finishing-a-development-branch` |
| **HARD-GATE: approach approval** | `/discovery` Step 3b | No `/new-sprint` until user explicitly picks an approach |
| **HARD-GATE: story breakdown** | `/new-sprint` Step 3 | Wait for user to confirm stories table before writing docs |
| **HARD-GATE: vertical slice** | `/new-sprint` Step 3 | Every non-infra task must be a user story with user-facing input, user-visible outcome, and cross-layer scope |
| **HARD-GATE: requirement confirmation** | `/requirement` Step 3 | Wait for "confirm" before saving unified doc |
| **HARD-GATE: design clarification** | `/requirement` Step 1b | If ambiguities exist, collect all into one message and wait |
| **HARD-GATE: staging confirmation** | `/git-commit` Step 5 | Show file list, wait for yes/no/edit — never `git add -A` silently |
| **Bite-sized task granularity** ✦ | `/requirement` Step 2, `/write-plan` | Every Implementation Plan subtask checkbox = single action, 2-5 min · `superpowers:writing-plans` |
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

> **Task type → commit type mapping:** `feat` → `feat` · `fix` → `fix` · `chore` → `refactor` or `chore` · `infra` → `chore` (infra tasks do not have a dedicated commit type — use `chore`)

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
│       │   ├── SP1-T001-requirement.md ← /requirement output (ONE unified doc: story + FE design + BE design + Implementation Plan + tests)
│       │   ├── SP1-T001-issues.md      ← /issue output (auto-created)
│       │   └── SP1-T001-retro.md       ← /retro-task output
│       └── SP1-T002/
│   └── SP2/
│       ├── SP2-T003/                   ← task number continues from SP1
├── templates/
└── BACKLOG.md
```
