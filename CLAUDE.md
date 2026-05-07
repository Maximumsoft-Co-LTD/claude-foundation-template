# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A workflow template for Claude Code. Provides structured sprint management, TDD conventions, document templates, and slash commands that guide development from discovery through retrospective. Clone this repo, fill in the project-specific sections below, and use the commands to run the full development lifecycle.

## Development Commands

```bash
# No build step — this is a template/docs-only repo.
# Copy this template into your project and replace the sections below.
```

## Architecture

- `.claude/commands/` — slash command definitions invoked by Claude Code
- `.claude/skills/` — atomic, model-invocable skills used as building blocks inside commands (see Atomic Skills section below)
- `.claude/rules/` — path-scoped conventions loaded automatically when Claude edits matching files
- `.claude/hooks/` — Python scripts executed at lifecycle events (PostToolUse: lint, test; UserPromptSubmit: audit-log)
- `docs/templates/` — Markdown templates for each workflow stage
- `docs/sprints/` — sprint and task output docs, one folder per sprint/task
- `docs/BACKLOG.md` — auto-updated task registry with status and story points
- `CLAUDE.md` — loaded by Claude Code on every session; drives all workflow behavior

## Team Conventions

- Branch format: `SP[N]/SP[N]-T[NNN]-short-description`
- Commit format: `SP[N]-T[NNN] type: description` (max 72 chars)
- Commit types: `feat` `fix` `test` `docs` `refactor` `chore`
- No direct commits to `main`; branch per task

## Key Constraints

- Task IDs are global and never reset across sprints
- Tasks sized at 13 story points must be broken down before any work begins
- Tests must be written before implementation code — never mocks at the integration layer
- Hooks require Python >= 3.10 (scripts use `X | Y` union type syntax)
- **Confidence Gate:** AI must be >= 90% confident before proceeding with any workflow command. If below 90%, STOP and ask for clarification. See `.claude/rules/confidence-gate.md`

---

## 🧠 Claude Brain (Knowledge Vault)

This project has a **living knowledge base** in `brain/` — an Obsidian-style vault of atomic notes, decisions, patterns, and lessons learned across all sprints.

**Brain access rules:** read `brain/BRAIN-INDEX.md` only when the task requires it — see `.claude/rules/brain.md` for the full access protocol. Do NOT read the brain at the start of every session.

**Brain structure:**
- `brain/00-MOC/` — Maps of Content (topic indexes for fast orientation)
- `brain/01-concepts/` — Core concepts (CON-xxx)
- `brain/02-decisions/` — Architectural decisions with rationale (DEC-xxx)
- `brain/03-patterns/` — Reusable implementation patterns (PAT-xxx)
- `brain/04-lessons/` — Retrospective learnings (LES-xxx)
- `brain/05-sprints/` — Per-sprint knowledge summaries
- `brain/06-glossary/` — Project vocabulary (GLO-xxx)

**The brain grows continuously:** `/retro-task` Step 4 captures task-level entries (high-bar, optional — most tasks produce zero) and `/retro-sprint` Step 6 consolidates sprint-level entries with dedup against task captures, then reviews CLAUDE.md rule promotions. No separate brain-update command needed.

---

## Workflow

### Scrum hierarchy (authoritative vocabulary)

| Template term | Scrum term | Deployable? | User value? |
|---------------|-----------|-------------|-------------|
| **Sprint** (`SP[N]`) | Epic — business theme across multiple stories | no | no |
| **Task** (`SP[N]-T[NNN]`) | Story — vertical slice (FE+BE+data), user-story format enforced | **yes** | **yes** |
| **Scope Overview bullet** (in design doc) | Feature-area summary inside a story (not a story itself) | no | no |
| **Implementation Plan row** (in design doc) | Engineering task — layer-level work | no | no |
| **Implementation Plan checkbox** | Subtask — atomic 2–5 min action | no | no |

Agents that run template commands inherit this vocabulary. "Task" in this repo ALWAYS means a Scrum Story unless the context explicitly says "engineering task."

### Command chain

Single task: `/discovery → /new-sprint → /requirement (unified story + FE design + BE design + Implementation Plan + tests) → /implement → /issue (loop) → /code-review → /testing → /retro-task → /git-commit → /next-task (repeat per task) → /retro-sprint (once ALL tasks done, includes brain update)`

Multiple tasks in parallel: `/run-tasks [task-id] [task-id] ...` (Agent tool) or `/run-tasks-p [task-id] [task-id] ...` (headless `claude -p` — leaner parent context)

Full workflow reference: `.claude/commands/_WORKFLOW-REF.md` — see **Superpowers-Inspired Principles** table for enforcement details.

