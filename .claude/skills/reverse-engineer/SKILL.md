---
description: Brownfield deep-scan — generates architecture / components / dependencies / business-flow doc via parallel Explore agents, cached for 30 days
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(ls:*), Bash(find:*), Bash(stat:*), Bash(git log:*), Bash(wc:*), Agent
disable-model-invocation: false
---

# reverse-engineer

Workflow position: **invoked by `/dev` (or `/discovery`) when `workspace-detect` reports brownfield without a fresh RE artifact**

Produces `docs/discovery/RE-[YYYY-MM-DD].md` — the canonical "what does this codebase do" reference. Used by every subsequent design/implementation step instead of re-deriving context each time.

Arguments: none (or `--force` to ignore cache)

---

## When to invoke

- Brownfield project with no RE artifact, or RE artifact > 30 days old
- After a major refactor (manual invocation, `--force`)
- When `/discovery` for a complex epic needs system-wide context

Skip:
- Greenfield project (nothing to reverse-engineer)
- Fresh RE artifact (< 30 days) exists — reuse it

---

## Step 1 — Cache check

```bash
ls -t docs/discovery/RE-*.md 2>/dev/null | head -1
```

If found, check age:

```bash
stat -c '%y' docs/discovery/RE-[date].md   # or %Sm on macOS
```

| Age | Action |
|---|---|
| < 30 days | Reuse — return path to existing doc, skip the rest |
| 30–90 days | Reuse but flag "stale" in output, suggest user run `--force` if recent big changes |
| > 90 days OR `--force` | Re-run full RE |

---

## Step 2 — Spawn parallel Explore agents (4 concerns)

In autopilot mode, this MUST be parallel — one message with 4 `Agent()` calls:

| Agent | Concern | Prompt focus |
|---|---|---|
| 1 | Architecture | Top-level layout, services, deployment shape, how components communicate |
| 2 | Components | Per-package/module inventory: name, purpose, key public API |
| 3 | Data | Database collections / tables, schemas, indexes, migrations history |
| 4 | Business flows | Trace 3 typical user actions through the code (login, primary CRUD, secondary action) |

Each agent uses subagent_type `Explore`, model `haiku` (fast, breadth scan), tool surface `Read, Grep, Glob`.

Each agent's prompt is self-contained: lists the repo root, the concern, the output format expected (markdown subsection), and a length cap (≤ 400 words per agent).

Wait for all 4 to complete.

---

## Step 3 — Synthesize into RE doc

Open `docs/discovery/RE-[YYYY-MM-DD].md` for write. Structure:

```markdown
# Reverse Engineering — [project name] — [YYYY-MM-DD]

## TL;DR
[3–5 sentences. What this system does, who uses it, the dominant tech.]

## Stack
[from workspace-detect output, expanded]

## Architecture
[from Agent 1]
- Diagram (ASCII or mermaid) of services and how they connect
- Key boundaries (process, network, deployment)

## Components
[from Agent 2 — one row per component]

| Component | Path | Purpose | Public API surface |
|---|---|---|---|
| auth | `internal/auth/` | JWT issuance + Google OAuth | `Login`, `RefreshToken`, `Logout` |
| things | `internal/things/` | core business CRUD | `Create`, `List`, `Get`, `Update`, `Delete` |
| ... | ... | ... | ... |

## Data model
[from Agent 3]

### Collections (Mongo)
- `users` — { _id, email, name, googleSub, createdAt, ... }
- `things` — { _id, name, tags, createdBy → users._id, createdAt, updatedAt }
- ...

### Indexes
- `users.googleSub` (unique)
- `things.{createdBy:1, createdAt:-1}` (compound)

### Migration history (last 5)
[git log of migrations/ folder]

## Business flows
[from Agent 4 — one subsection per flow]

### Flow 1: User login (Google OAuth)
1. FE redirects to `/auth/google`
2. BE redirects to Google consent
3. ...

### Flow 2: Create a thing
1. ...

### Flow 3: ...

## Dependencies
[external libraries, with version + purpose, only top 10 most-used]

## Open questions / TODOs found in code
[results of grepping `TODO|FIXME|XXX` — top 10 most recent]

## Generated
- Date: [YYYY-MM-DD]
- Method: 4 parallel Explore agents (haiku)
- Source files scanned: [N]
- Generation time: [N] seconds
```

---

## Step 4 — Self-check before saving

| Check | Pass condition |
|---|---|
| All 4 agent outputs synthesized? | yes (no empty section) |
| Components table has > 0 rows? | yes |
| Data model present (or "no DB" stated)? | yes |
| At least 2 business flows? | yes |
| Stack section matches workspace-detect? | yes |

If any fails → re-spawn the relevant agent, do not ship a partial RE doc.

---

## Step 5 — Update brain (cross-link)

If `brain/00-MOC/MOC-Backend.md` or `MOC-Frontend.md` exist, append:

```markdown
- [[RE-YYYY-MM-DD]] — reverse engineering snapshot (auto-generated)
```

Do NOT auto-create DEC notes from RE — RE is descriptive, decisions need human review (use `solution-options` + `brain-capture` for that).

---

## Step 6 — Cache pointer

Update `docs/discovery/.RE-current` (single-line file pointing at latest RE doc):

```
docs/discovery/RE-2026-05-06.md
```

This lets `workspace-detect` quickly answer "is there a fresh RE?".

---

## Output (autopilot status line — required)

```
> reverse-engineer: [N] components, [N] services, [N] flows  ✓
```

Examples:
```
> reverse-engineer: cached RE-2026-04-15 (21d old)  ✓
> reverse-engineer: 12 components, 3 services, 3 flows  ✓
> reverse-engineer: scanning 47 components... ⏳
```

If a step fails (agent error, file write fail) → emit `✗` and BLOCK with diagnosis.

---

## Manual vs autopilot behavior

- Manual mode: same as above; user can review RE doc and request changes via standard completion-format A/B prompt.
- Autopilot mode (per `autonomous-mode.md`): runs through Step 1–6 silently except for ⏳ progress lines on long scans. Phase boundary AFTER this skill completes (orchestrator handles the boundary, not this skill).

---

## Anti-patterns

- ❌ Re-running RE every session — caching exists for a reason
- ❌ Sequential agent spawning when parallel is possible
- ❌ Reading > 50 source files in main session — delegate to sub-agents
- ❌ Skipping the cache pointer file — workspace-detect won't find the RE
- ❌ Editing brain DEC notes from RE — descriptive only, not decisions

---

## Why this exists

Brownfield work without an RE artifact means every task starts with 30 minutes of "let me grep around to remember how this works". A 2-minute parallel scan into a single canonical doc replaces that cost with a one-time generation, used dozens of times across the sprint.
