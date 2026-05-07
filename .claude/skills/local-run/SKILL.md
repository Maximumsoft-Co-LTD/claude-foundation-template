---
description: Start the project's full local dev stack (docker-compose / Go / FE / Mongo / Socket) with healthchecks and seed data — dependency of ui-verify
allowed-tools: Read, Grep, Glob, Bash(docker:*), Bash(docker compose:*), Bash(npm:*), Bash(npx:*), Bash(yarn:*), Bash(pnpm:*), Bash(go run:*), Bash(go build:*), Bash(python:*), Bash(uvicorn:*), Bash(curl:*), Bash(lsof:*), Bash(ss:*), Bash(nc:*), Bash(mongosh:*), Bash(ls:*), Bash(cat:*), Bash(env:*), Bash(diff:*), Bash(grep:*), Bash(sort:*), Bash(cp:*), Bash(node:*), Bash(tail:*)
disable-model-invocation: false
---

# local-run

Workflow position: **before /implement first slice, before /testing, before /ui-verify — anywhere a real running stack is required**

Stack-aware bootstrap: Go (BE) + Vue3/Nuxt/Next (FE) + MongoDB + Socket.io + Python services. Replaces the archived `env-setup`.

Arguments: none (or `[--with=service1,service2]` to limit scope)

---

## When to invoke

- First task in a fresh clone
- After pulling main with new dependencies
- Before `ui-verify` (mandatory dependency — UI can't be verified without it running)
- Before E2E test suite

Skip:
- Stack already running and healthy this session — record and reuse
- Pure-doc task with no code execution

---

## Step 1 — Detect the stack

Read in parallel:

```bash
ls docker-compose.yml docker-compose.*.yml 2>/dev/null
ls package.json go.mod pyproject.toml Pipfile 2>/dev/null
```

Build a stack inventory:

```
Stack inventory:
- BE:        Go (go.mod) + Python (pyproject.toml — secondary service)
- FE:        Nuxt (package.json: "nuxt")
- DB:        MongoDB (docker-compose: mongo:7)
- Realtime:  Socket.io (package.json: "socket.io")
- Compose:   yes (docker-compose.yml + docker-compose.dev.yml override)
```

If no stack signals found → STOP. Ask user for the run command. Do not guess.

---

## Step 2 — Choose the run path

| Signal | Path |
|---|---|
| `docker-compose.yml` exists | `docker compose up -d` (preferred) |
| No compose, multi-service | start each in background: mongo first, then BE, then FE |
| Single Go binary, no deps | `go run ./cmd/[name]` |
| Nuxt only with remote API | `npm run dev` only |

For dev override: if `docker-compose.dev.yml` or `docker-compose.override.yml` exists, include it:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

## Step 3 — Pre-flight env

Read `.env.example` (or `.env.dev`). Compare against existing `.env`:

```bash
diff <(grep -oE '^[A-Z_]+' .env.example | sort) <(grep -oE '^[A-Z_]+' .env 2>/dev/null | sort)
```

Missing vars → list them. Don't auto-fill secrets. Ask via `ask-choice` whether to:
- A) copy `.env.example` to `.env` with placeholders (user fills)
- B) generate dev defaults for non-secret vars only
- C) abort, user will set up manually

---

## Step 4 — Free the ports

Common ports for this stack:
| Service | Default port |
|---|---|
| Mongo | 27017 |
| Go BE | 8080 |
| Nuxt / Next | 3000 |
| Vite (Vue) | 5173 |
| Socket.io | usually piggybacks on BE port |
| Python service | 8000 |

For each port the stack uses:

```bash
lsof -i :PORT 2>/dev/null || ss -tlnp | grep :PORT
```

Collision → STOP and report which PID holds the port. Do NOT auto-kill — the user might be running something intentionally.

---

## Step 5 — Start

Issue the chosen command. Run in background. Capture logs to `/tmp/local-run-[service].log`.

For docker-compose:
```bash
docker compose up -d
docker compose ps
```

