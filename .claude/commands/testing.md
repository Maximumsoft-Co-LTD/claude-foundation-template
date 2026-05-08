# /testing
Workflow position: **/code-review → START → /retro-task**

Run the full test suite and verify every AC is covered.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — single unified doc with ACs, TDD + E2E Test Plans (FE and BE), success metrics
- `Execution Slices` + `Plan Drift Guard` — what proof each slice promised before the task can be considered ready


---

## Step 2 — Verify test environment

Confirm test DB/services are available and seeded if needed. Check env vars in the `## BE Environment Variables` section of the requirement doc.
If environment not ready → stop and tell the user what is missing.

**Context7 — fetch test framework docs (if available):**
Identify the project's test runner and E2E framework from the requirement doc's design sections or codebase (e.g. Jest, Vitest, Playwright, Cypress, pytest, go test).
If unfamiliar setup patterns or E2E configuration are involved, follow `.claude/rules/context7-cache.md`:
1. **Cache check** — read `docs/sprints/[sprint-id]/.context7-cache.json`; on hit, reuse and skip both MCP calls below.
2. `mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs` — query for setup, teardown, assertion patterns, and E2E configuration for the detected framework.
3. Append `{libraryId, result, fetchedAt}` to the cache file.
4. Use returned docs to validate test environment configuration before running.

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

Invoke `plan-driven-delivery` in testing mode and verify:
- every slice is present,
- every slice still maps to real tests/evidence,
- there is no unfinished slice hiding behind a green aggregate test run.


---

## Step 4 — Run unit and integration tests

Run task-specific tests first (faster feedback), then full suite.

For each **failing test**:
- Do NOT skip, `.only`, or comment out.
- Code bug → fix the code, not the test.
- Test misunderstands the spec → correct test to match AC, then fix code.

**Bug-handoff loop (single round-trip with /issue):**

1. When a failure is found, invoke `/issue [task-id] "[concise failure description]"` **once per distinct bug** — pass the failing test name, the AC it violates, and the exact failure message.
2. `/issue` performs TDD fix (see its Step 3) and at its final step **re-invokes `/testing [task-id]`** automatically — do not call `/testing` yourself a second time.
3. When `/testing` is re-entered from `/issue`: skip Step 2/Step 2b (env + confidence already verified this run), resume from Step 3 (cross-check coverage) and Step 4 (re-run failing test + full suite).
4. If the re-run is GREEN → continue to Step 5. If still RED on the same test → escalate to `/debug [task-id] [description]` (root-cause investigation) instead of looping `/issue` a second time on the same symptom.

Only one outstanding `/issue` invocation per failure cycle. Multiple bugs in the same run → batch into multiple `/issue` calls before re-running, but never run `/issue` from inside another `/issue`.


---

## Step 5 — Verify test data cleanup

Integration tests must not leave data in shared environments. Confirm teardown/rollback runs after each integration test.


---

## Step 6 — Production readiness gate (E2E + ui-verify + User Journey)

**This is the final gate. E2E tests are mandatory for every non-infra task. `ui-verify` is mandatory for every FE-touching task — this is the workflow position where ui-verify lives.**

### 6a — E2E execution (automated path)

Check if the project has an E2E framework configured (Playwright, Cypress, etc.):

**If E2E framework exists:**
1. Find the corresponding E2E test(s) for each AC — if none exist, **block**: write the test first.
2. Run E2E suite against test/staging (real browser, real API, real DB).
3. Failing test → do NOT skip. Fix code, re-run. Non-trivial fix → `/issue`.
4. Trace each passing test against the User Journey / Feature Flow in the requirement doc:
   - Test passes but skips key journey steps → **not production-ready**. Rewrite the test.
   - Test passes with mocked data or stubbed API → **not production-ready**. Fix to use real deps.

**If no E2E framework exists** → automated coverage of the journey is missing; rely on `ui-verify` (Step 6a-uiverify below) as the sole journey check, AND open a follow-up `/issue` to add an E2E framework before next sprint.

### 6a-uiverify — Manual UI verification via the `ui-verify` skill (FE-touching tasks, MANDATORY)

E2E asserts logic; it does not catch wrong copy, broken layout, or state transitions that *feel* discontinuous. The `ui-verify` skill closes that gap by walking every AC path in a real browser and capturing evidence. **This is the only place in the workflow where `ui-verify` runs — `/implement` does NOT run it.** Required for every task that touches the UI, even when 6a E2E passed.

1. Invoke `Skill("ui-verify")` with `[task-id]`. The skill will:
   - Detect the package manager + stack and start the dev server (or reuse `Skill("local-run")` if already running).
   - Extract the AC checklist from `[task-id]-requirement.md` and write a clickable path per AC.
   - Walk every AC path (click → inspect Network → inspect Console → inspect DOM → refresh).
   - Run the mandatory edge-case rows (empty input, very long input, special chars, slow network, browser-back, refresh, mobile viewport).
   - Verify the FE design's State Inventory (Loading / Empty / Error / Success / Partial-Stale) renders correctly per AC — no flash of wrong state, no stuck spinners, no orphaned stale data after success.
   - Capture screenshots + network logs to `docs/sprints/[sprint-id]/[task-id]/ui-verify/`.
   - Run the automated suite alongside (unit, e2e if configured, typecheck, lint, `go test`, `pytest`).
   - Return verdict `PASS` or `FAIL`.

