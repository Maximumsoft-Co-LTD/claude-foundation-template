# Claude Foundation Template

A structured workflow template for software development with Claude Code. Provides sprint management, TDD-first conventions, design documentation standards, and parallel task execution — all driven through Claude slash commands.

## What's Included

| Path | Description |
|------|-------------|
| `CLAUDE.md` | Project instructions loaded by Claude Code on every session (lean — ~50 lines) |
| `.claude/commands/` | Slash command definitions (`/discovery`, `/implement`, etc.) |
| `.claude/commands/_WORKFLOW-REF.md` | Full workflow reference: commands, status lifecycle, story points, TDD rules |
| `.claude/rules/` | Path-scoped convention files loaded automatically when Claude edits matching files |
| `.claude/hooks/` | Python scripts for PostToolUse automation (lint + TDD test enforcement) |
| `.claude/settings.json` | Hook wiring — connects lifecycle events to hook scripts |
| `.claude/skills/` | Optional skill commands that extend the core workflow |
| `brain/` | Living knowledge vault — decisions, patterns, lessons, sprint summaries |
| `docs/templates/` | Skeleton document templates for every workflow stage |
| `docs/BACKLOG.md` | Living backlog, auto-updated by workflow commands |
| `docs/_WORKFLOW.md` | Mermaid flow diagram + quick reference |

## Adopting in Your Project

There are two ways to use this template depending on whether you're starting fresh or adding it to an existing project.

---

### Option A — New project (clone as base)

```bash
git clone <this-repo> my-project
cd my-project
git remote set-url origin <your-new-repo-url>
```

Then follow the configuration steps below.

---

### Option B — Existing project (copy in)

Copy the workflow files into your existing repo without touching your source code:

```bash
# From inside your existing project root
git clone <this-repo> /tmp/claude-template

cp -r /tmp/claude-template/.claude .
cp -r /tmp/claude-template/brain .
cp -r /tmp/claude-template/docs .
cp    /tmp/claude-template/CLAUDE.md .

rm -rf /tmp/claude-template
```

If you already have a `.claude/` folder, merge selectively — don't overwrite existing `settings.json` or custom commands.

---

### Step 1 — Fill in `CLAUDE.md`

Open `CLAUDE.md` and replace the four placeholder sections with your project's specifics:

| Section | What to write |
|---------|--------------|
| **Project Overview** | What the project does, who uses it, key product goals |
| **Architecture** | Main entry points, service boundaries, key abstractions |
| **Team Conventions** | Branching model, PR process, env var setup, deploy process |
| **Key Constraints** | Runtime versions, compliance rules, performance budgets |

Keep it concise — CLAUDE.md is loaded on every session. Deep knowledge belongs in `brain/`.

---

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

Replace the placeholder conventions in each file with your team's actual standards (naming, imports, component patterns, etc.).

---

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

---

### Step 4 — Initialize the brain

The `brain/` directory ships with the template's own knowledge. Clear it and start fresh for your project:

```bash
# Keep the structure, wipe the content
find brain/01-concepts brain/02-decisions brain/03-patterns brain/04-lessons brain/05-sprints brain/06-glossary -type f -name "*.md" -delete
# Then clear the MOC index links (or leave as examples to follow)
```

The brain fills up naturally as you run `/retro-sprint` → `/brain-update` after each sprint.

---

### Step 5 — Run your first workflow

```bash
# Understand the problem first
/discovery disc-001 my-feature

# Plan the sprint
/new-sprint SP1 "My first sprint"

# Work a single task
/requirement SP1-T001
/fe-design SP1-T001    # skip if backend-only
/be-design SP1-T001    # skip if frontend-only
/implement SP1-T001
/code-review SP1-T001
/testing SP1-T001
/retro-task SP1-T001
/git-commit SP1-T001

# Or run multiple tasks in parallel
/run-tasks SP1-T001 SP1-T002 SP1-T003

# Close the sprint
/retro-sprint SP1
/brain-update SP1
```

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
| `/brain-update` | `[sprint-id]` | Extract sprint learnings into brain vault |
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

