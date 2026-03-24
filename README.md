# Strava Community Leaderboard

A public weekly leaderboard for exercise clubs. Members connect via Strava OAuth; activities sync hourly to Cloudflare D1; the dashboard is public (no login required).

## Features

- Self-service Strava OAuth connection for club members
- Hourly automatic activity sync from Strava API
- Weekly leaderboard aggregation by distance, duration, and calories
- Activity type filtering: Run, Ride, Walk, Weight Training, Other
- Public dashboard — no login required to view rankings

## Tech Stack

- **Framework:** Next.js 15 (App Router), Edge Runtime
- **Hosting:** Cloudflare Pages via `@cloudflare/next-on-pages`
- **Database:** Cloudflare D1 (SQLite-compatible), binding `DB`
- **Cron:** Cloudflare Cron Triggers (hourly sync)
- **External API:** Strava OAuth 2.0 + Activities API

## Project Structure

```
app/
├── page.tsx                      # Public leaderboard dashboard
├── connect/page.tsx              # Strava connect page
├── api/
│   ├── auth/connect/route.ts     # Initiates Strava OAuth
│   ├── auth/callback/route.ts    # OAuth callback handler
│   ├── sync/route.ts             # Hourly cron sync endpoint
│   └── leaderboard/route.ts     # Public leaderboard API
└── components/                   # UI components

src/lib/
├── strava.ts                     # Strava API helpers
├── leaderboard-service.ts        # Leaderboard aggregation
└── sync/
    ├── sync-service.ts           # Sync orchestration
    ├── token-service.ts          # Token refresh logic
    ├── activity-service.ts       # Fetch activities from Strava
    └── validate-cron-secret.ts   # Timing-safe cron auth

migrations/
└── 0001_init.sql                 # D1 schema (members, tokens, activities)

__tests__/                        # Jest test suite
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Strava API app](https://www.strava.com/settings/api) for OAuth credentials
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) for D1

### Local Setup

```bash
# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
# Fill in STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, CRON_SECRET, NEXT_PUBLIC_APP_URL

# Apply D1 migrations locally
wrangler d1 migrations apply leaderboard-db --local

# Start dev server
npm run dev
```

App runs at `http://localhost:3000`. Members connect at `/connect`.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public URL (e.g. `http://localhost:3000`) |
| `STRAVA_CLIENT_ID` | From [Strava API settings](https://www.strava.com/settings/api) |
| `STRAVA_CLIENT_SECRET` | From Strava API settings |
| `CRON_SECRET` | Random secret to protect the `/api/sync` endpoint |

## Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm test           # Run all tests
npm run typecheck  # TypeScript type check
npm run lint       # ESLint
```

## Database Schema

**`members`** — Club members who have connected via OAuth
- `athlete_id` (PK), `name`, `avatar_url`, `created_at`, `last_synced_at`

**`tokens`** — OAuth credentials per member (auto-refreshed every 6 hours)
- `athlete_id` (PK, FK), `access_token`, `refresh_token`, `expires_at`

**`activities`** — Synced Strava activities
- `id` (PK), `athlete_id` (FK), `type`, `distance_km`, `duration_sec`, `calories`, `activity_date`

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/connect` | GET | Public | Redirects to Strava OAuth |
| `/api/auth/callback` | GET | Public | Handles OAuth callback |
| `/api/leaderboard` | GET | Public | Weekly leaderboard (`?type=Run\|Ride\|...`) |
| `/api/sync` | POST | `Bearer {CRON_SECRET}` | Syncs all member activities |

## Deployment

### Cloudflare Pages

1. **Register Strava App** — set OAuth callback to `https://your-app.pages.dev/api/auth/callback`

2. **Create D1 database:**
   ```bash
   wrangler d1 create leaderboard-db
   # Copy the returned database_id into wrangler.toml
   ```

3. **Apply migrations to production:**
   ```bash
   wrangler d1 migrations apply leaderboard-db
   ```

4. **Set secrets in Cloudflare Pages dashboard:**
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `CRON_SECRET`

5. **Deploy** — connect your Git repo to Cloudflare Pages; it auto-deploys on push.

The cron trigger in `wrangler.toml` fires hourly and calls `POST /api/sync` automatically.

## Strava API Rate Limits

The free Strava API tier allows 1,000 requests/day and 100 requests/15 min. For 20 members syncing hourly:
- 20 members × 24 syncs/day = **480 API calls/day** ✓ safely within limits

## Key Constraints

- **Next.js:** Must stay `≤15.5.2` — `@cloudflare/next-on-pages@1.x` does not support Next.js 16+
- **ESLint:** Pinned to v8 (legacy config) — do not upgrade to ESLint 9+
- **Edge Runtime:** No `node:crypto` — timing-safe comparison uses a manual XOR loop (see `validate-cron-secret.ts`)
- **All API routes** must export `export const runtime = 'edge'`