2. **On FAIL** → BLOCKED. Open `/debug [task-id] [symptom]` on the failing AC. Do NOT proceed to retro/commit. "It's a small thing, I'll fix in next commit" is exactly the failure mode this gate prevents.

   In autopilot mode: ui-verify FAIL is one of the 3 official block conditions per `.claude/rules/autonomous-mode.md` — auto-`/debug`; if `/debug` resolves to GREEN, continue; otherwise BLOCK with diagnosis.

3. **Persist summary** — write `docs/sprints/[sprint-id]/[task-id]/[task-id]-smoke.md` with these sections (required — `/retro-task` Step 1 hard-gates on this file existing):
   - **Walked at** — ISO timestamp, dev server URL.
   - **AC ↔ Smoke Step** table — one row per AC: AC ID, browser route(s) visited, States verified (Loading / Empty / Error / Success / Partial-Stale), screenshot path under `ui-verify/`, verdict (`READY` / `BLOCKED`).
   - **Edge cases** — checkmarks for the seven mandatory rows (empty / long input / special chars / slow network / browser-back / refresh / mobile viewport).
   - **Defects found** — list any defect spotted and its resolution (fix commit ref, follow-up issue ID, or "deferred — see X").
   - **Re-walk date** (if a fix-and-re-walk loop occurred).
   - **Evidence** — link to `docs/sprints/[sprint-id]/[task-id]/ui-verify/` (screenshots + network logs + notes.md produced by the skill).

Skip 6a-uiverify only for: BE-only tasks, infra/docs-only tasks, or non-interactive surfaces (cron, migrations, internal scripts). When skipping, write a one-line `[task-id]-smoke.md` stating the reason — the file must exist either way.

### 6b — Journey tracing (both paths)

After running tests or manual verification, trace each result against the Feature Flow in the requirement doc:
- Verified but skips key journey steps → **not production-ready**. Fix the gap.
- Verified with mocked/stubbed data → **not production-ready**. Fix to use real deps.
- Verified but a slice still lacks its promised exit evidence → **not production-ready**. The plan contract is still open.

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
- [ ] Every execution slice from `[task-id]-requirement.md` is either `done` with evidence or explicitly `BLOCKED`.
- [ ] Every `BLOCKED` entry has a specific reason stated.
- [ ] No AC is marked `READY` if its E2E / Manual verification used mocked or stubbed data.
- [ ] **FE-touching tasks:** Step 6a-uiverify ran (`Skill("ui-verify")` invoked) for every AC — visual correctness, all 5 State Inventory states, transition smoothness verified. Screenshots captured under `docs/sprints/[sprint-id]/[task-id]/ui-verify/`. `[task-id]-smoke.md` summary file written. No AC marked `READY` without ui-verify evidence.
- [ ] **BE-only / infra-only tasks:** `[task-id]-smoke.md` exists with a one-line skip reason (so `/retro-task` Step 1 hard-gate passes).
- [ ] Step numbers in this command file are sequential (1→2→3→4→5→6a/6a-uiverify/6b/6c→7→8) — no gaps.

Fix any issue found before proceeding.

---

## Step 7 — Regression check + Final Verification (Iron Law)

Run the full test suite **NOW** — this is the single authoritative final run:

1. **Run full suite** — do not rely on memory of Step 4.
2. **Confirm** exit code 0, zero failures, zero regressions outside this task's scope.
3. **Trace** every AC to its passing test by name — no AC is "probably covered."
4. Re-read `Execution Slices` and confirm every slice promised proof that now exists.
5. Any newly failing test outside this task's scope → regression → fix before proceeding.

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
  Plan        : [N]/[N] slices done

AC coverage:
  ✓ AC-1: unit ✓  integration ✓  e2e ✓
  ✗ AC-2: unit ✓  integration ✓  e2e ✗ ← missing E2E
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next:
  Failing test → /issue [task-id] [description]   (single round-trip — /issue auto re-runs /testing)
  Persistent failure on same symptom → /debug [task-id] [description]
  Missing coverage → write the missing tests then re-run /testing [task-id]
  All pass, all ACs covered → /retro-task [task-id]   ← recommended (brain-capture)
                            → /git-commit [task-id]    ← canonical 8-command spec next step
```

**Optional skills (insert after all ACs are READY, before /retro-task):**
- `/accessibility-review [task-id]` — WCAG 2.1 AA audit (FE tasks)
- `/test-coverage [task-id]` — coverage gaps mapped to ACs, missing test list
