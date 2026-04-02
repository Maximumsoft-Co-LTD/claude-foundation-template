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
- `.claude/rules/` — path-scoped conventions loaded automatically when Claude edits matching files
- `.claude/hooks/` — Python scripts executed at lifecycle events (PostToolUse: lint, test)
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

**The brain grows after every sprint:** `/retro-sprint` includes a brain update step (Step 6) — no separate command needed.

---

## Workflow

Two levels: **Sprint (Epic)** → **Tasks (Sub-tasks)**

Single task: `/discovery → /new-sprint → /requirement → /design fe → /design be → /implement → /issue (loop) → /code-review → /testing → /retro-task → /git-commit → /next-task (repeat per task) → /retro-sprint (once ALL tasks done, includes brain update)`

Multiple tasks in parallel: `/run-tasks [task-id] [task-id] ...` (Agent tool) or `/run-tasks-p [task-id] [task-id] ...` (headless `claude -p` — leaner parent context)

Full workflow reference: `.claude/commands/_WORKFLOW-REF.md` — see **Superpowers-Inspired Principles** table for enforcement details.
