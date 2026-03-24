# SP1-T001 — Project Setup + Cloudflare D1 Schema — Retrospective
**Sprint:** SP1  |  **Date:** 2026-03-24  |  **Status:** done

## Estimate vs Actual
- Estimated: 3 points (~1 day)  |  Actual: 1 day (single session)  |  Variance: on target

## What went well
- Migration SQL matched the design doc exactly — no schema changes needed during implementation
- `better-sqlite3` as the integration test driver was a clean choice: runs the real migration SQL against a real SQLite file with zero mocking, perfectly matching the D1 (SQLite-compatible) target
- Test isolation was solid: `beforeAll` creates a fresh DB file in `/tmp`, `afterAll` deletes it — no state bleed between runs
- All 5 ACs mapped cleanly to automated tests; nothing ambiguous in the design
- `export const runtime = 'edge'` on `app/page.tsx` correctly enforces the Cloudflare Pages requirement from day one, before any API routes exist

## What could be improved
- `create-next-app` scaffolding cannot run inside an existing directory with other files — had to scaffold into `/tmp` and `rsync` files across. For future greenfield tasks on this template, document this pattern or use `--force` if the flag ever becomes supported
- `@cloudflare/next-on-pages` does not yet support Next.js 16 (requires `<=15.5.2`). Had to downgrade from the scaffolded Next.js 16 to Next.js 15. Pin this constraint clearly before starting T002
- ESLint versioning required multiple iteration: ESLint 10 broke `eslint-config-next@15` (rushstack patch incompatibility), ESLint 9 did the same. Settled on ESLint 8 with `.eslintrc.json` legacy config. This should be documented for the team
- The FE design doc's "GET / returns 200" smoke test row is not automatable without a running server — the design should clarify this is a manual/CI step rather than a Jest test, to avoid ambiguity for future implementers

## Issues encountered
- 0 total: 0 critical / 0 major / 0 minor (no `/issue` calls needed)
- Two minor findings fixed inline during code review: removed unused `execSync` import; added `@jest-environment node` docblock to migration test

## TDD effectiveness
- Tests written before implementation: yes — both `page.test.tsx` and `migration.test.ts` were written and confirmed RED before any implementation files were created
- Bugs caught by tests before manual QA: 0 (greenfield infra — no logic bugs expected; tests served as specification anchors)
- Gaps in TDD test plan: one — "GET / returns 200" smoke test in FE plan requires a live server and cannot run in Jest; this is a known manual verification step, not an automation gap

## Knowledge sharing
- `@cloudflare/next-on-pages` requires Next.js `>=14.3.0 && <=15.5.2` — always check peer dep range before scaffolding with `create-next-app` (which defaults to latest Next.js)
- ESLint for this project: ESLint 8 + `.eslintrc.json` with `eslint-config-next` (legacy config format). Do not upgrade to ESLint 9/10 until `eslint-config-next` drops the `@rushstack/eslint-patch` dependency
- Migration integration tests use `better-sqlite3` directly against `/tmp/*.db` — not wrangler CLI. This is intentional: wrangler CLI is interactive and hard to drive in Jest; `better-sqlite3` runs the same SQL against a real SQLite engine with full test lifecycle control
- `jest.config.ts` uses `testEnvironment: 'jest-environment-jsdom'` as default for `.tsx` tests; `.ts` integration tests must include `@jest-environment node` docblock to override

## Action items for next sprint
- Before starting T002: run `wrangler d1 create leaderboard-db`, copy the real `database_id` into `wrangler.toml`, and run `wrangler d1 migrations apply DB --local` to verify the local D1 instance matches the migration
- Before starting T002: register the Strava Developer App at `https://www.strava.com/settings/api` to obtain `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`
- Add a `README.md` noting the ESLint 8 pinning and `@cloudflare/next-on-pages` Next.js version constraint, so the next developer doesn't hit the same dependency resolution issues
