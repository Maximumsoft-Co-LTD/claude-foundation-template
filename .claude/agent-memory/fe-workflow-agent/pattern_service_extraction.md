---
name: service_extraction_for_testing
description: Extract route business logic into a service module so integration tests can bypass Next.js route transforms
type: feedback
---

Never test DB query logic through the Next.js route handler module in Jest. Instead, extract the logic into a service module (e.g. leaderboard-service.ts) and test the service directly.

**Why:** Next.js route files with `export const runtime = 'edge'` can have transform issues when required in Jest's node environment. T003 sync-service.ts pattern works reliably; leaderboard-service.ts follows the same approach.

**How to apply:**
- Route handler: thin — env access, call service, return Response
- Service module in src/lib/: all business logic, DB queries, data shaping
- Integration tests: import and call service function directly with makeD1Shim(db)
- This matches the existing pattern: runSync() in sync-service.ts tested in sync.test.ts