For non-compose, in dependency order: DB → BE → FE.

Wait for ready signals (per-service) before declaring up:

| Service | Ready signal |
|---|---|
| Mongo | `mongosh --eval "db.runCommand({ping:1})"` returns 1 |
| Go BE | `curl -fsS http://localhost:8080/healthz` returns 200 |
| Nuxt / Next | Log line "ready" + `curl -fsS http://localhost:3000/` returns 200 |
| Socket.io | `curl -fsS http://localhost:8080/socket.io/?EIO=4&transport=polling` returns handshake |

Timeout per service: 30s. If any service doesn't go ready → diagnose (Step 7).

---

## Step 6 — Seed (if applicable)

If `seeds/` or `scripts/seed.*` exists:

```bash
# Common patterns
node scripts/seed.js
go run ./cmd/seed
python -m scripts.seed
mongosh "$MONGO_URI" seeds/dev.js
```

Confirm at least 1 doc per main collection after seed.

---

## Step 7 — Diagnose failure (if any service didn't go ready)

For each unready service, dump the last 50 lines of its log:

```bash
docker compose logs --tail=50 [service]    # if compose
tail -n 50 /tmp/local-run-[service].log    # if direct
```

Common patterns + the right fix:

| Symptom | Fix |
|---|---|
| `EADDRINUSE` | Port collision — Step 4 should have caught; rerun |
| `MongoNetworkError ECONNREFUSED` | Mongo not ready yet; wait 5s and recheck OR mongo container failed |
| `Cannot find module` | `npm install` not run; run it then retry |
| `panic: ... env var X required` | `.env` missing var; back to Step 3 |
| Cors / 404 on FE→BE | proxy config in nuxt/next not pointing at BE port |

Report the symptom + suggested fix. Do not auto-fix env or schema issues without user confirm.

---

## Step 8 — Persist the session record

Write `/tmp/local-run-status.json`:

```json
{
  "started": "2026-05-06T16:42:00Z",
  "services": {
    "mongo":  { "url": "mongodb://localhost:27017", "healthy": true },
    "be":     { "url": "http://localhost:8080",     "healthy": true },
    "fe":     { "url": "http://localhost:3000",     "healthy": true }
  },
  "logs": "/tmp/local-run-*.log"
}
```

This file is read by `ui-verify` to skip its own startup step.

---

## Output

```
local-run: UP
  mongo:  http://localhost:27017  ✓
  be:     http://localhost:8080   ✓
  fe:     http://localhost:3000   ✓
  socket: ws://localhost:8080     ✓

Logs: /tmp/local-run-*.log
Seed: [N] docs in [collections]
Next: /implement   or   /testing (which invokes ui-verify)
```

If FAIL:

```
local-run: FAIL — [service] not ready
Symptom: [first error from log]
Suggested fix: [from Step 7 table]
Next: fix → invoke local-run again
```

---

## Anti-patterns

- ❌ Auto-killing processes on port collision (might be the user's other work)
- ❌ Auto-generating secrets — always ask
- ❌ Declaring "up" without healthcheck — log line "listening" is not health
- ❌ Skipping seed — empty DB makes ui-verify fail mysteriously

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: full diagnostic output on FAIL.
- **Autopilot mode**: emit `⏳` while bringing services up, `✓` when all healthy. **FAIL is a block condition** — emit `✗` + diagnosis, BLOCK for user (don't auto-fix env or schema issues).

## Output (autopilot status line — required)

`> local-run: UP (mongo, be, fe, socket)  [✓]` or `> local-run: FAIL [service] not ready  [✗]`

Examples:
- `> local-run: UP (mongo:27017, be:8080, fe:3000)  ✓`
- `> local-run: FAIL mongo not ready (auth required)  ✗`

---

## Why this exists

Without this, every `ui-verify` and E2E run starts with "is the dev server even running?" guesswork. Centralizing startup + healthcheck + seed into one deterministic skill removes the 5–10 minutes of friction at the start of every coding session.
