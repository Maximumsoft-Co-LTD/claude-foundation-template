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

**Context7 — fetch test framework docs (if available):**
Identify the project's test runner and E2E framework from the design docs or codebase (e.g. Jest, Vitest, Playwright, Cypress, pytest, go test).
If unfamiliar setup patterns or E2E configuration are involved:
1. `mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs` — query for setup, teardown, assertion patterns, and E2E configuration for the detected framework.
2. Use returned docs to validate test environment configuration before running.

If context7 is not available, proceed using existing codebase test patterns.


---

## Step 2b — Confidence Gate

Assess confidence that you can run and verify the full test suite for this task based on all context loaded so far.

Key dimensions:
- Test environment ready — DB, services, env vars confirmed?
- ACs loaded — every AC clear enough to trace to a test?
- TDD/E2E test plan rows understood — you know what tests should exist?
- Test framework setup understood — how to run, what output to expect?
- Regression scope clear — full suite location known?

**>= 90%** → proceed to Step 3.
**< 90%** → **STOP.** State what you know, what you don't, and what you need. Do NOT run tests until confidence reaches 90%. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

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

### 6a — Determine E2E execution method

Check if the project has an E2E framework configured (Playwright, Cypress, etc.):

**If E2E framework exists:**
1. Find the corresponding E2E test(s) for each AC — if none exist, **block**: write the test first.
2. Run E2E suite against test/staging (real browser, real API, real DB).
3. Failing test → do NOT skip. Fix code, re-run. Non-trivial fix → `/issue`.
4. Trace each passing test against the User Journey / Feature Flow in the requirement doc:
   - Test passes but skips key journey steps → **not production-ready**. Rewrite the test.
   - Test passes with mocked data or stubbed API → **not production-ready**. Fix to use real deps.

**If no E2E framework exists → Manual browser verification (mandatory):**
1. Ask user for the running app URL (local or staging). If not provided, stop and request it.
2. For each AC in `[task-id]-requirement.md`, execute the GIVEN/WHEN steps manually using browser automation tools (`mcp__claude-in-chrome__*`):
   - Navigate to the relevant page
   - Perform exactly the actions described in WHEN
   - Capture a screenshot and verify the THEN outcome is visually and functionally correct
   - Verify against real data (no stubs, no mocks)
3. If any AC cannot be verified because the feature is broken → **BLOCKED**. Fix code, re-verify.
4. Record each AC result with screenshot evidence in the output.

### 6b — Journey tracing (both paths)

After running tests or manual verification, trace each result against the Feature Flow in the requirement doc:
- Verified but skips key journey steps → **not production-ready**. Fix the gap.
- Verified with mocked/stubbed data → **not production-ready**. Fix to use real deps.

Output format:
```
Production Readiness: PASS / FAIL

  AC-1: [description]
    E2E / Manual: ✓ passes  |  Journey: ✓ matches  →  READY
  AC-2: [description]
    E2E / Manual: ✓ passes  |  Journey: ✗ skips payment step  →  BLOCKED
  AC-3: [description]
    E2E / Manual: ✗ no test / not verified  →  BLOCKED
```

All ACs must show `READY` before proceeding to `/retro-task`.

---

## Step 6c — Self-check before regression

Re-read the Production Readiness output just written and verify:
- [ ] Every AC from `[task-id]-requirement.md` appears in the output — none silently skipped.
- [ ] Every `BLOCKED` entry has a specific reason stated.
- [ ] No AC is marked `READY` if its E2E / Manual verification used mocked or stubbed data.
- [ ] Step numbers in this command file are sequential (1→2→3→4→5→6a/6b/6c→7→8) — no gaps.

Fix any issue found before proceeding.

---

## Step 7 — Regression check + Final Verification (Iron Law)

Run the full test suite **NOW** — this is the single authoritative final run:

1. **Run full suite** — do not rely on memory of Step 4.
2. **Confirm** exit code 0, zero failures, zero regressions outside this task's scope.
3. **Trace** every AC to its passing test by name — no AC is "probably covered."
4. Any newly failing test outside this task's scope → regression → fix before proceeding.

If you're about to write "should pass" or "probably fine" → **STOP**. Run the command first.

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

**Optional skills (insert after all ACs are READY, before /retro-task):**
- `/accessibility-review [task-id]` — WCAG 2.1 AA audit (FE tasks)
- `/test-coverage [task-id]` — coverage gaps mapped to ACs, missing test list

