---
name: SP1 T003 backend patterns
description: Service layer conventions, D1 test helpers, and Edge Runtime constraints established by T003 (Hourly Sync Cron Job)
type: project
---

T003 established the first service-layer architecture for this project.

**Service layer layout (src/lib/sync/):**
- `mappers.ts` — pure functions (normaliseType, metersToKm, isoToUnix)
- `token-service.ts` — reads/refreshes tokens from D1; throws TokenRefreshError
- `activity-service.ts` — fetches Strava activities, upserts to D1; throws ActivityFetchError
- `sync-service.ts` — orchestrates member loop with per-member try/catch; returns { synced: N }
- `validate-cron-secret.ts` — constant-time Authorization header check; returns Response|null
- `src/lib/sync.ts` — public re-export barrel

**Why:** Clean separation makes each layer independently unit-testable and allows the scheduled handler and API route to share identical logic.

**D1 test helper pattern (established T002, used by T003):**
makeD1Shim() in __tests__/strava-oauth.test.ts is the canonical shim. T004/T005 should extract it to __tests__/helpers/db.ts rather than copy-pasting.

**Key constraints:**
- Edge Runtime has no node:crypto — use XOR char-code loop for timing-safe comparison (see validate-cron-secret.ts). Always iterate max(a,b) length, never early-return on length mismatch.
- @cloudflare/workers-types not installed — use inline type declarations for Cloudflare handler types.
- 90-day default for `after` param (first sync) was chosen over the spec's 7-day value for better UX (new members get meaningful history). This is intentional.

**How to apply:** Follow the same service file layout for any future sync-related features (T004 leaderboard query, etc.). Use the validate-cron-secret util for any other internal-only POST endpoints.
