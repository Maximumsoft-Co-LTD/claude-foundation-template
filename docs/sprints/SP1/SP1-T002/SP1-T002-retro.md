# SP1-T002 — Strava OAuth Member Connect — Retrospective
**Sprint:** SP1  |  **Date:** 2026-03-24  |  **Status:** done

## Estimate vs Actual
- Estimated: 5 points (medium task)  |  Actual: 1 session (~1 day)  |  Variance: within estimate — 5pt tasks are expected to take 1–2 days; single-session completion is on the fast end but reflects straightforward OAuth plumbing with a well-scoped design doc.

## What went well
- Design docs were precise — endpoint specs, SQL, and error codes were all defined before implementation, so coding was mechanical and fast.
- UPSERT SQL (`ON CONFLICT DO UPDATE`) worked exactly as designed; no schema changes needed.
- `better-sqlite3` shim for D1 was effective — real SQL ran in Jest without any external process.
- TDD red/green discipline held: all 29 tests failed before implementation, all 39 passed after.
- `cloudflare.d.ts` ambient declaration cleanly solved the missing `D1Database` type without adding a package dependency.

## What could be improved
- The `Response.redirect()` relative-URL incompatibility between Edge Runtime and Node.js (Jest) was not anticipated in the design. The connect route initially used `Response.redirect('/connect?error=...')` which throws in Node. A `redirect()` helper returning `new Response(null, { status: 302, headers: { Location } })` is the correct portable pattern — this should be noted in the BE design template for all future edge routes.
- `jest.mock` hoisting rules (factory cannot reference outer-scope variables) cost iteration time on the FE test setup for `ReadonlyURLSearchParams`. The `as unknown as ReadonlyURLSearchParams` cast pattern plus a module-level `ro()` helper is the established pattern going forward.
- `jest.resetModules()` in `beforeEach` was initially combined with lazy `require()` for FE tests, then found to break mock references. Conclusion: for FE component tests with `jest.mock`, use static imports and `mockReturnValue` per test — do not reset modules.

## Issues encountered
- 0 formal /issue tickets raised.
- 3 minor friction points resolved inline:
  1. `@typescript-eslint` eslint rule comments invalid (rule not installed) — removed all such comments.
  2. `D1Database` type not in scope — fixed with project-level `cloudflare.d.ts` ambient shim.
  3. `Response.redirect()` throws on relative URLs in Node — fixed with `new Response(null, { status: 302, headers: { Location } })` helper in both route files.

## TDD effectiveness
- Tests written before implementation: yes — all 29 new tests ran red before any implementation file existed.
- Bugs caught by tests before manual QA: 1 — the `Response.redirect` relative URL issue was exposed by the test suite (BE-T019/T020 failing) before any manual check.
- Gaps in TDD test plan:
  - FE-T009 (`GET /connect` returns HTTP 200) requires a live Next.js server — not runnable in Jest. Acceptable gap; page rendering is covered at the component level by FE-T007/T008.
  - No test for `configuration_error` redirect when env vars are missing in the connect route — minor gap, low risk at this scale.

## Knowledge sharing
- **Portable edge redirect pattern:** Never use `Response.redirect(relativeUrl, 302)` in Next.js edge routes. Use `new Response(null, { status: 302, headers: { Location: relativeUrl } })`. `Response.redirect` requires an absolute URL per spec; relative URLs throw in Node's fetch implementation used by Jest.
- **D1 type shim:** `cloudflare.d.ts` at project root declares `D1Database`, `D1PreparedStatement`, `D1Result` globally. This replaces `@cloudflare/workers-types` until that package is added as a dev dependency.
- **`ReadonlyURLSearchParams` in tests:** Mock `next/navigation` with `jest.mock` at module level; override per test with `mockReturnValue(new URLSearchParams(...) as unknown as ReadonlyURLSearchParams)`. Do not use `jest.resetModules()` alongside static component imports — it breaks the mock reference.
- **D1 shim for Jest integration tests:** `better-sqlite3` wrapping a `makeD1Shim()` function that maps `.prepare().bind().run()` chain to synchronous sqlite3 calls is the established pattern for testing D1 helpers without wrangler.

## Action items for next sprint
- T003 (cron sync) will use the `tokens` table written by T002 — confirm `expires_at` field is being read correctly before implementing token refresh logic.
- Consider adding `configuration_error` test for missing env vars in the connect route — can be added to T003's test file if the route is touched again.
- Add `@cloudflare/workers-types` as a dev dependency when setting up the Cloudflare Pages deploy pipeline (likely T003 or a deploy task) to replace the manual `cloudflare.d.ts` shim.
