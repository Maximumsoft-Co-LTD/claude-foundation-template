---
description: Write the failing test that reproduces a reported bug — minimal input, exact expected, verified RED — before any fix code is written
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git log:*), Bash(git diff:*), Bash(npm test:*), Bash(go test:*), Bash(pytest:*)
disable-model-invocation: false
---

# bug-repro

Workflow position: **inside `/issue` Step 2 (after triage, before fix) and `/debug` Phase 1 (after reproduce, before hypothesize) — produces the regression test that locks the bug**

Different from `tdd-plan`:
- `tdd-plan` = new feature, plans tests from ACs upfront
- `bug-repro` = existing feature, writes ONE failing test that reproduces an observed defect

Different from the `debug` skill:
- `debug` = full root-cause investigation (hypothesize, isolate, fix)
- `bug-repro` = the artifact step: the failing test itself

Arguments: `[issue-id]` or `[task-id]` (whichever the bug is tracked under)

---

## Iron rule

**No fix code is written until a failing test exists, has been run, and was observed to fail with the expected signature.**

Per `.claude/rules/testing.md`: "A bug fix always starts with a failing test that reproduces the bug before touching the implementation."

If the bug "can't be tested" — the bug is reported wrong, or the design is too coupled. Fix that first.

---

## When to invoke

- `/issue` Step 2 — after triage classifies the issue as `bug` (not feature/refactor)
- `/debug` Phase 1 — after manual reproduce, before hypothesis
- Any time the user says "this is broken" / "X doesn't work" / "regression"

Skip:
- Pure styling / copy bugs with zero behavior — visual diff is enough
- Bugs in third-party code outside the repo

---

## Step 1 — Capture the observed defect

Read the issue/user report and pin down 4 fields:

| Field | What goes here | Example |
|---|---|---|
| **Trigger** | The smallest input/action that reproduces it | `POST /orders {qty: 0}` |
| **Observed** | What actually happens (the bug) | `500 + stack trace` |
| **Expected** | What should happen | `400 + {field:"qty"}` |
| **Contract** | The doc/spec/AC that says expected is correct | `requirement-T042 AC3` |

If any field is unknown — STOP. Ask for clarification before writing a test (per `confidence-gate.md`).

---

## Step 2 — Find the minimal repro

Aggressively reduce the trigger:

- Strip optional fields one by one — does the bug still reproduce?
- Reduce to one user, one record, one tenant
- Remove unrelated flags / feature toggles
- Replace timing/concurrency with the simplest deterministic order

Goal: a repro that fits in ≤ 10 lines of test code. If you can't get there, the test will be flaky — split the bug into smaller pieces first.

---

## Step 3 — Choose the test layer

| Bug surface | Test layer |
|---|---|
| API returns wrong status / body | BE integration (real DB, real HTTP) |
| Logic returns wrong value (no I/O) | BE unit |
| DB query returns wrong rows | BE integration |
| UI shows wrong state | FE component or e2e |
| Race condition / concurrent writes | BE integration with explicit ordering |

Default to the **lowest** layer that reproduces it. A unit test is faster + cheaper than e2e — only go higher if the bug only manifests across boundaries.

---

## Step 4 — Write the failing test

Test name format: `[layer]_reproduces_[issue-id]_[short-behavior]`

Example: `be_int_reproduces_BUG-042_zero_qty_returns_500_should_be_400`

The test asserts the **EXPECTED** behavior (per contract), not the observed bug. The bug is what makes it fail right now.

```typescript
// orders.bug-042.test.ts
test('be_int_reproduces_BUG_042_zero_qty_rejected_with_400', async () => {
  const res = await POST('/orders', { qty: 0, productId: 'p1' });
  expect(res.status).toBe(400);              // contract: validation error
  expect(res.body.field).toBe('qty');        // contract: field-level error
  // CURRENT BUG: returns 500 with stack trace, no field info
});
```

Add a 1-line comment linking the issue/bug ID. No more — the test name carries the rest.

---

## Step 5 — Verify RED with the right signature

Run the test. It MUST fail. But not just any failure:

| Failure mode | Action |
|---|---|
| Fails with the bug's exact signature (e.g. `expected 400, got 500`) | ✅ Proceed to fix |
| Fails with setup error (missing import, undefined fixture) | ❌ Fix setup, re-run |
| Fails with unrelated assertion (e.g. timeout) | ❌ Test isn't testing the right thing — rewrite |
| Passes immediately | ❌ Bug isn't reproduced — repro is wrong |

Capture the failure output verbatim into the issue/task doc — that's the "before" state.

Per `testing.md`: "Test must fail (not error from typos or missing imports — those are setup bugs, not RED)."

---

## Step 6 — Append to the regression suite

Co-locate the test file with the source file (per `testing.md` naming rule).

Add a row to `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` TDD Test Plan (or the issue doc, if no requirement exists yet):

```markdown
| # | AC | Test name | Layer | Input | Expected | Boundary covered | Origin |
|---|----|-----------|-------|-------|----------|------------------|--------|
| R1 | regression | be_int_reproduces_BUG_042_zero_qty_rejected_with_400 | BE int | `{qty:0}` | 400 + field=qty | qty=0 (boundary) | BUG-042 |
```

The `Origin` column distinguishes regression rows from feature rows.

---

## Step 7 — Hand off to the fix

The repro test is RED. Now `/implement` (or the fix step in `/issue`) writes implementation code until the test goes GREEN. While doing so:

- **Do not modify the test** to make it pass — that's testing-after via the back door
- **Do not skip the test** if it's "in the way"
- **Run the full suite** after the fix to confirm no regression elsewhere (per `testing.md`)

If the fix requires changing the contract (the expected behavior) — STOP. The contract change is a different decision and needs `/requirement` or `solution-options`, not a silent test rewrite.

---

## Output

```
bug-repro: [issue-id]
Test added: [path/to/test.ts] — [test_name]
Layer: [BE unit | BE int | FE comp | FE e2e]
RED verified: [actual failure signature, 1 line]
Regression row appended: [requirement.md path]

Next: write fix. Do not touch the test until it goes GREEN.
```

End with the standard 2-option completion (per `completion-format.md`):

```
Next: choose one
A) Request changes — describe what to revise
B) Continue to /implement (fix the bug)
```

---

## Anti-patterns

- ❌ Writing the fix first, then "adding a test" — banned by `testing.md` Iron Law
- ❌ Test that asserts the bug ("expects 500") — locks the bug in forever
- ❌ Test that passes immediately — repro is wrong, fix it before moving on
- ❌ Skipping verify-RED — without it you don't know the test tests anything
- ❌ Mock-heavy unit test for an integration bug — won't reproduce the real failure
- ❌ Multiple bugs in one test — split them, one test per defect

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: write test + run it + report RED + 2-option completion
- **Autopilot mode**: emit status line + return. Block ONLY if Step 1 has unknowns (Trigger/Observed/Expected/Contract missing — flag `?` for orchestrator)

## Output (autopilot status line — required)

`> bug-repro: [test-name] RED ([failure-signature, ≤30 chars])  [✓|?|✗]`

Examples:
- `> bug-repro: zero_qty_400 RED (got 500, want 400)  ✓`
- `> bug-repro: blocked — Expected unknown  ?`

---

## Why this exists

Without an artifact step, "write the failing test first" is a slogan. With this skill, the test is a tracked deliverable — name, location, RED signature, regression row — and `/issue` / `/debug` can verify it exists before allowing fix code. This is the gate that makes TDD enforceable on bug fixes, not just features.
