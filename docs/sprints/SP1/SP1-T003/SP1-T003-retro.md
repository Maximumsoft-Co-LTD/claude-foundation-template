# SP1-T003 — Hourly Activity Sync Cron Job — Retrospective
**Sprint:** SP1  |  **Date:** 2026-03-24  |  **Status:** done

## Estimate vs Actual
- **Estimated:** 5 points (~1 day)  |  **Actual:** 1 session (2026-03-24)  |  **Variance:** on estimate

## What went well
- Clean layer separation (mappers → token-service → activity-service → sync-service → route) made each unit independently testable with zero friction.
- TDD cycle was tight: 35 tests written first, all confirmed red (MODULE_NOT_FOUND), then each layer implemented until green. No backtracking required.
- The `better-sqlite3` + `makeD1Shim()` pattern from T002 carried over perfectly — no setup cost for integration tests.
- Per-member isolation (`try/catch` in the `for` loop) was straightforward to implement and straightforward to test — the design made it obvious.
- Constant-time secret comparison implemented correctly on first attempt, including both Buffer (Node) and charCode (Edge Runtime) paths.

## What could be improved
- The design doc (R-8) specified 7-day default for the `after` param, but user instruction specified 90 days. This inconsistency required a review-time decision. Design doc should be updated to reflect the accepted 90-day value before T004 starts.
- The `isoToUnix` test assertion used a hardcoded timestamp (`1742796000`) that was wrong for 2026 — it corresponded to a 2025 date. Caught at first test run but the fix required updating the test to use a dynamic `Date.parse()` assertion. Design docs should not include hardcoded epoch timestamps — use human-readable dates only.
- `functions/scheduled.ts` initially used `ExportedHandlerScheduledHandler` which is not in the project's ambient types. Resolved by declaring the handler with `unknown` event type, but `@cloudflare/workers-types` should be added as a dev dependency before T003 deploys to avoid runtime surprises.

## Issues encountered
- 0 issues filed via `/issue`
- 2 minor failures on first test run (wrong timestamp constant in test assertions) — fixed in < 1 minute by switching to dynamic `Date.parse()` computation
- 1 TypeScript error in `functions/scheduled.ts` (`ExportedHandlerScheduledHandler` not found) — fixed immediately by inlining the type

## TDD effectiveness
- **Tests written before implementation:** yes — all 35 tests written and confirmed red before any implementation file was created
- **Bugs caught by tests before manual QA:** 2 (wrong timestamp constant in test; TypeScript type error in scheduled.ts surfaced by post-write hook)
- **Gaps in TDD test plan:** none — all 23 design TDD plan rows covered; 12 additional tests written for extra isolation scenarios (missing token row, last_synced_at update, 3-member partial-failure count)

## Knowledge sharing
- The `makeD1Shim()` helper from T002's `__tests__/strava-oauth.test.ts` is the established pattern for all D1 integration tests. T004 and T005 should import it rather than redefine it — consider extracting to `__tests__/helpers/d1-shim.ts` as a shared utility.
- `functions/scheduled.ts` does not receive an HTTP request — it receives a Cloudflare `scheduled` event with an `env` object directly. The type `ExportedHandlerScheduledHandler` from `@cloudflare/workers-types` is the correct type but is not yet installed. Until it is, the `unknown` event type + explicit `SyncEnv` parameter pattern works correctly.
- Edge Runtime does not have `node:crypto` `timingSafeEqual` — the fallback char-code XOR loop in `validate-cron-secret.ts` is the correct approach. The length-mismatch case must set `diff = 1` before the loop (not return early) to avoid leaking secret length via timing.
- The 90-day default for `after` on first sync was chosen over the 7-day spec value to ensure new members who just connected via T002 get a meaningful activity history on their first sync. This is the correct UX decision.

## Action items for next sprint
- Extract `makeD1Shim()` and `buildTestDb()` to `__tests__/helpers/db.ts` before T004 test writing begins — avoids copy-paste across 3 test files.
- Add `@cloudflare/workers-types` to devDependencies before the first Cloudflare Pages deploy — gives correct types for `ExportedHandlerScheduledHandler`, `D1Database`, and `Env`.
- Update R-8 in SP1-T003-requirement.md to say "90 days" instead of "7 days" to match implementation.
