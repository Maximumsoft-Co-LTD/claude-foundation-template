---
type: concept
tags: [claude-code, hooks, lifecycle, automation, governance]
related: [DEC-002-posttooluse-lint-hooks, CON-claude-code-skills, CON-mcp-integration]
updated: 2026-04-29
source: template
---

# Claude Code Hooks

## Core idea

A **hook** is a user-defined handler that runs automatically at a specific lifecycle event. Hooks turn Claude Code from "an LLM with tools" into a **policy-enforced** development environment — they can block actions, modify input, log activity, or trigger downstream automation.

As of 2026, Claude Code exposes 12+ lifecycle events with 4 handler types and async execution support.

## Event taxonomy

The lifecycle is organized around tool calls and session boundaries.

### Tool-call events
- **PreToolUse** — fires before a tool executes. **Can block.** Use for: security gates, file protection, mandatory review enforcement.
- **PostToolUse** — fires after a tool completes successfully. Cannot undo. Use for: auto-formatting, lint, logging, post-op validation.

### Session events
- **UserPromptSubmit** — fires when the user submits a prompt. Can inject context.
- **SessionStart** / **SessionEnd** — bookends. Use for: setup/teardown, audit log.

### Other (selected)
- **Stop** — fires when Claude finishes a response.
- **SubagentStop** — fires when a subagent finishes.
- **PreCompact** / **PostCompact** — around context compaction.
- **Notification** — when Claude requests notification (e.g., long-running task done).

## Handler types

| Type | What it does |
|------|--------------|
| `command` (shell) | Run a shell command, return exit code + stdout |
| `prompt` | Send a single-turn prompt to a Claude model for evaluation |
| `agent` | Spawn a subagent with tools (Read, Grep, Glob) for deep verification |
| `http` | POST to an HTTP endpoint, get JSON response |

Hooks can run **sync** (block until done) or **async** (fire-and-forget, available since Jan 2026).

## How this template uses hooks

The primary integration is **PostToolUse for lint and test** — see [[../02-decisions/DEC-002-posttooluse-lint-hooks]]. Concretely, after every Write/Edit on a code file:

```
Write → PostToolUse hook fires → run linter on the file → run relevant tests
       → if anything fails, surface the error to the next turn
```

This makes TDD enforcement mechanical instead of vibes-based. The agent can't "forget" to run tests — the hook runs them.

Other hooks present in this template (see `.claude/hooks/`):
- `brain_citation_meter.py` — tracks brain note references for the `/brain-meter` command

## PreToolUse — the gate hook

PreToolUse is special: it's the **only** hook that can block tool execution. Common uses:

| Use case | Pattern |
|----------|---------|
| Block edits to protected files | Match `tool_input.file_path` against a deny list |
| Enforce confirmation on destructive ops | Match Bash commands like `rm -rf`, return non-zero exit |
| Inject project context | Append CLAUDE.md content to the tool input |
| Audit before action | Log to file, allow tool to proceed |

Returning a non-zero exit code from a `command` hook **blocks** the tool. The error message is surfaced to Claude.

## PostToolUse — the validate hook

PostToolUse fires *after* the tool succeeded. It can't undo, but it can:
- Run validators on the result (lint, type-check, test)
- Trigger external automation (notify, log, archive)
- Surface follow-up issues to the next turn

The hook receives both `tool_input` (what was sent) and `tool_response` (what came back).

## Async hooks

Released January 2026. Fire-and-forget mode for hooks where the result doesn't need to gate the agent's next action. Example: notifying a Slack channel, writing analytics. Avoids blocking the agent on slow side-effects.

## Hooks vs skills vs MCP servers

| Primitive | Trigger | Power |
|-----------|---------|-------|
| **Hook** | Lifecycle event | Block/modify/log; runs automatically |
| **Skill** | Invocation (slash, programmatic) | Reusable capability; invoked when relevant |
| **MCP server** | Tool call | Provides additional tools to the AI |

Hooks are **declarative policy** — they govern what can happen. Skills and MCP are **active capability** — they expand what the AI can do.

## Configuration

In `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "python .claude/hooks/lint.py" }
        ]
      }
    ]
  }
}
```

Matchers are tool-name regexes. Order in the array = order of execution.

## Anti-pattern: making hooks chatty

A hook that prints 100 lines on success pollutes every tool result. Print only on **error or warning**. Use exit codes to communicate pass/fail; reserve stdout for actionable messages.

## Anti-pattern: blocking hooks for slow tasks

A hook that takes 30 seconds blocks every Write/Edit. Push slow work to async hooks (or to a separate slash command the user runs explicitly).

## Related

- [[../02-decisions/DEC-002-posttooluse-lint-hooks]] — this template's PostToolUse decision
- [[CON-claude-code-skills]] — the active-capability primitive
- [[CON-mcp-integration]] — the tool-providing primitive
- `.claude/settings.json` — local hook configuration
- `.claude/hooks/` — hook scripts
