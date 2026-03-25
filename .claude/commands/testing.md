# /testing
Workflow position: **/code-review → START → /retro-task**

Run the full test suite and verify every AC is covered.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs and success metrics
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — TDD + E2E Test Plan tables
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — TDD Test Plan table


---

## Step 2 — Verify test environment

Confirm test DB/services are available and seeded if needed. Check env vars in `[task-id]-backend.md` Environment Variables section.
If environment not ready → stop and tell the user what is missing.


---

## Step 3 — Cross-check TDD coverage

For every row in all TDD and E2E Test Plan tables, verify a corresponding test exists in the codebase. List any **missing tests** — these must be written before proceeding.


---

## Step 4 — Run unit and integration tests

Run task-specific tests first (faster feedback), then full suite.

For each **failing test**:
- Do NOT skip, `.only`, or comment out.
- Code bug → fix the code, not the test.
- Test misunderstands the spec → correct test to match AC, then fix code.
- Non-trivial fix → run `/issue [task-id] [description]`.


---

## Step 5 — Verify test data cleanup

Integration tests must not leave data in shared environments. Confirm teardown/rollback runs after each integration test.


---

## Step 6 — Production readiness gate (E2E + User Journey)

**This is the final gate. E2E tests are mandatory for every non-infra task.**

For each AC in `[task-id]-requirement.md`:

1. Find the corresponding E2E test(s) — if none exist, **block**: write the test first.
2. Run E2E suite against test/staging (real browser, real API, real DB).
3. Failing test → do NOT skip. Fix code, re-run. Non-trivial fix → `/issue`.
4. Trace each passing test against the User Journey / Feature Flow in the requirement doc:
   - Test passes but skips key journey steps → **not production-ready**. Rewrite the test.
   - Test passes with mocked data or stubbed API → **not production-ready**. Fix to use real deps.

Output format:
```
Production Readiness: PASS / FAIL

  AC-1: [description]
    E2E: ✓ passes  |  Journey: ✓ matches  →  READY
  AC-2: [description]
    E2E: ✓ passes  |  Journey: ✗ skips payment step  →  BLOCKED
  AC-3: [description]
    E2E: ✗ no test  →  BLOCKED
```

All ACs must show `READY` before proceeding to `/retro-task`.

---

## Step 8 — Update status and report

Update BACKLOG.md status to `testing`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Results: [task-id]
  Unit        : X passed / Y failed
  Integration : X passed / Y failed
  E2E         : X passed / Y failed

AC coverage:
  ✓ AC-1: unit ✓  integration ✓  e2e ✓
  ✗ AC-2: unit ✓  integration ✓  e2e ✗ ← missing E2E
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next:
  Failing or missing coverage → fix and re-run /testing [task-id]
  All pass, all ACs covered  → /retro-task [task-id]
```

