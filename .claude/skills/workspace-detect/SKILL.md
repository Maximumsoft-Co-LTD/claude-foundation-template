---
name: workspace-detect
description: Detect greenfield vs brownfield + stack inventory + paused autopilot session — first call in every /dev pipeline
allowed-tools: Read, Grep, Glob, Bash(ls:*), Bash(test:*), Bash(cat:*), Bash(git status:*), Bash(git rev-parse:*), Bash(git log:*)
---

# workspace-detect

Workflow position: **first stage of `/dev` pipeline; also invoked by `/discovery` and `/new-sprint` step 0**

Decides whether the working repo is a fresh greenfield project or an existing brownfield codebase, inventories the stack, and detects any paused autopilot session worth resuming. This drives the rest of the pipeline (e.g. brownfield → trigger `reverse-engineer`).

Arguments: none

---

## When to invoke

- `/dev` step 1 — every autopilot run
- `/discovery` step 0 — manual mode
- `/new-sprint` step 0 — to confirm context
- Manual: when starting work on an unfamiliar repo

Skip: never. This is fast (< 5 sec) and cheap; the cost of skipping it (wrong assumptions about brownfield/greenfield) is much higher.

---

## Step 1 — Resume check

```bash
git rev-parse --abbrev-ref HEAD
ls docs/sprints/*/.autopilot-state.json 2>/dev/null
```

If a state file exists AND was modified within last 7 days → flag `resumable: true` with the state path. The orchestrator will offer `/dev resume` to the user.

---

## Step 2 — Greenfield vs brownfield

Use this evidence chain (stop at first match):

| Evidence | Verdict |
|---|---|
| `docs/sprints/SP*/` exists with ≥ 1 task folder | brownfield |
| `package.json` / `go.mod` / `pyproject.toml` exists AND src files > 5 | brownfield |
| `README.md` describes a real product (not template) | brownfield |
| Repo has > 10 commits authored by humans (not template scaffold) | brownfield |
| None of the above | greenfield |

Output: one of `greenfield` / `brownfield`.

---

## Step 3 — Stack inventory

In parallel, check for stack signals:

```bash
test -f package.json && cat package.json | head -100
test -f go.mod && head -10 go.mod
test -f pyproject.toml && head -20 pyproject.toml
test -f docker-compose.yml && grep -E '^\s+image:' docker-compose.yml
test -f .env.example && grep -oE '^[A-Z_]+' .env.example | head -20
```

Build a structured inventory:

```yaml
backend:
  - go (signal: go.mod present, version 1.22)
  - python (signal: pyproject.toml — secondary service)
frontend:
  - nuxt (package.json: nuxt ^3.x)
db:
  - mongodb (docker-compose: image mongo:7)
realtime:
  - socket.io (package.json: socket.io ^4.x)
auth: (inferred from existing code, may be unknown)
infra:
  - docker-compose
```

If the stack looks unusual (mixes that don't make sense, e.g. Next + Nuxt in same repo) → flag `?` for the orchestrator to ask.

---

## Step 4 — Existing artifacts inventory

Check what prior workflow output exists (informs whether to invoke `reverse-engineer` next):

```bash
ls docs/discovery/RE-*.md 2>/dev/null
ls docs/discovery/disc-*.md 2>/dev/null
ls brain/02-decisions/DEC-*.md 2>/dev/null | wc -l
test -d .claude/skills && ls .claude/skills/ | grep -v _archive | wc -l
```

Output:

```yaml
artifacts:
  reverse_engineering: docs/discovery/RE-2026-04-15.md (21 days old — fresh)
  discovery_docs: 2
  decisions_in_brain: 7
  custom_skills: 20
```

If brownfield AND no RE artifact (or RE > 30 days) → flag `recommend_re: true`.

---

## Step 5 — Active sprint context

```bash
ls docs/sprints/SP*/ 2>/dev/null | sort -V | tail -1
```

If an active sprint exists, read its overview:

```bash
cat docs/sprints/[latest]/SP*-overview.md | head -30
```

Output:

```yaml
active_sprint: SP3
active_sprint_status: in-progress (3/5 tasks done)
last_task: SP3-T012 (committed)
next_task_in_backlog: SP3-T013
```

---

## Step 6 — Output

Concise YAML block (single payload the orchestrator parses):

```yaml
type: brownfield               # or greenfield
resumable: false               # or { state_path: ..., age_hours: ... }
stack:
  backend: [go]
  frontend: [nuxt]
  db: [mongodb]
  realtime: [socket.io]
  infra: [docker-compose]
artifacts:
  reverse_engineering: docs/discovery/RE-2026-04-15.md
  discovery_docs: 2
  decisions_in_brain: 7
active_sprint: SP3
next_task: SP3-T013
recommend_re: false            # true if brownfield && no fresh RE doc
warnings: []                   # any unusual signals
```

Plus the autopilot status line.

---

## Output (autopilot status line — required)

```
> workspace-detect: [type] ([stack summary, ≤ 30 chars])  ✓
```

Examples:
```
> workspace-detect: brownfield (Vue/Nuxt + Go + Mongo)  ✓
> workspace-detect: greenfield (no stack yet)  ✓
> workspace-detect: brownfield, resumable session @ SP3  ✓
> workspace-detect: stack signals conflict (Next + Nuxt)  ?
```

---

## Behavior reference

In manual mode: emit the YAML block + `Output` line, then return control to caller.
In autopilot mode (per `autonomous-mode.md`): same behavior — never blocks; flags `?` only on conflicting stack signals.

---

## Anti-patterns

- ❌ Reading every source file to "really understand" the stack — Step 3 signals are enough
- ❌ Re-running `reverse-engineer` if a fresh RE doc exists — wasteful
- ❌ Auto-resuming a stale (> 7 days) state file without user confirm
- ❌ Marking template scaffolding as "brownfield" — check commit count + file diversity

---

## Why this exists

Without this, every command guesses brownfield/greenfield, mis-routes RE, and re-discovers the stack. Centralizing into one fast skill makes the rest of the pipeline deterministic.
