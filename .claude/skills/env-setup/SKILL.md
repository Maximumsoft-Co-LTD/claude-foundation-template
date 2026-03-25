---
description: Bootstrap dev environment — verify runtime versions, install dependencies, configure env vars, seed DB
allowed-tools: Read, Write, Bash(node --version), Bash(go version), Bash(python --version), Bash(which *), Bash(npm *), Bash(cp *), Bash(cat *)
disable-model-invocation: false
---

# /env-setup
Workflow position: **project clone → START → /discovery**

Set up a working local development environment from scratch. Run once when cloning the project or onboarding a new machine.
Arguments: none  — or `[component]` to set up a specific part (e.g. `db`, `frontend`, `backend`)

---

## Step 1 — Detect project shape

Read `CLAUDE.md` — Architecture and Key Constraints sections.

Scan for project files to determine stack:
```bash
ls package.json go.mod requirements.txt Gemfile Cargo.toml 2>/dev/null
ls docker-compose.yml docker-compose.yaml .env.example .env.sample 2>/dev/null
```

---

## Step 2 — Check runtime versions

Compare installed versions against required versions from CLAUDE.md or lockfiles:

| Runtime | How to check | Typical requirement source |
|---------|-------------|---------------------------|
| Node.js | `node --version` | `.nvmrc`, `package.json engines` |
| Go | `go version` | `go.mod` `go 1.xx` line |
| Python | `python --version` | `.python-version`, `pyproject.toml` |
| Ruby | `ruby --version` | `.ruby-version`, `Gemfile` |
| Docker | `docker --version` | Required for DB/services |

Flag any mismatch as a **blocker** with install instructions. Do not continue setup until runtimes match.

---

## Step 3 — Install dependencies

Run the appropriate install command for each detected package manager:

```bash
# Node
npm install       # or yarn / pnpm install

# Go
go mod download

# Python
pip install -r requirements.txt   # or: pip install -e ".[dev]"

# Ruby
bundle install
```

Report: packages installed, any warnings, any peer dependency issues.

---

## Step 4 — Configure environment variables

Check for `.env.example` or `.env.sample`:

```bash
cp .env.example .env    # if .env doesn't exist
```

Read `.env.example` — for every variable:
- Has a sensible default → already set in `.env`, no action.
- Requires a real value (API key, DB password, secret) → list it as **needs filling**.

Print a checklist:
```
Environment variables to fill in .env:
  [ ] DATABASE_URL — local Postgres connection string
  [ ] JWT_SECRET   — any random string for local dev (min 32 chars)
  [ ] STRIPE_KEY   — test key from Stripe dashboard (optional for most features)
```

Do NOT print example secrets or generate secrets inline — instruct the user to fill them.

---

## Step 5 — Start services

If `docker-compose.yml` or `docker-compose.yaml` present:

```bash
docker compose up -d
```

Wait up to 30s for services to be ready. Check health:
- PostgreSQL: `docker compose ps` → confirm state is `healthy` or `running`
- Redis, Kafka, etc.: same check

If no Docker → list required services and how to start them manually.

---

## Step 6 — Run database migrations and seed

Detect and run migrations:

```bash
# Common patterns — run whichever matches
npm run db:migrate   # Node
go run ./cmd/migrate # Go
python manage.py migrate  # Django
bundle exec rails db:migrate  # Rails
```

If seed data exists:
```bash
npm run db:seed  # or equivalent
```

Report: migrations applied, seed records created.

---

## Step 7 — Verify setup

Run the project's health check or smoke test:

```bash
# Try in order until one works
npm test -- --watchAll=false --passWithNoTests
go test ./... -run TestSmoke
python -m pytest tests/smoke/ -q
```

Also try starting the dev server (non-blocking):
```bash
npm run dev &   # or equivalent — kill after 5s if it starts
```

---

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment setup: [status]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Runtimes:     ✓ Node 22.x  ✓ Docker 27.x
Dependencies: ✓ installed
Env vars:     ✓ .env created — 2 vars need filling (see above)
Services:     ✓ postgres, redis (docker compose)
Migrations:   ✓ 14 applied
Tests:        ✓ 42 passing

Action required:
  [ ] Fill in DATABASE_URL, JWT_SECRET in .env
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next: /discovery [disc-id] [name]
```
