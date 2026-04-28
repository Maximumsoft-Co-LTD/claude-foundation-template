---
type: concept
tags: [claude-code, skills, plugins, workflow]
related: [PAT-004-superpowers-workflow-integration, CON-claude-code-hooks, CON-mcp-integration]
updated: 2026-04-29
source: template
---

# Claude Code Skills

## Core idea

A **skill** is a packaged unit of capability that Claude Code can invoke. It bundles:
- Domain instructions (how to do the job)
- Optional sub-tools (e.g., scripts, commands)
- A trigger condition (when to activate)

Skills are different from slash commands and from subagents — they're a third primitive in the Claude Code mental model.

## Mental model: three primitives

| Primitive | What it is | When to use |
|-----------|------------|-------------|
| **Slash command** | A user-typed `/foo` shortcut | User-initiated workflow steps |
| **Subagent** | A spawned Claude with its own context | Work that should not pollute parent context |
| **Skill** | A reusable capability bundle (instructions + tools) | Repeatable expertise the AI applies inside any session |

A slash command often **invokes** a skill. A skill often **dispatches** a subagent. They compose.

## Where skills live

In this template:
- **User-level skills** — `~/.claude/skills/` (across all projects for one user)
- **Project skills** — `.claude/skills/` (committed to repo, shared with team)
- **Plugin skills** — installed via plugin (e.g., `superpowers:brainstorming`)
- **Built-in skills** — shipped with Claude Code itself

A skill is typically a directory with a `SKILL.md` describing it.

## How skills get invoked

Three invocation paths:

1. **Explicit user invocation** — user types `/skill-name` (or the runtime auto-routes a freeform message)
2. **Programmatic invocation** — a slash command's body calls `Skill("name")`
3. **Auto-orchestrator** — `using-superpowers` (or similar) auto-loads at session start and routes freeform messages to relevant skills

In this template, **template slash commands always take priority** over auto-orchestrators (see [[PAT-004-superpowers-workflow-integration]]).

## Skills used by this workflow

| Skill | Source | Purpose |
|-------|--------|---------|
| `using-superpowers` | superpowers plugin | Auto-routes freeform messages to skills |
| `brainstorming` | superpowers | Conversational design exploration (`/brainstorm`) |
| `writing-plans` | superpowers | Bite-sized implementation plans (`/write-plan`) |
| `subagent-driven-development` | superpowers | 3-agent pipeline (`/execute-plan`, `/run-tasks`) |
| `using-git-worktrees` | superpowers | Worktree isolation (`/implement` Step 0b) |
| `verification-before-completion` | superpowers | Evidence gate (`/implement` Step 4) |
| `requesting-code-review` | superpowers | Spec compliance review (`/code-review` Step 2a) |
| `receiving-code-review` | superpowers | Review feedback handling (`/code-review` Step 3c) |
| `finishing-a-development-branch` | superpowers | Branch completion (`/git-commit` Step 8) |
| `systematic-debugging` | superpowers | 4-phase debug (`/debug`) |
| `test-driven-development` | superpowers | Inside `subagent-driven-development` |
| `dispatching-parallel-agents` | superpowers | Inside `subagent-driven-development` |

## Skills vs commands — when to write which

Write a **slash command** when:
- It's a workflow step the user types
- It needs sprint-aware behavior (task IDs, BACKLOG.md)
- It orchestrates multiple skills or subagents

Write a **skill** when:
- It's reusable across multiple commands
- It's a piece of expertise (not a workflow step)
- It might be triggered automatically by orchestrators

## Graceful degradation

Skills from external plugins (like superpowers) may not be installed. Every template integration point includes an explicit fallback:

```
If the superpowers plugin is available, invoke Skill("superpowers:X").
Otherwise, follow the inline steps below.
```

This is a hard rule. Never let a missing skill block a workflow command.

## Path overrides

When a template command invokes a skill, override default save paths:

| Skill default | Template path |
|---------------|---------------|
| `docs/superpowers/specs/...` | `docs/discovery/[disc-id]-[name].md` |
| `docs/superpowers/plans/...` | `docs/sprints/[sprint-id]/[task-id]/[task-id]-plan.md` |

See [[PAT-004-superpowers-workflow-integration]] for full path override rules.

## Anti-pattern: skill name guessing

Skills must be referenced by their **exact** registered name. Abbreviations fail:
- ✗ `Skill("fe-design")`
- ✓ `Skill("superpowers:writing-plans")` (when calling from a template command)

If unsure, run the discovery skill first or check the plugin's `commands.yaml`.

## Related

- [[CON-claude-code-hooks]] — lifecycle event handlers (different primitive)
- [[CON-mcp-integration]] — external tool servers (different primitive)
- [[PAT-004-superpowers-workflow-integration]] — how this template uses skills
- `.claude/rules/superpowers.md` — priority and override rules
