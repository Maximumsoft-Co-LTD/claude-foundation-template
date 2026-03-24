# SP1 — Cross-Task Context

_Last updated: 2026-03-24 (after T001 plans)_

---

## Shared Terminology

| Term | Canonical Name | Notes |
|------|---------------|-------|
| Database binding | `DB` | wrangler.toml binding name — ALL tasks must use `env.DB` |
| Strava athlete ID | `athlete_id` | INTEGER type — primary key in members + tokens; FK in activities |
| Activity types | `Run`, `Ride`, `Walk`, `WeightTraining`, `Other` | Exact strings from Strava API — used in activities.type column. **Display name mapping**: `WeightTraining` → "Weight" in all UI labels and filter tabs. The URL param stays `?type=WeightTraining`. |
| Timestamps | Unix epoch seconds (INTEGER) | All date/time fields in D1 |
| Weekly range | Monday 00:00:00 UTC → Sunday 23:59:59 UTC | T004 leaderboard uses this definition |

---

## Shared Schema (Owned by T001)

All subsequent tasks READ from and WRITE to this schema. Do not redefine tables — reference T001's migration.

```
members   (athlete_id PK, name, avatar_url, created_at, last_synced_at)
tokens    (athlete_id PK FK→members, access_token, refresh_token, expires_at)
activities(id PK, athlete_id FK→members, type, distance_km, duration_sec, calories, activity_date)
```

`last_synced_at` — set by T003 after each successful member sync; read by T004 to display "Last synced X min ago". NULL until first sync.

Index: `idx_activities_athlete_date ON activities(athlete_id, activity_date)`

---

## Scope Boundaries (no overlap allowed)

| Task | Owns | Does NOT touch |
|------|------|----------------|
| T001 | Schema migrations, wrangler.toml, Next.js scaffold, deploy pipeline | No API routes, no OAuth, no UI beyond index placeholder |
| T002 | Strava OAuth flow, `/api/auth/*` routes, INSERT into members + tokens | No activity sync, no leaderboard query |
| T003 | Hourly cron sync, token refresh, INSERT into activities | No OAuth flow, no UI, no leaderboard aggregation |
| T004 | Public leaderboard page, GET /api/leaderboard, weekly aggregation query | No filtering by type (that's T005), no OAuth |
| T005 | Activity type filter UI + query param on GET /api/leaderboard | No new tables, no OAuth, no sync changes |

---

## API Contracts (updated after each FE design phase)

_T001: No API endpoints._

| Method | Path | Owner task | Request | Response | Notes |
|--------|------|-----------|---------|----------|-------|
| GET | `/api/auth/connect` | T002 | — | redirect to Strava OAuth | — |
| GET | `/api/auth/callback` | T002 | `?code=` | redirect to `/` | stores tokens in D1 |
| POST | `/api/sync` | T003 | — | `{ synced: N }` | cron-triggered, not public |
| GET | `/api/leaderboard` | T004/T005 | `?type=Run` (optional) | leaderboard JSON | public, no auth |

---

## Auth Requirements

| Route | Auth required | Notes |
|-------|--------------|-------|
| `/` | No | Public leaderboard |
| `/connect` | No | Anyone can initiate OAuth |
| `/api/auth/*` | No | OAuth callback is public |
| `/api/leaderboard` | No | Public read |
| `/api/sync` | Cron secret header | Only Cloudflare Cron trigger should call this |

---

## Shared Data Models (FE field names)

_T001 defines DB columns. T002+ FE expects these JSON shapes from API:_

**Member (from GET /api/leaderboard):**
```json
{
  "athlete_id": 12345678,
  "name": "John Doe",
  "avatar_url": "https://...",
  "total_distance_km": 42.5,
  "total_duration_sec": 18000,
  "total_calories": 1500,
  "activity_count": 7
}
```

**Leaderboard response:**
```json
{
  "week_start": "2026-03-23",
  "week_end": "2026-03-29",
  "type_filter": "all",
  "last_synced_at": 1742800000,
  "members": [ /* Member[] sorted by total_distance_km desc */ ]
}
```

`last_synced_at` is `MAX(m.last_synced_at)` from members — the most recent time any member's data was synced. `null` if no syncs have run yet. T004 FE displays "Last synced X min ago" or "Not yet synced".
