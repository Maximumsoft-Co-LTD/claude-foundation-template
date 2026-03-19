# /testing
Workflow position: **/code-review → START → /retro**

Run the full test suite and verify every AC is covered.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs and success metrics
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — TDD Test Plan table + E2E Test Plan table
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — TDD Test Plan table

---

## Step 2 — Verify test environment

Before running tests, confirm:
- Test DB or services are available and seeded if needed.
- Environment variables for test mode are set (refer to Environment Variables section in `[task-id]-backend.md`).

If environment is not ready → stop and tell the user what is missing.

---

## Step 3 — Cross-check test coverage

For every row in the TDD Test Plan tables (FE + BE) and the E2E Test Plan table, verify a corresponding test case exists in the codebase.
List any **missing tests** — these are gaps that must be filled before proceeding.

---

## Step 4 — Run tests

Run tests using the command in CLAUDE.md:
1. Run task-specific tests first (faster feedback).
2. Run the full suite to catch regressions.

For each **failing test**:
- Do NOT skip, `.only`, or comment out.
- Code bug → fix the code (not the test).
- Test misunderstands the spec → correct the test to match the AC, then fix the code.
- Non-trivial fix → run `/issue [task-id] [description]`.

---

## Step 5 — Verify test data cleanup

- Integration tests must not leave data in shared environments.
- Confirm teardown/rollback runs after each integration test.

---

## Step 6 — Run and verify E2E tests

E2E tests are **mandatory** for every non-infra task. They are not optional.

1. Read the **E2E Test Plan** table in `[task-id]-frontend.md`.
2. Verify every row in that table has a corresponding E2E test in the codebase.
3. Run the E2E suite against the test/staging environment (real browser, real API, real DB).
4. For each failing E2E test:
   - Do NOT skip or comment out.
   - Fix the code, then re-run.
   - Non-trivial fix → run `/issue [task-id] [description]`.
5. If an AC has no E2E scenario at all → **block the task** and write the missing test before continuing.

---

## Step 7 — Report results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Results: [task-id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unit tests       : X passed / Y failed / Z skipped
Integration tests: X passed / Y failed / Z skipped
E2E tests        : X passed / Y failed / Z skipped
Coverage         : X% (if available)

AC coverage:
  ✓ AC-1: unit ✓  integration ✓  e2e ✓
  ✗ AC-2: unit ✓  integration ✓  e2e ✗ ← missing E2E scenario

Missing from TDD / E2E Test Plan:
  - [test case not yet implemented]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 8 — Update status and output next step

1. Update task status in `docs/BACKLOG.md` to `testing`.
2. Output:

```
Next step:
  Tests failing or ACs not covered → fix and re-run /testing [task-id]
  All tests pass and all ACs covered → /retro-task [task-id]
```
