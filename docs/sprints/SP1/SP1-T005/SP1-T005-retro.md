# SP1-T005 — Activity Type Filter — Retrospective
**Sprint:** SP1  |  **Date:** 2026-03-24  |  **Status:** done

---

## Estimate vs Actual
- **Estimated:** 3 story points (small/medium task)
- **Actual:** 1 session, same day — no multi-day variance
- **Variance:** Within estimate. The 3pt scoping was accurate: the task extended
  two existing files, created two new ones, and required a careful multi-block
  validation refactor found during code review.

---

## What went well

- **Extending without rewriting.** The leaderboard service was already cleanly
  extracted into its own module (T004 pattern), so adding the optional `type`
  parameter required only a targeted SQL string concatenation and a validation
  guard. Zero T004 regressions.
- **URL-as-state pattern.** Using `useSearchParams` + `useRouter` for filter
  state gave shareability for free with no extra client state store. The
  design choice paid off immediately — the FE implementation was straightforward.
- **Parameterized SQL approach.** Appending `AND a.type = ?` as a conditional
  string segment with a corresponding binding kept the query safe against
  injection while staying readable. The `better-sqlite3` shim handled the
  variadic `.bind(...bindings)` spread correctly.
- **T004 regression guard.** Adding the `next/navigation` mock to the existing
  `leaderboard-fe.test.tsx` was identified proactively during implementation
  before tests ran — catching a would-be regression in the existing suite.

---

## What could be improved

- **Route validation logic had a fragility.** The first draft split empty-string
  rejection into a separate second `if` block after the main validation block.
  The two blocks were logically correct due to evaluation order but fragile —
  reordering them would have silently broken empty-string rejection. The code
  review catch consolidated them into a single if/else-if/else. Going forward:
  prefer one complete guard over sequential partial guards.
- **FE TDD plan had two uncovered rows.** The design doc listed "skeleton while
  fetching" and "error banner on 500" as required test cases, but neither was
  written in the initial test pass. Both were added during the testing phase
  (FE-T029, FE-T030). Future implementation passes should tick off every TDD
  plan row explicitly before moving to `/code-review`.

---

## Issues encountered
- **0 issues filed** (no `/issue` calls needed)
- 1 minor: route validation fragility — caught and fixed inline during
  `/code-review` without requiring a separate issue cycle.
- 1 minor: two FE TDD plan rows not initially covered — added during
  `/testing` without requiring a code change.

---

## TDD effectiveness
- **Tests written before implementation:** Yes — all test files were created and
  the failing state was confirmed (via file existence and type-error expectations)
  before any implementation code was written.
- **Bugs caught by tests before manual QA:** 1 — the route validation fragility
  was identified during the review pass of test/implementation alignment,
  not found manually.
- **Gaps in TDD test plan:** 2 gaps found and filled during `/testing`:
  - FE-T029: LeaderboardPage shows generic ErrorState on API 500
  - FE-T030: FilterTabs renders immediately while in loading state

---

## Knowledge sharing

- **`next/navigation` mock pattern for hooks in tests:** Any component that uses
  `useSearchParams()` or `useRouter()` requires a `jest.mock('next/navigation', ...)`
  at the top of its test file. Failure to add this breaks all components that
  statically import the component — including pre-existing test files. When
  T005 added these hooks to `LeaderboardPage`, the T004 `leaderboard-fe.test.tsx`
  needed the mock added retroactively.
- **Route validation structure:** Validate all forms of an input in one
  if/else-if/else block rather than sequential if statements. Sequential guards
  that depend on ordering are a silent bug risk.
- **`?type=all` normalization placement:** The normalization of `all` → `null`
  must happen before (or be incorporated inside) the VALID_TYPES check — not
  after. `all` is not in VALID_TYPES, so checking before normalizing produces
  a false 400.

---

## Action items for next sprint

- When a component gains new hooks (e.g. navigation hooks), scan all existing
  test files that import it and add the required mock immediately.
- Add a checklist item to the `/implement` workflow: after writing tests, tick
  off every row in the FE and BE TDD plan tables before calling tests "complete".
