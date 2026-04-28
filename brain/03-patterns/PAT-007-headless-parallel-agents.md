---
type: pattern
id: PAT-007
category: workflow
tags: [claude-code, parallel, headless, subprocess, token-optimization]
related: [PAT-005-subagent-driven-development, PAT-006-worktree-isolation]
updated: 2026-04-29
source: template
---

# PAT-007 — Headless Parallel Agents (`claude -p`)

## Problem

Running many tasks via the `Agent` tool keeps every subagent's tool output in the parent's transcript. For a sprint with 8 tasks × 3-agent pipeline × ~50 tool calls each = ~1,200 tool result blocks the parent has to carry. Even with prompt caching, this:
- Blows past 1M-context limits
- Makes the parent slow to respond
- Mixes audit trails so it's hard to find one task's output

We need a way to run the same 3-agent pipeline **without** the output landing in the parent's context.

## Solution

Use `claude -p` (print mode / headless mode) to spawn **subprocess** Claude sessions instead of using the Agent tool. Each subprocess writes its full transcript to a log file; only the final summary returns to the parent.

```
Parent session
   │
   ├─ claude -p "implementer prompt" → .claude/rtp/run-001/SP2-T042-impl.log → final summary
   ├─ claude -p "spec reviewer ..."  → .claude/rtp/run-001/SP2-T042-spec.log → final summary
   ├─ claude -p "quality reviewer ..."→ .claude/rtp/run-001/SP2-T042-qual.log→ final summary
   └─ ... runs N tasks in parallel via background subprocess
```

The parent only sees: which agents ran, their final pass/fail status, and the log file paths for inspection if needed.

## Used by

- `/run-tasks-p` (the `-p` suffix means "print/headless")
- Token-conscious automation runs (CI, scheduled tasks)
- Long-running sprint orchestrations where parent context size is a hard limit

## Trade-offs vs Agent tool

| Property | Agent tool (`/run-tasks`) | `claude -p` (`/run-tasks-p`) |
|----------|---------------------------|-------------------------------|
| Output in parent context | Full tool transcripts | Final summary only |
| Parent token cost | High (full audit in transcript) | Low (compressed summary) |
| Real-time visibility | High (parent watches each tool call) | Low (must tail log file) |
| Debug ergonomics | Excellent (output inline) | Requires opening log file |
| Caching benefit | Subagents share parent prompt cache | Subprocesses cold-start (no cache share) |
| Parallel cap | Bounded by API context | Bounded by API rate limits |
| Best for | Interactive, ≤3 parallel tasks | Batch, ≥4 parallel tasks |

Rule of thumb: **start with `/run-tasks`, switch to `/run-tasks-p` when parent context gets uncomfortable** (e.g., past 200k tokens or 4+ tasks).

## How it works

`claude -p "<prompt>"` runs a one-shot Claude session that:
1. Receives the prompt as the first user message
2. Has access to all the same tools as interactive Claude (Read, Edit, Bash, etc.)
3. Honors `.claude/settings.json` (so hooks, permissions, MCP servers all work)
4. Prints its final response to stdout when done
5. Exits

Combined with `&` for backgrounding, you can fan out N subprocesses from a single orchestrator agent.

## Log file convention

Template stores per-run logs under:
```
.claude/rtp/[run-id]/
├── orchestrator.log
├── SP2-T042-impl.log
├── SP2-T042-spec.log
├── SP2-T042-qual.log
└── ...
```

Where `[run-id]` is `YYYYMMDD-HHMMSS-[short-hash]`. This is the audit trail when something goes wrong.

## Caching consideration

The big downside: each `claude -p` invocation is a **separate API session** with a cold cache. The Anthropic prompt cache (5-min TTL) is per-session, so:
- Agent tool subagents inherit the parent's cache → most context is cached
- `claude -p` subprocesses have no shared cache → every invocation re-reads CLAUDE.md, etc.

Mitigation: keep `claude -p` prompts **self-contained and minimal**. Pass file paths instead of file contents; rely on the subprocess to read what it needs. Don't dump the entire requirement doc into the prompt.

## When NOT to use

- Tasks where the parent needs to react to intermediate outputs (e.g., follow-up questions) — use Agent tool instead
- Tasks under 3 parallel — overhead of subprocess startup + cold cache exceeds the parent-context savings
- Debugging mysterious agent behavior — the inline transcript from Agent tool is much easier to inspect

## Combining with worktrees

`/run-tasks-p` always combines headless mode with `/PAT-006-worktree-isolation`. Each subprocess gets:
1. Its own worktree (file isolation)
2. Its own `claude -p` session (context isolation)
3. Its own log file (output isolation)

This is the maximum-isolation configuration — subprocess + worktree per agent — and it's what scales to 8+ parallel tasks.

## Related

- [[PAT-005-subagent-driven-development]] — the same 3-agent pipeline, different transport
- [[PAT-006-worktree-isolation]] — file-level isolation companion
- `/run-tasks` vs `/run-tasks-p` — when to use which transport
- `claude -p --help` — full headless mode flags
