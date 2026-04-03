# Claude Foundation

A full-lifecycle development workflow plugin for Claude Code. Brings sprint management, TDD-first conventions, design documentation standards, a living knowledge vault, and parallel task execution — all driven through Claude slash commands.

> **Why use this?** Claude Code is powerful but opinionated in no particular direction. This template gives it a complete development methodology: discover → plan → design → implement → review → ship → reflect — enforced through hooks, rules, and structured commands so the workflow is mechanical, not aspirational.

## Install as Plugin

```
/plugin marketplace add Maximumsoft-Co-LTD/claude-foundation-template
/plugin install claude-foundation@claude-foundation-marketplace
```

Or adopt manually into an existing project — see [Manual Adoption](#manual-adoption) below.

## What's Included

| Path | Description |
|------|-------------|
| `CLAUDE.md` | Project instructions loaded by Claude Code on every session |
| `.claude/commands/` | Slash command definitions (`/discovery`, `/implement`, etc.) |
| `.claude/commands/_WORKFLOW-REF.md` | Full workflow reference: commands, status lifecycle, story points, TDD rules |
| `.claude/rules/` | Path-scoped convention files auto-loaded when Claude edits matching files |
| `.claude/hooks/` | Python scripts for PostToolUse automation (lint + TDD test enforcement) |
| `.claude/settings.json` | Hook wiring — connects lifecycle events to hook scripts |
| `.claude/skills/` | Optional skill commands that extend the core workflow |
| `brain/` | Living knowledge vault — decisions, patterns, lessons, sprint summaries |
| `docs/templates/` | Skeleton document templates for every workflow stage |
| `docs/BACKLOG.md` | Living backlog, auto-updated by workflow commands |
| `docs/WORKFLOW-QUICKREF.md` | One-page manual: flow diagram, command cheat sheet, hard gates, escape hatches, TDD law |

---

## Manual Adoption

### Option A — New project (clone as base)

```bash
git clone https://github.com/Maximumsoft-Co-LTD/claude-foundation-template my-project
cd my-project
git remote set-url origin <your-new-repo-url>
```

Then follow the configuration steps below.

### Option B — Existing project (copy in)

```bash
# From inside your existing project root
git clone https://github.com/Maximumsoft-Co-LTD/claude-foundation-template /tmp/claude-template

cp -r /tmp/claude-template/.claude .
cp -r /tmp/claude-template/brain .
cp -r /tmp/claude-template/docs .
cp    /tmp/claude-template/CLAUDE.md .

rm -rf /tmp/claude-template
```

If you already have a `.claude/` folder, merge selectively — don't overwrite existing `settings.json` or custom commands.

### Step 1 — Fill in `CLAUDE.md`

Replace the four placeholder sections with your project's specifics:

| Section | What to write |
|---------|--------------|
| **Project Overview** | What the project does, who uses it, key product goals |
| **Architecture** | Main entry points, service boundaries, key abstractions |
| **Team Conventions** | Branching model, PR process, env var setup, deploy process |
| **Key Constraints** | Runtime versions, compliance rules, performance budgets |

Keep it concise — `CLAUDE.md` is loaded on every session. Deep knowledge belongs in `brain/`.

### Step 2 — Adapt path-scoped rules

Edit `.claude/rules/frontend.md` and `.claude/rules/backend.md` to match your directory structure:

```yaml
# .claude/rules/frontend.md
---
paths:
  - "src/**/*.{ts,tsx}"   # change to match your FE files
  - "app/**/*.tsx"
---
```

Replace the placeholder conventions with your team's actual standards (naming, imports, component patterns, etc.).

### Step 3 — Configure hooks for your stack

The included hooks cover TypeScript, Go, and JavaScript. Enable only what applies:

```json
// .claude/settings.json — remove hooks for languages you don't use
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "python3 .claude/hooks/lint_ts.py" }] },
      { "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "python3 .claude/hooks/run_tests.py" }] }
    ]
  }
}
```

If your stack isn't covered, copy an existing hook file and adjust the linter command and file extension patterns at the top.

### Step 4 — Initialize the brain

The `brain/` directory ships with this template's own knowledge. Clear it and start fresh for your project:

```bash
# Keep the structure, wipe the content
find brain/01-concepts brain/02-decisions brain/03-patterns brain/04-lessons brain/05-sprints brain/06-glossary -type f -name "*.md" -delete
# Then clear the MOC index links (or leave as examples to follow)
```

The brain fills up naturally as you run `/retro-sprint` — brain update is built into Step 6.

### Step 5 — Run your first workflow

```bash
/discovery disc-001 my-feature   # Understand the problem first
/new-sprint SP1 "My first sprint"

# Work a single task
/requirement SP1-T001
/design fe SP1-T001    # skip if BE-only
/design be SP1-T001    # skip if FE-only
/implement SP1-T001
/code-review SP1-T001
/testing SP1-T001
/retro-task SP1-T001
/git-commit SP1-T001
/next-task             # pick up next task, or proceed to retro-sprint if all done

# Or run multiple tasks in parallel
/run-tasks SP1-T001 SP1-T002 SP1-T003

# Close the sprint (after ALL tasks committed)
/retro-sprint SP1
```

---

## Workflow

**Single task (sequential):**
```
/discovery → /new-sprint → /requirement → /design fe → /design be → /implement
    → /issue (loop) → /code-review → /testing
    → /retro-task → /git-commit → /next-task (repeat per task)
    → /retro-sprint (once ALL tasks done)
```

**Multiple tasks in parallel:**
```
/new-sprint → /run-tasks [task-id] [task-id] ...        # Agent tool (rich context)
         or → /run-tasks-p [task-id] [task-id] ...      # claude -p (lean parent context)
    Phase 1: requirement → design fe → design be (parallel, MAX 4 at once) → ⏸ user reviews
    Phase 2: implement → spec review → quality review → retro-task (parallel, MAX 4 at once)
    → /git-commit per task → /retro-sprint
```

**Context optimization (both variants):** The parent session pre-loads sprint overview, backlog rows, discovery doc, and a codebase manifest **once** — injected into every agent. Each agent type receives only the doc sections it needs (AC list, TDD Test Plan, or Implementation Plan) rather than full design docs. File paths are never passed to agents, preventing redundant reads.

Full quick reference (flow diagram, hard gates, escape hatches): `docs/WORKFLOW-QUICKREF.md`

### All Commands

| Command | Args | Purpose |
|---------|------|---------|
| `/discovery` | `[disc-id] [name]` | Understand problem before planning |
| `/brainstorm` | `[disc-id] [name]` | Open-ended ideation — superpowers bridge, alternative to `/discovery` |
| `/new-sprint` | `[SP[N]] [epic description]` | Create sprint, scaffold tasks as user stories with E2E validation scenarios |
| `/requirement` | `[task-id]` | Draft ACs + requirement doc |
| `/run-tasks` | `[task-id] [task-id] ...` | Run multiple tasks in parallel (2-phase pipeline); MAX_PARALLEL cap + context pre-loading |
| `/run-tasks-p` | `[task-id] [task-id] ...` | Headless variant — spawns `claude -p` subprocesses; parent context stays lean; file-based context injection |
| `/design` | `[fe\|be] [task-id]` | Frontend or backend design + TDD test plan |
| `/write-plan` | `[task-id]` | Bite-sized implementation plan — superpowers bridge, use after `/design be` |
| `/implement` | `[task-id]` | Write failing tests → implement → verify |
| `/execute-plan` | `[task-id]` | Execute plan via subagents with worktree isolation — superpowers bridge |
| `/issue` | `[task-id] [desc]` | TDD bug fix + log (known root cause during active sprint task) |
| `/debug` | `[task-id?] [desc]` | 4-phase root cause investigation (unknown cause, flaky test, regression) |
| `/code-review` | `[task-id]` | Two-stage review: spec compliance → code quality |
| `/testing` | `[task-id]` | Full suite + E2E production readiness gate |
| `/retro-task` | `[task-id]` | Write retro, mark task done |
| `/retro-sprint` | `[sprint-id]` | Sprint retro + brain update (after ALL tasks done) |
| `/git-commit` | `[task-id]` | Stage selectively + commit + choose merge/PR/keep/discard |
| `/next-task` | `[task-id]?` | Load next task; auto-reconcile stale BACKLOG statuses |
| `/status` | _(none)_ | Read-only sprint snapshot: progress counts, last step per task, suggested next action |

### `/issue` vs `/debug` — Which to use?

| Situation | Command |
|-----------|---------|
| Bug found during active implementation — you know what broke | `/issue` |
| Critical issue found after code review | `/issue` |
| Unknown root cause, flaky test, unexpected regression | `/debug` |
| Production incident — no sprint context | `/debug` (no task-id) |

---

## Task Format

Each task created by `/new-sprint` is a **user story** — `"As a [role], I want [action], so that [outcome]."` — not a layer-level technical title. Each story is a vertical slice: FE + BE + data, delivering a user-visible outcome testable end-to-end.

Exception: pure infrastructure tasks (DB migrations, CI setup) use `"[Infra] what it enables"` format and are marked type `infra`.

Each task also has **E2E Validation Scenarios** — numbered `GIVEN/WHEN/THEN` steps written at sprint planning time. `/requirement` seeds its acceptance criteria directly from these scenarios.

A **Vertical Slice HARD-GATE** in `/new-sprint` catches layer-only tasks automatically ("Build login API" → must be merged into the user story that calls it) before sprint planning is confirmed.

---

## ID & Commit Conventions

```
Sprint:  SP1, SP2, SP3 ...
Task:    SP1-T001, SP1-T002 ... (global, never resets across sprints)
Branch:  SP1/SP1-T001-short-description
Commit:  SP1-T001 feat: short description (max 72 chars)
```

Task types: `feat` · `fix` · `chore` · `infra`  
Commit types: `feat` `fix` `test` `docs` `refactor` `chore` (infra tasks commit as `chore`)

---

## Story Points & Doc Depth

Points follow Fibonacci scale (1–8) and control documentation depth — not velocity estimates.

| Points | Size | Docs required |
|--------|------|---------------|
| 1 | Trivial | Problem + ACs + approach |
| 2 | Small | + User stories + test data |
| 3 | Medium-small | + Full requirement + core design sections |
| 5 | Medium | + System-level design, analytics |
| 8 | Large | + ADRs, perf benchmarks, a11y, full rigor |
| 13 | Too big | Block — break it down first |

Full section requirements per point level: `.claude/commands/_WORKFLOW-REF.md`

---

## Skills (`.claude/skills/`)

Skills extend the core workflow with optional steps — insert them where they add value for your project type.

**Frontend Design**

| Skill | Insert after | What it does |
|-------|-------------|--------------|
| `frontend-design` | `/design fe` Step 2 | Production-grade, visually distinctive UI components, pages, and dashboards |
| `ui-ux-pro-max` | `frontend-design` | Design QA — 161 palettes, 50+ styles, 99 UX guidelines, 57 font pairings across 10 stacks |

**Quality & Review**

| Skill | Insert after | What it does |
|-------|-------------|--------------|
| `/db-schema-review [task-id]` | `/design be` | Review schema before coding — naming, indexes, migration safety, API contract alignment |
| `/security-review [task-id]` | `/implement` | Secrets scan, injection checks, insecure defaults, new dependency risk |
| `/accessibility-review [task-id]` | `/testing` | WCAG 2.1 AA — ARIA, keyboard nav, color contrast, screen reader |
| `/test-coverage [task-id]` | `/testing` | Coverage gaps mapped to ACs, prioritised list of missing tests |
| `/adr [task-id] [title]` | during design | Record a non-trivial architectural decision with options + rationale |

**Development Workflow**

| Skill | Insert after | What it does |
|-------|-------------|--------------|
| `/debug [task-id] [symptom]` | during implement/testing | Reproduce → isolate → hypothesize → confirm root cause → fix |
| `/refactor [task-id] [type] [target]` | after retro (tech debt) | Safe, test-first restructuring — rename, extract, decompose, move |

**Maintenance**

| Skill | Insert after | What it does |
|-------|-------------|--------------|
| `/dependency-update [scope]` | pre-sprint | Audit all deps for CVEs + outdated versions, generate safe upgrade plan |
| `/env-setup` | project clone | Bootstrap dev environment — runtimes, deps, env vars, DB migrations |

**Delivery**

| Skill | Insert after | What it does |
|-------|-------------|--------------|
| `/pr-create [task-id]` | `/git-commit` | Push branch + open PR with pre-filled title, AC checklist, doc links |
| `/changelog [sprint-id] [version]` | `/retro-sprint` | Convert sprint commits + retros into user-facing release notes |

**Session Management**

| Skill | Insert after | What it does |
|-------|-------------|--------------|
| `/session-handoff [task-id]` | end of mid-task session | Serialize context (stopping point, next action, git state) for seamless resumption |

Skills live in `.claude/skills/<name>/SKILL.md` and use the same frontmatter as commands (`allowed-tools`, `disable-model-invocation`, `context: fork`). They can be invoked as slash commands or triggered automatically when context matches.

---

## Path-Scoped Rules (`.claude/rules/`)

Rules extend `CLAUDE.md` with **path-specific conventions** auto-loaded when Claude edits matching files — so FE agents only see frontend rules and BE agents only see backend rules.

```
.claude/rules/
├── testing.md       # no frontmatter → always loaded (TDD rules)
├── frontend.md      # loaded only when editing src/**/*.{ts,tsx}, pages/**, etc.
└── backend.md       # loaded only when editing src/api/**, internal/**, etc.
```

Files **without** frontmatter load on every session alongside `CLAUDE.md`.  
Files **with** `paths:` frontmatter load only when Claude reads or edits a matching file:

```yaml
---
paths:
  - "src/**/*.{ts,tsx}"
  - "src/api/**/*.ts"
---
# These rules apply only to TypeScript files
```

Common glob patterns:

| Pattern | Matches |
|---------|---------|
| `src/**/*.{ts,tsx}` | All TypeScript + React files |
| `src/api/**/*.ts` | API layer only |
| `internal/**/*` | Go internal packages |
| `**/{test,__tests__,spec}/**/*` | Test directories |
| `app/**/*.{ts,tsx}` | Next.js app router |

---

## Hooks (`.claude/hooks/`)

Hooks run shell commands automatically at Claude Code lifecycle events — making conventions enforced rather than advisory.

| Hook file | Trigger | What it does |
|-----------|---------|--------------|
| `lint_ts.py` | `PostToolUse(Write\|Edit)` on `.ts/.tsx` | Runs `tsc --noEmit`, reports type errors to Claude |
| `lint_go.py` | `PostToolUse(Write\|Edit)` on `.go` | Runs `golangci-lint`, reports lint errors to Claude |
| `lint_js.py` | `PostToolUse(Write\|Edit)` on `.js/.jsx` | Runs ESLint, reports errors to Claude |
| `run_tests.py` | `PostToolUse(Write\|Edit)` on source files | Runs test suite after implementation edits; reports failures immediately |

### TDD enforcement

`run_tests.py` auto-detects the project's test runner (Jest/Vitest, Go test, pytest, RSpec). When Claude edits a source file it first tries to run only the related test file (e.g. `bar.test.ts` for `bar.ts`) for fast feedback, falling back to the full suite when no related test is found.

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "python3 .claude/hooks/run_tests.py",
        "timeout": 120,
        "statusMessage": "Running tests..."
      }]
    }]
  }
}
```

This makes the TDD rule mechanical: Claude cannot finish an edit and move on without seeing test results.

> **Note:** The test hook skips docs and config files. When a test file itself is edited, it runs that test file directly. Adjust `SKIP_PATTERNS` and `SOURCE_EXTS` in `run_tests.py` for your stack.

---

## Superpowers Integration

Integrates with [obra/superpowers](https://github.com/obra/superpowers). When installed, superpowers skills enhance existing commands at specific integration points.

| Integration point | Superpowers skill | Template command |
|-------------------|-------------------|-----------------|
| Conversational design exploration | `brainstorming` | `/brainstorm` |
| Detailed bite-sized implementation plans | `writing-plans` | `/write-plan` |
| Subagent execution pipeline | `executing-plans` / `subagent-driven-development` | `/execute-plan` |
| 4-phase root cause investigation | `systematic-debugging` | `/debug` |
| Evidence-before-claims gate | `verification-before-completion` | `/implement` Step 4 |
| Subagent review dispatch | `requesting-code-review` / `receiving-code-review` | `/code-review` |
| Safe worktree setup | `using-git-worktrees` | `/implement` Step 0b |
| Structured branch completion | `finishing-a-development-branch` | `/git-commit` Step 8 |

**Priority rule:** Template commands always take priority. Superpowers provides the quality backbone but never overrides sprint-aware template behavior.

**Graceful degradation:** All commands work unchanged when superpowers is not installed. Every integration point is advisory — if the skill is absent, the template's inline steps run instead.

Full integration rules and file path overrides: `.claude/rules/superpowers.md`

---

## Context7 Integration

Uses the [context7](https://github.com/upstash/context7-mcp) MCP plugin to fetch up-to-date library documentation during coding workflows. Training data can be stale; context7 ensures API syntax and best practices reflect the version actually installed.

| Command | Integration point | What it fetches |
|---------|------------------|----------------|
| `/design fe` / `/design be` | Step 1 — after codebase exploration | Framework patterns for the detected stack |
| `/implement` | Step 1 — after loading design docs | API syntax for libraries the plan references |
| `/debug` | Phase 2 — pattern analysis | Current API behavior of the library involved in the bug |
| `/issue` | Step 2 — via `/debug` Phase 2 | Inherited automatically |
| `/code-review` | Step 2b — code quality review | Correct usage patterns, deprecated APIs |
| `/testing` | Step 2 — test environment check | Test runner/E2E setup, assertions, configuration |
| `/dependency-update` | Step 3 — breaking changes check | Migration guides for major version bumps |

**Tool pattern (always two steps):**
1. `resolve-library-id` — library name → context7 ID
2. `query-docs` — fetch docs for the specific query

**Graceful degradation:** All commands work unchanged when context7 is not installed.

---

## Brain / Knowledge Vault (`brain/`)

A living knowledge base that accumulates project intelligence across sprints — decisions made, patterns proven, lessons learned. Follows an Obsidian-style atomic note structure navigated via Maps of Content (MOCs).

```
brain/
├── BRAIN-INDEX.md          # Master entry point — start here
├── 00-MOC/                 # Topic indexes (Frontend, Backend, Workflow, QA, Decisions, Lessons)
├── 01-concepts/            # Core concepts (CON-xxx)
├── 02-decisions/           # Architectural decisions with rationale (DEC-xxx)
├── 03-patterns/            # Reusable implementation patterns (PAT-xxx)
├── 04-lessons/             # Retrospective learnings (LES-xxx)
├── 05-sprints/             # Per-sprint knowledge summaries
└── 06-glossary/            # Project vocabulary (GLO-xxx)
```

**How it grows:** `/retro-sprint` Step 6 extracts learnings and writes them as atomic notes — no separate command needed. Over time the brain becomes the authoritative source for non-obvious project knowledge that can't be derived from the code alone.

**How it's read:** Claude reads `BRAIN-INDEX.md` only when the task requires it — before workflow commands like `/discovery`, `/implement`, or `/design`. Navigation is always MOC → targeted notes — never the whole vault. Full access protocol: `.claude/rules/brain.md`.

---

## TDD Rules (Iron Law)

1. Write the failing test **first** — before any implementation code.
2. Run it. Confirm it **fails** with an expected message (not a crash).
3. Implement the **minimum** code to make it pass.
4. Run the **full suite**. Confirm green with zero regressions.
5. Code written before its test? **Delete it.** Rewrite from tests.

Integration tests use **real dependencies** — never mocks at the integration layer.  
A bug fix always starts with a **failing test** that reproduces the bug.  
Rationalization red-flags table: `docs/WORKFLOW-QUICKREF.md` → Section E.

---

## Escape Hatches

Common real-world deviations from the standard flow — see `docs/WORKFLOW-QUICKREF.md` Section D for full recipes.

| Scenario | Short path |
|----------|-----------|
| **Hotfix** | `/debug` → TDD fix → `/git-commit` → PR (skip sprint flow) |
| **FE-only task** | Skip `/design be`; `/implement` sets `HAS_BE=false` automatically |
| **BE-only task** | Skip `/design fe`; `/implement` sets `HAS_FE=false` automatically |
| **Exploratory spike** | `/requirement` (questions as ACs) → research → write discovery/brain doc → `/retro-task` |
| **Blocked task** | `/issue` → mark `blocked` → `/next-task` → resume when unblocked |
| **Multi-sprint epic** | One `/discovery` → one `/new-sprint` per deployable slice; task IDs never reset |

---

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

---

## Troubleshooting

**Hooks not firing**
- Check that `.claude/settings.json` exists and the `hooks` block is valid JSON.
- Hooks only fire in a project with `.claude/settings.json` — not globally.
- Each lint hook self-filters by file extension, so it is safe to include all hooks regardless of your stack.

**`/design fe` or `/design be` not found**
- Confirm `.claude/commands/design.md` exists in your project.
- If you adopted from an older version, you may have the old `fe-design.md` / `be-design.md` files. Delete them and copy `design.md` from the latest template.

**Brain vault feels stale**
- The brain is updated automatically at Step 6 of `/retro-sprint`. If you ran retros before the brain step was added, run `/retro-sprint` again — it is idempotent.
- Never read the entire `brain/` directory. Navigate via `BRAIN-INDEX.md` → MOC → targeted notes only.

**`BACKLOG.md` out of sync**
- Run `/next-task` — it auto-reconciles stale statuses before picking up the next task.

**Task ID confusion across sprints**
- Task IDs are **global and never reset**. SP2 tasks start from (highest SP1 task ID + 1), not T001.

---

## License

MIT