## Atomic Skills (`.claude/skills/`)

Skills are model-invocable building blocks that commands compose. Each skill is `disable-model-invocation: false` so Claude picks them up by description match — but every command file also explicitly references the skills it depends on. See the skill's own `SKILL.md` for steps, inputs/outputs, and autopilot status-line format.

| Category | Skills | Used by |
|---|---|---|
| **Intent atom** | `prompt-understand` · `scope-check` · `ask-choice` · `solution-options` | `/dev`, `/discovery`, `/requirement` |
| **Pre-implementation gates** | `workspace-detect` · `reverse-engineer` · `impact-map` · `risk-register` · `nfr-plan` · `api-contract` · `vertical-slice` · `tdd-plan` | `/dev`, `/requirement`, `/implement` |
| **Bug & quality** | `bug-repro` · `debug` · `mongo-review` · `ui-verify` | `/issue`, `/debug`, `/code-review` |
| **Delivery** | `pr-create` · `release-notes` · `local-run` | `/git-commit`, `/retro-sprint` |
| **Meta** | `skill-evolution` · `brain-capture` · `agent-routing` · `session-handoff` | `/retro-sprint`, `/run-tasks`, mid-session |

**Three new gates wired into the core flow:**

| Skill | Trigger | Where |
|---|---|---|
| `bug-repro` | Any bug fix → must produce verified-RED failing test before code | `/issue` Step 3, `/debug` Phase 4 |
| `impact-map` | Change touches existing code → enumerate Tier-1/2/3 dependents | `/issue` Step 2, `/implement` Step 1e, `/code-review` Step 2a |
| `risk-register` | Migration · auth · payment · public API · removed cron → mitigation + rollback required | `/implement` Step 1e, `/code-review` Step 2b |

Code review now treats missing `impact-map` coverage or missing `risk-register` verification evidence as automatic Critical findings.

## Superpowers Integration

This template integrates with the [obra/superpowers](https://github.com/obra/superpowers) plugin. When installed, superpowers skills enhance existing commands at specific integration points:

- `brainstorming` — conversational design exploration with visual companion (`/brainstorm` command)
- `writing-plans` — detailed bite-sized implementation plans (`/write-plan` command)
- `executing-plans` / `subagent-driven-development` — subagent execution pipeline (`/execute-plan` command)
- `systematic-debugging` — 4-phase root cause investigation (referenced by `.claude/skills/debug/SKILL.md`)
- `verification-before-completion` — evidence-before-claims gate (invoked from `/implement` Step 4)
- `requesting-code-review` / `receiving-code-review` — subagent review dispatch (invoked from `/code-review`)
- `using-git-worktrees` — safe worktree setup (invoked from `/implement` Step 0b)
- `finishing-a-development-branch` — structured branch completion (invoked from `/git-commit` Step 8)

**Bridge commands:** `/brainstorm` · `/write-plan` · `/execute-plan`

**Priority rule:** Template commands always take priority. Superpowers skills provide the quality backbone but never override sprint-aware template behavior. See `.claude/rules/superpowers.md` for details.

**Graceful degradation:** All template commands work unchanged when superpowers is not installed.

## Context7 Integration

This template uses the [context7](https://github.com/upstash/context7-mcp) MCP plugin to fetch up-to-date library and framework documentation during coding workflows. Training data can be stale; context7 ensures API syntax, configuration, and best practices reflect the current library version.

**Commands with context7 integration:**

| Command | Where | What it fetches |
|---------|-------|----------------|
| `/requirement` | Step 1 — after codebase exploration | Framework/library patterns for the detected stack (both FE and BE as applicable) |
| `/implement` | Step 1 — after loading the unified requirement doc | API syntax for libraries the Implementation Plan references |
| `/debug` | Phase 2 — pattern analysis | Current API behavior of the library involved in the bug |
| `/issue` | Step 2 — investigate | Expected behavior of the library API in question |
| `/code-review` | Step 2b — code quality review | Correct usage patterns for libraries appearing in the diff |
| `/testing` | Step 2 — verify test environment | Test framework setup, assertions, E2E configuration |
| `/dependency-update` | Step 3 — check breaking changes | Migration guides for major version bumps |

**Tool pattern (always two steps):**
1. `mcp__plugin_context7_context7__resolve-library-id` — resolve library name → context7 ID
2. `mcp__plugin_context7_context7__query-docs` — fetch docs for the specific query

**Graceful degradation:** All commands work unchanged when context7 is not installed. Every integration point includes an explicit fallback: "If context7 is not available, proceed using codebase patterns and existing knowledge."
