# SP1-T001 — Backend Design

## Metadata
| Field | Value |
|-------|-------|
| **Requirement** | `docs/sprints/SP1/SP1-T001/SP1-T001-requirement.md` |
| **Points** | 3 |
| **Status** | draft |

## Approach

Infra task: initialize Next.js app + Tailwind, configure Cloudflare D1 via wrangler, write and apply schema migrations, verify Cloudflare Pages deploy pipeline. No API endpoints delivered in this task — endpoints are introduced in T002+.

## Existing Code Context

Greenfield — no existing code. Starting from `create-next-app`.

## API Endpoints

None — T001 delivers infrastructure only. No API routes in this task.

## Data Models

### `members` table
```sql
CREATE TABLE members (
  athlete_id      INTEGER PRIMARY KEY,  -- Strava athlete ID
  name            TEXT    NOT NULL,
  avatar_url      TEXT,
  created_at      INTEGER NOT NULL,     -- Unix epoch seconds
  last_synced_at  INTEGER               -- Unix epoch seconds — set by T003 after each successful sync; NULL until first sync
);
```

### `tokens` table
```sql
CREATE TABLE tokens (
  athlete_id    INTEGER PRIMARY KEY REFERENCES members(athlete_id),
  access_token  TEXT    NOT NULL,
  refresh_token TEXT    NOT NULL,
  expires_at    INTEGER NOT NULL     -- Unix epoch seconds
);
```

### `activities` table
```sql
CREATE TABLE activities (
  id            INTEGER PRIMARY KEY,  -- Strava activity ID
  athlete_id    INTEGER NOT NULL REFERENCES members(athlete_id),
  type          TEXT    NOT NULL,     -- 'Run' | 'Ride' | 'Walk' | 'WeightTraining' | 'Other'
  distance_km   REAL    NOT NULL DEFAULT 0,
  duration_sec  INTEGER NOT NULL DEFAULT 0,
  calories      INTEGER NOT NULL DEFAULT 0,
  activity_date INTEGER NOT NULL      -- Unix epoch seconds (activity start time)
);
CREATE INDEX idx_activities_athlete_date ON activities(athlete_id, activity_date);
```

**Design notes:**
- `athlete_id` is INTEGER (Strava's native ID type)
- All timestamps are INTEGER Unix epoch seconds (SQLite/D1 compatible)
- `activities.type` uses Strava's activity type strings directly
- `members.last_synced_at` is updated by T003 after each successful member sync — T004 reads this to show "Last synced X min ago"
- Index on `(athlete_id, activity_date)` supports weekly leaderboard queries in T004

## Database Migrations

File: `migrations/0001_init.sql`

```sql
-- Migration: 0001_init
-- Creates foundational schema for Strava Community Leaderboard

CREATE TABLE IF NOT EXISTS members (
  athlete_id      INTEGER PRIMARY KEY,
  name            TEXT    NOT NULL,
  avatar_url      TEXT,
  created_at      INTEGER NOT NULL,
  last_synced_at  INTEGER             -- NULL until first sync; updated by T003 each hour
);

CREATE TABLE IF NOT EXISTS tokens (
  athlete_id    INTEGER PRIMARY KEY REFERENCES members(athlete_id) ON DELETE CASCADE,
  access_token  TEXT    NOT NULL,
  refresh_token TEXT    NOT NULL,
  expires_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id            INTEGER PRIMARY KEY,
  athlete_id    INTEGER NOT NULL REFERENCES members(athlete_id) ON DELETE CASCADE,
  type          TEXT    NOT NULL,
  distance_km   REAL    NOT NULL DEFAULT 0,
  duration_sec  INTEGER NOT NULL DEFAULT 0,
  calories      INTEGER NOT NULL DEFAULT 0,
  activity_date INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_athlete_date
  ON activities(athlete_id, activity_date);
```

## Wrangler Configuration

`wrangler.toml`:
```toml
name = "strava-leaderboard"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "leaderboard-db"
database_id = "<your-d1-database-id>"

[vars]
NEXT_PUBLIC_APP_URL = "https://your-pages-url.pages.dev"

# Cron trigger — added in T003
# [triggers]
# crons = ["0 * * * *"]
```

> **Note:** `pages_build_output_dir = ".vercel/output/static"` requires the `@cloudflare/next-on-pages` adapter (see dependencies below). This adapter transforms Next.js output into the format Cloudflare Pages expects.

**Secrets (set via Cloudflare Dashboard or wrangler secret):**
- `STRAVA_CLIENT_ID` — added in T002
- `STRAVA_CLIENT_SECRET` — added in T002

## Environment Variables

| Variable | Description | Required | Where set |
|----------|-------------|----------|-----------|
| `NEXT_PUBLIC_APP_URL` | Public URL of the app | T001 | `wrangler.toml` / `.env.local` |
| `STRAVA_CLIENT_ID` | Strava OAuth app client ID | T002 | Cloudflare secret |
| `STRAVA_CLIENT_SECRET` | Strava OAuth app client secret | T002 | Cloudflare secret |

## Service / Layer Breakdown

```
T001 establishes:
  wrangler.toml → D1 binding (DB) → migrations/0001_init.sql → schema

T002+ will use:
  Next.js API Route → env.DB (D1 binding) → SQL query → response
```

No service/controller layer introduced in T001.

## TDD Test Plan

| Test Case | AC | Type | Description |
|-----------|----|------|-------------|
| Migration applies without error | AC-2 | Integration | Run `wrangler d1 migrations apply DB --local`; assert exit 0 |
| All tables exist after migration | AC-5 | Integration | Query `sqlite_master`; assert members, tokens, activities present |
| members table columns correct | AC-5 | Integration | `PRAGMA table_info(members)`; assert athlete_id, name, avatar_url, created_at, last_synced_at |
| tokens table columns correct | AC-5 | Integration | `PRAGMA table_info(tokens)`; assert athlete_id, access_token, refresh_token, expires_at |
| activities table columns correct | AC-5 | Integration | `PRAGMA table_info(activities)`; assert id, athlete_id, type, distance_km, duration_sec, calories, activity_date |
| Index exists | AC-5 | Integration | Query `sqlite_master WHERE type='index'`; assert idx_activities_athlete_date present |

**TDD rule:** All integration tests run against **real local D1** via wrangler — no mocks.

## Implementation Plan

1. `npx create-next-app@latest . --typescript --tailwind --app --src-dir=false` — scaffold Next.js app
2. Install wrangler: `npm install -D wrangler`
3. Configure `wrangler.toml` with D1 binding `DB`
4. Create `migrations/0001_init.sql` with the SQL above
5. Run `wrangler d1 create leaderboard-db` → copy database_id into `wrangler.toml`
6. Run `wrangler d1 migrations apply DB --local` → verify locally
7. Write integration tests asserting schema (using `wrangler d1 execute DB --local --command`)
8. Confirm `npm run dev` loads on localhost:3000
9. Push to GitHub; connect repo to Cloudflare Pages; verify build passes + public URL returns 200
10. Run `wrangler d1 migrations apply DB` (remote) → verify production D1 schema

## External Dependencies

| Service | Purpose | Failure behavior |
|---------|---------|-----------------|
| Cloudflare Pages | Hosting + deploy pipeline | Build fails → check Pages dashboard logs |
| Cloudflare D1 | SQLite database on edge | Migration fails → check wrangler output, fix SQL |

## Performance Notes

- D1 free tier: 5 GB storage, 25M reads/day, 50k writes/day — more than sufficient for 20 members
- `idx_activities_athlete_date` index ensures T004 weekly queries are efficient