## Skills (`.claude/skills/`)

Skills extend the core workflow with optional steps — insert them where they add value for your project type.

**Quality & Review**

| Skill | Insert after | What it does |
|-------|-------------|--------------|
| `/db-schema-review [task-id]` | `/be-design` | Review schema before coding — naming, indexes, migration safety, API contract alignment |
| `/security-review [task-id]` | `/implement` | Secrets scan, injection checks, insecure defaults, new dependency risk |
| `/accessibility-review [task-id]` | `/testing` | WCAG 2.1 AA audit — ARIA, keyboard nav, color contrast, screen reader |
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

Skills live in `.claude/skills/<name>/SKILL.md`. They use the same frontmatter as commands (`allowed-tools`, `disable-model-invocation`, `context: fork`) and can be invoked as slash commands or triggered automatically by Claude when context matches.

---

## Path-Scoped Rules (`.claude/rules/`)

Rules in `.claude/rules/` extend CLAUDE.md with **path-specific conventions** loaded automatically when Claude edits matching files — so FE agents only load frontend rules and BE agents only load backend rules.

```
.claude/rules/
├── testing.md       # no frontmatter → always loaded (TDD rules)
├── frontend.md      # loaded only when editing src/**/*.{ts,tsx}, pages/**, etc.
└── backend.md       # loaded only when editing src/api/**, internal/**, etc.
```

Files **without** frontmatter load on every session alongside CLAUDE.md.
Files **with** `paths:` frontmatter load only when Claude reads or edits a matching file:

```yaml
---
paths:
  - "src/**/*.{ts,tsx}"
  - "src/api/**/*.ts"
---
# These rules apply only to TypeScript files
```

**To adapt for your project:** update the `paths:` globs in `frontend.md` and `backend.md` to match your directory structure, then replace the placeholder conventions with your team's actual standards.

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

Hooks run shell commands automatically at Claude Code lifecycle events — making conventions enforced rather than advisory. Configured in `.claude/settings.json`.

### Included hooks

| Hook file | Trigger | What it does |
|-----------|---------|--------------|
| `lint_ts.py` | `PostToolUse(Write\|Edit)` on `.ts/.tsx` | Runs `tsc --noEmit`, reports type errors to Claude |
| `lint_go.py` | `PostToolUse(Write\|Edit)` on `.go` | Runs `golangci-lint`, reports lint errors to Claude |
| `lint_js.py` | `PostToolUse(Write\|Edit)` on `.js/.jsx` | Runs ESLint, reports errors to Claude |
| `run_tests.py` | `PostToolUse(Write\|Edit)` on source files | Runs test suite after implementation edits; reports failures immediately |

### TDD enforcement hook

`run_tests.py` auto-detects the project's test runner (Jest/Vitest, Go test, pytest, RSpec) and runs the full suite every time Claude edits a non-test source file. If tests fail, the output is injected back into Claude's context so it sees failures immediately — without being asked to check.

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

This makes the TDD rule mechanical: Claude cannot finish an edit and move on without seeing test results. No reminder needed.

> **Note:** The test hook skips test files, docs, and config — it only fires on implementation code changes. Adjust `SKIP_PATTERNS` and `SOURCE_EXTS` in `run_tests.py` if needed.

---

## Brain / Knowledge Vault (`brain/`)

The brain is a living knowledge base that accumulates project intelligence across sprints — decisions made, patterns proven, lessons learned. It follows an Obsidian-style atomic note structure navigated via Maps of Content (MOCs).

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

**How it grows:** `/retro-sprint` extracts learnings from completed sprints → `/brain-update` writes them as atomic notes into the vault. Over time the brain becomes the authoritative source of non-obvious project knowledge that can't be derived from the code alone.

**How it's read:** Claude reads `BRAIN-INDEX.md` before key workflow commands, then navigates to only the relevant MOC and targeted notes — never the whole vault.

---

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
