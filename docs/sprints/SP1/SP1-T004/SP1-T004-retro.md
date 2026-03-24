# SP1-T004 Retrospective — Public Weekly Leaderboard Dashboard

## Metadata

| Field | Value |
|-------|-------|
| **Task** | SP1-T004 |
| **Sprint** | SP1 |
| **Points estimated** | 5 |
| **Status** | done |
| **Completed** | 2026-03-24 |

---

## What Was Built

The public weekly leaderboard page at `/` — the primary user-facing output of SP1. Includes:

- `GET /api/leaderboard` — edge route returning the current week's aggregated activity data from D1, sorted by total_distance_km DESC with total_duration_sec ASC as tiebreaker
- `src/lib/leaderboard-service.ts` — business logic layer (same pattern as sync-service), testable independently of the route
- `src/lib/getCurrentWeekRange.ts` — pure UTC week range calculation (Mon 00:00:00 → Sun 23:59:59)
- `src/lib/formatDuration.ts`, `formatDistance.ts`, `formatCalories.ts` — pure formatting utilities
- `app/components/LeaderboardPage.tsx` — client state machine (loading → loaded | empty | error) with retry
- `app/components/LeaderboardTable.tsx` + `LeaderboardCards.tsx` — responsive: table on md+, cards on mobile
- `app/components/WeekRangeHeader.tsx` — week range + "Last synced X min ago" / "Not yet synced"
- `app/components/MemberRow.tsx`, `MemberCard.tsx` — row and card layouts with accessibility attributes
- `app/components/SkeletonRow.tsx`, `SkeletonCard.tsx` — aria-hidden animated pulse skeletons
- `app/components/EmptyState.tsx`, `ErrorState.tsx` — empty and error states with correct copy
- 28 tests across `leaderboard.test.ts` (BE unit + integration) and `leaderboard-fe.test.tsx` (utility unit + component)

---

## What Went Well

- **Service extraction pattern** — pulling `getLeaderboard()` out of the route into `leaderboard-service.ts` (mirroring T003's `runSync()`) allowed the integration tests to bypass Next.js route transform concerns entirely and test the real DB query directly via the same `makeD1Shim` pattern used in T001–T003. This was the right architectural call.
- **Clean state machine** — the `loading | loaded | empty | error` state model in `LeaderboardPage` is explicit and exhaustive. Every branch is rendered correctly and tested.
- **Responsive without a CSS framework** — Tailwind's `hidden md:block` / `md:hidden` pattern cleanly separates table vs card layout without any JS media query logic.
- **Accessibility built in from the start** — `aria-label` on rank, `alt` on avatars, `aria-hidden` on skeletons, `<caption>` on table, and `<button>` for retry were all included during initial implementation.

---

## What Was Harder Than Expected

- **React "Invalid hook call" in component tests** — The initial test file called `jest.resetModules()` in `beforeEach` for the `LeaderboardPage` describe block and then dynamically `require()`d the component. This caused two copies of React in the same test: `@testing-library/react` held the original instance; the component got a fresh one after `resetModules()`. Fix: use static top-level imports for all components that use hooks; only use dynamic `require()` + `resetModules()` for pure utility functions.
- **`?1`/`?2` numbered SQL params vs `?` anonymous params** — Cloudflare D1 uses `?1`/`?2` numbered bind params, but the `makeD1Shim` wraps better-sqlite3 which is more reliable with plain `?` positional params when called via `stmt.all(...spreadArgs)`. Changed SQL to `?` to ensure shim compatibility and avoid any edge case in how numbered params are resolved when spread.
- **Route handler integration tests vs service tests** — Initial BE tests required the route handler module directly. The route's `export const runtime = 'edge'` and Next.js transform pipeline can be finicky in Jest's node environment (same issue encountered in T003). Resolved by testing the service function directly — consistent with how T003 tests `runSync()` rather than `POST /api/sync`.

---

## Issues Encountered

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| FE tests: "Invalid hook call" (FE-T014, FE-T015) | `jest.resetModules()` before `require()` of a hooks component creates two React instances | Changed to static imports for all components; `resetModules()` only used for pure utility tests |
| BE tests: integration tests failing | Route module import path or `?1`/`?2` SQL param incompatibility with shim | Extracted `getLeaderboard()` into `leaderboard-service.ts`; tests call the service directly; changed SQL to `?` params |

---

## Acceptance Criteria — Final Status

| AC | Description | Status |
|----|-------------|--------|
| AC-1 | Page publicly accessible without login | PASS |
| AC-2 | Current week date range displayed | PASS |
| AC-3 | Members ranked by total_distance_km DESC | PASS |
| AC-4 | Duration formatted as h:mm (no leading zero on hours) | PASS |
| AC-5 | Last synced timestamp shown | PASS |
| AC-6 | Empty state when no members connected | PASS |
| AC-7 | Loading skeleton shown during fetch | PASS |
| AC-8 | Page responsive on mobile (< 768px) | PASS |

---

## Test Coverage Summary

| Suite | Tests | Type | Status |
|-------|-------|------|--------|
| `getCurrentWeekRange` | 5 | unit | passing |
| `getLeaderboard` | 8 | integration (real SQLite) | passing |
| `formatDuration` | 4 | unit | passing |
| `formatDistance` | 2 | unit | passing |
| `formatCalories` | 2 | unit | passing |
| `MemberRow` | 3 | component | passing |
| `WeekRangeHeader` | 2 | component | passing |
| `LeaderboardPage` | 2 | component | passing |
| **Total** | **28** | | |

---

## Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Client-side fetch (not SSR) | Page shell served from Cloudflare edge cache instantly; data loads async. Simple for a single read-only endpoint. |
| Service layer (`leaderboard-service.ts`) | Keeps route handler thin; makes business logic independently testable without Next.js transform overhead. Matches T003's pattern. |
| `?` params in SQL (not `?1`/`?2`) | D1 supports both; plain `?` is what better-sqlite3 handles most reliably when params are spread via the shim. |
| Static imports for component tests | Prevents double-React problem. Utility tests (pure functions) can still use `resetModules()` safely. |
| `aria-hidden` on skeletons | Screen readers should not announce "loading skeleton" rows — they add no informational value and would confuse screen reader users. |

---

## What to Carry Forward

- **Test file structure rule**: Component tests (with hooks) → static imports at top of file. Pure utility tests → dynamic `require()` with `resetModules()` is fine.
- **Service extraction pattern**: All non-trivial route logic should live in a service module testable without the route. Route handler is just env access + service call + error boundary.
- **SQL param style**: Use `?` (anonymous positional) in all D1 queries for better-sqlite3 shim compatibility in tests. D1 accepts both forms.

---

## Story Points Reflection

Estimated 5 pts. Delivered at 5 pts. The implementation volume was correct for 5 points — the FE component tree and accessibility requirements added real breadth, and the test environment issues (two React instances, route module transforms) required debugging that a 3-point task wouldn't have. The service extraction added a file but prevented blocked progress.
