---
type: concept
tags: [claude-code, mcp, tools, plugins, context7]
related: [CON-claude-code-skills, CON-claude-code-hooks]
updated: 2026-04-29
source: template
---

# MCP Integration

## Core idea

**Model Context Protocol (MCP)** is the open standard for letting an LLM talk to external tools and data sources. An **MCP server** runs as a process; Claude Code connects to it and exposes its tools to the AI as `mcp__<server>__<tool>` calls.

In this template, MCP is how we get fresh library docs, browser automation, and other capabilities the base model doesn't have.

## Servers used by this template

| Server | Purpose | Used by |
|--------|---------|---------|
| `plugin:context7:context7` | Up-to-date library docs (resolves training-data drift) | `/requirement`, `/implement`, `/debug`, `/issue`, `/code-review`, `/testing`, `/dependency-update` |
| `claude-in-chrome` | Browser automation (navigate, read, screenshot, console) | FE testing, design QA, demo recording |

Both gracefully degrade if the server is not installed.

## context7 — library docs

**The problem it solves:** Training data is stale. By the time you read this, React, Next.js, Prisma, etc. have shipped new versions, breaking changes, and new APIs. Your training-time knowledge is wrong, but you don't know which parts.

**The pattern (always two steps):**

```
1. mcp__plugin_context7_context7__resolve-library-id  ← name → context7 ID
2. mcp__plugin_context7_context7__query-docs          ← ID + query → fresh docs
```

When to use it (per `_WORKFLOW-REF.md`):

| Command | Where | What to fetch |
|---------|-------|---------------|
| `/requirement` | Step 1 | Framework patterns for the detected stack |
| `/implement` | Step 1 | API syntax for libraries the plan references |
| `/debug` | Phase 2 | Current API behavior of the suspect library |
| `/issue` | Step 2 | Expected behavior of the library API in question |
| `/code-review` | Step 2b | Correct usage patterns for libs in the diff |
| `/testing` | Step 2 | Test framework setup, assertions, E2E config |
| `/dependency-update` | Step 3 | Migration guides for major version bumps |

**Rule of thumb:** if the answer depends on library behavior, fetch fresh docs even if you "know" it. Training data ≠ current state.

## claude-in-chrome — browser automation

The Chrome MCP plugin lets the AI:
- Navigate URLs, read DOM, take screenshots, record GIFs
- Execute JavaScript in page context
- Read console messages and network requests
- Submit forms, click elements

Used for:
- FE testing (verify the feature actually renders correctly)
- Design QA (compare against design specs)
- Demo recording (capture interactions for the retro doc)

**Tool loading discipline:** Chrome tools are **deferred** — load them with `ToolSearch` before use (the `claude-in-chrome` server requires this). Calling them without loading the schema returns an error.

```
ToolSearch query: "select:mcp__claude-in-chrome__tabs_context_mcp"
→ schema loaded, now callable
```

## MCP vs hooks vs skills — distinct primitives

| Primitive | What it adds | When to reach for it |
|-----------|--------------|----------------------|
| **MCP server** | New tools the AI can call | Need a capability the base model lacks (fetch docs, browse, query DB) |
| **Hook** | Policy enforcement at lifecycle events | Need to govern *when/how* tools are used |
| **Skill** | Reusable expertise (instructions + sub-tools) | Need to apply a procedure consistently |

A workflow command typically uses **all three**: skills for procedure, hooks for guardrails, MCP for the underlying tool calls.

## Graceful degradation

Every MCP integration in this template includes an explicit fallback. From `_WORKFLOW-REF.md`:

> Graceful degradation: All commands work unchanged when context7 is not installed. Every integration point includes an explicit fallback: "If context7 is not available, proceed using codebase patterns and existing knowledge."

Hard rule: **never block a workflow command on a missing MCP server.**

## Configuration

MCP servers are configured in `.claude/settings.json` (or via plugin install):

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@upstash/context7-mcp@latest"]
    }
  }
}
```

After config change, restart the session for new servers to be picked up.

## Anti-pattern: redundant fetching

Fetching the same library docs in every step of a single sprint wastes tokens. Within one task:
- Fetch once during `/requirement` (Step 1) for the relevant lib
- Reference the cached context in subsequent steps
- Re-fetch only if the suspected behavior contradicts the earlier fetch

## Anti-pattern: fetching for general programming concepts

Context7 is for **specific libraries/frameworks/CLIs/services**. Don't use it for:
- "How does recursion work" (general concept)
- "Refactor this code" (no library involved)
- "Debug business logic" (not a library question)

Use it for: "How does Prisma's `connectOrCreate` work in the latest version?"

## Anti-pattern: ignoring deferred tool loading

The Chrome MCP requires `ToolSearch` to load tool schemas before use. Calling `mcp__claude-in-chrome__navigate` without first loading via ToolSearch fails with InputValidationError. Always load the specific tool first.

## Related

- [[CON-claude-code-skills]] — capability primitive (different)
- [[CON-claude-code-hooks]] — governance primitive (different)
- `.claude/commands/_WORKFLOW-REF.md` — context7 integration table per command
- Model Context Protocol spec — open standard, not Claude-specific
