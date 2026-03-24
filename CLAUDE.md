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
- `.claude/agents/` — sub-agent configs for parallel frontend/backend workflows
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

---

## Workflow

Two levels: **Sprint (Epic)** → **Tasks (Sub-tasks)**

Single task: `/discovery → /new-sprint → /requirement → /fe-design → /be-design → /implement → /issue → /code-review → /testing → /retro-task → /git-commit → /retro-sprint`

Multiple tasks in parallel: `/run-tasks [task-id] [task-id] ...`

Full workflow reference: `.claude/commands/_WORKFLOW-REF.md`
