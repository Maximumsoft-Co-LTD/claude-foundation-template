# SP1-T001 — Frontend Design

## Metadata
| Field | Value |
|-------|-------|
| **Requirement** | `docs/sprints/SP1/SP1-T001/SP1-T001-requirement.md` |
| **Points** | 3 |
| **Status** | draft |

## Approach

This is an **infra task** — no user-facing UI is delivered in T001. The only frontend deliverable is a bare index page (`/`) that confirms the app is running, to satisfy AC-1 (local dev server) and AC-3 (Cloudflare Pages deploy).

All leaderboard UI, OAuth pages, and filters are delivered in T002–T005.

## Existing Code Context

Greenfield project — no existing code. Starting from `create-next-app` with Tailwind CSS template.

## Component List

| Component | File path | Purpose |
|-----------|-----------|---------|
| `HomePage` | `app/page.tsx` | Bare index page — renders "Strava Leaderboard 🏃" placeholder text; confirms app loads |

No other components needed for this task.

## TDD Test Plan

| Test Case | AC | Type | Description |
|-----------|----|------|-------------|
| Index page renders | AC-1 | Unit | `render(<HomePage />)` — expect heading text present |
| GET / returns 200 | AC-3 | Smoke | HTTP GET to `localhost:3000` — assert 200 status |

## Environment / Config Dependencies

| Variable | Used where | Notes |
|----------|-----------|-------|
| `NEXT_PUBLIC_APP_URL` | `.env.local` | `http://localhost:3000` — no secrets required for T001 |

## Fail State Table

| Scenario | Expected behavior |
|----------|------------------|
| `npm run dev` fails to start | Terminal shows error; fix before proceeding |
| Build fails on Cloudflare Pages | Pages dashboard shows build log; fix env/runtime config |
