# Product Backlog

## Status Legend
| Status | Meaning |
|--------|---------|
| `discovery` | Active discovery session in progress |
| `backlog` | Discovery done, ready for sprint planning |
| `todo` | Planned into a sprint, not started |
| `in-progress` | Currently being worked on |
| `blocked` | Blocked by issue or dependency |
| `review` | In code review |
| `testing` | In QA/testing phase |
| `done` | Complete |

---

## Discovery Backlog

| ID | Title | Status | Date | Open Questions | Doc |
|----|-------|--------|------|----------------|-----|
| disc-001 | Strava Community Leaderboard | `backlog` | 2026-03-24 | 0 — all resolved | [disc-001](discovery/disc-001-strava-leaderboard.md) |

---

## SP1 — Strava Community Leaderboard — v1
> `docs/sprints/SP1/SP1-overview.md`

| Task | Title | Depends On | Points | Status | Priority | Assigned |
|------|-------|------------|--------|--------|----------|----------|
| SP1-T001 | Project Setup + Cloudflare D1 Schema | — | 3 | `done` | high | - |
| SP1-T002 | Strava OAuth Member Connect | SP1-T001 | 5 | `done` | high | - |
| SP1-T003 | Hourly Activity Sync Cron Job | SP1-T002 | 5 | `done` | high | - |
| SP1-T004 | Public Weekly Leaderboard Dashboard | SP1-T003 | 5 | `done` | high | - |
| SP1-T005 | Activity Type Filter | SP1-T004 | 3 | `done` | med | - |

---

## Done

| Task | Sprint | Title | Completed |
|------|--------|-------|-----------|
| SP1-T001 | SP1 | Project Setup + Cloudflare D1 Schema | 2026-03-24 |
| SP1-T002 | SP1 | Strava OAuth Member Connect | 2026-03-24 |
| SP1-T003 | SP1 | Hourly Activity Sync Cron Job | 2026-03-24 |
| SP1-T004 | SP1 | Public Weekly Leaderboard Dashboard | 2026-03-24 |
| SP1-T005 | SP1 | Activity Type Filter | 2026-03-24 |
