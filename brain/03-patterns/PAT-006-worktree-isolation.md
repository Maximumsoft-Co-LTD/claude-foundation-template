---
type: pattern
id: PAT-006
category: workflow
tags: [git, worktree, claude-code, parallel, isolation]
related: [PAT-005-subagent-driven-development, PAT-007-headless-parallel-agents]
updated: 2026-04-29
source: template
---

# PAT-006 — Git Worktree Isolation

## Problem

Running multiple Claude Code agents (or sessions) in the same working tree causes:
- File-edit clobbering — agent A overwrites agent B's changes
- Test interference — agent A's running tests pollute agent B's results
- Branch confusion — agents fight over which branch is checked out
- Recovery cost — one confused agent's mess affects all the others

We need true isolation per agent, but **without** the overhead of cloning the repo N times (which loses shared cache, breaks IDE attach, and wastes disk).

## Solution

Use **git worktrees** — separate working directories that share the same `.git/` repository but have independent file trees and branches.

```
.
├── .git/                       ← shared repo (all worktrees see this)
├── main-tree/                  ← primary worktree (the user's session)
└── .worktrees/
    ├── SP2-T042/               ← agent 1 worktree, branch SP2/SP2-T042-...
    ├── SP2-T043/               ← agent 2 worktree, branch SP2/SP2-T043-...
    └── SP2-T044/               ← agent 3 worktree, branch SP2/SP2-T044-...
```

Each subagent runs in its own worktree. File edits, test runs, and branch state are local to that worktree.

## When to use

- `/implement` Step 0b — single-task isolation
- `/execute-plan` Step 2 — plan execution in isolation
- `/run-tasks` and `/run-tasks-p` — every parallel agent gets its own worktree
- Any time you want a "throwaway" environment that's cheap to discard

## Setup

The template invokes `superpowers:using-git-worktrees` when available; otherwise the inline fallback uses:

```bash
git worktree add .worktrees/[task-id] -b [sprint-id]/[task-id]-[short-desc]
cd .worktrees/[task-id]
# agent runs here
```

Cleanup on success:
```bash
cd ..
git worktree remove .worktrees/[task-id]
```

The Agent tool's `isolation: "worktree"` parameter does this automatically — and **auto-removes the worktree if no changes were made**, so failed exploratory agents leave nothing behind.

## Properties

| Property | Behavior |
|----------|----------|
| File edits | Local to the worktree |
| Branch | One branch per worktree (cannot be checked out elsewhere) |
| `.git/` | Shared (push/pull works as normal) |
| Disk cost | ~working tree size only, not repo + history |
| Clone time | Instant (no network) |
| Discardable | Yes — `git worktree remove` is safe |

## What worktrees do NOT isolate

- **Database state** — if multiple agents hit the same dev DB, they collide. Use per-worktree DB schemas, Docker Compose namespaces, or testcontainers.
- **External services** — Stripe sandboxes, S3 buckets, etc. are shared unless explicitly partitioned.
- **`node_modules` / `target` / `__pycache__`** — these ARE per-worktree (because they live in the working tree), but they re-build per worktree, costing time on first run.
- **Environment variables** — process-level, not worktree-level. Shells inherit the parent's env.

For true full isolation including DB, add Docker Compose project naming or testcontainers per worktree (see external articles on "Claude Code worktree DB isolation").

## Why this beats branch switching

Branch switching (`git checkout`) inside one working tree:
- Forces a single context — can't have two agents working concurrently
- Re-builds dependencies on every switch (npm install, etc.)
- Risks dirty-state pollution if uncommitted changes exist

Worktrees: each agent has a permanent home for the duration of its task. No switching, no rebuild, no clobbering.

## Why this beats full clones

Multiple `git clone` of the same repo:
- Wastes disk (history duplicated N times)
- Breaks shared cache (each clone has its own object DB)
- Each clone needs separate fetch/pull
- Can't easily move commits between clones

Worktrees share `.git/`, so:
- Branches created in worktree A are immediately visible to worktree B
- Push from any worktree updates the shared remote tracking
- Disk usage scales with working trees, not history

## Cleanup discipline

```bash
git worktree list           # see all worktrees
git worktree remove <path>  # remove a worktree (must be clean)
git worktree prune          # garbage-collect stale worktree refs
```

The Agent tool with `isolation: "worktree"` cleans up automatically. Manual worktrees should be removed by `/git-commit` once the branch is merged or discarded.

## Production mileage

This pattern is used by teams running 4–7 concurrent Claude Code agents per developer (e.g., incident.io). It's also how Anthropic's `claude --worktree` flag and the Claude Code Desktop app implement built-in parallel sessions.

## Related

- [[PAT-005-subagent-driven-development]] — the pattern that needs this isolation
- [[PAT-007-headless-parallel-agents]] — `claude -p` workflow that uses worktrees
- `superpowers:using-git-worktrees` skill (when installed)
- `/implement` Step 0b — entry point for single-task worktree setup
