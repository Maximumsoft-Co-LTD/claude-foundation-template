# mode-testing

Loaded by `plan-driven-delivery` SKILL.md when the caller is `/testing`.

This mode is the completeness gate before a task can be declared ready for `/git-commit`. It requires two independent proofs: AC evidence (every AC has a passing test) and slice evidence (every slice has its promised exit artifact). Tests passing is necessary but not sufficient — the plan contract must also be satisfied.

---

## What this mode reads

- `## Execution Slices` — all slices must be `done`; `Exit evidence` cells must be populated.
- `## TDD Test Plan` — every row must have a corresponding passing test.
- `## E2E Test Plan` — required for 3pt+ or any FE-touching task; journey evidence must exist.
- `## Acceptance Criteria` — the ground truth for what user-visible outcomes are required.
- Test run output (passed to this mode by `/testing` after the suite executes).

---

## What this mode writes

- A testing gate verdict (`PASS` or `FAIL`) with a per-AC and per-slice breakdown.
- Does NOT modify ACs, slices, or tests — it reads and evaluates only.

---

## Step 1 — Verify all slices are done with evidence

For every row in `Execution Slices`:
- `Status` must be `done` (not `planned`, not `doing`).
- `Exit evidence` must contain the promised artifact — not a placeholder and not empty.
- The tests named in `Test-first proof` must appear in the passing test suite.

If any slice is `planned` or `doing`, testing cannot proceed. Return the task to `/implement` for that slice.
If any slice has `Status = done` but its `Exit evidence` is missing, that is a **FAIL** — the slice was marked done without proof.

---

## Step 2 — Verify AC coverage

For every AC in `## Acceptance Criteria`:
- At least one test in the TDD Test Plan must be GREEN and mapped to that AC.
- For ACs that involve user-visible behavior (FE-touching), at least one test must be at integration or E2E level — unit tests alone are not sufficient for UI journeys.

An AC with only passing unit tests but no integration or E2E coverage is a **FAIL** if it describes a user-visible workflow.

---

## Step 3 — Verify E2E / journey evidence (FE-touching tasks)

If the task is 3pt+ or touches any FE component:
- The `## E2E Test Plan` must exist and have at least one row.
- That row's test must be passing.
- `ui-verify` must have been run and returned PASS before this gate is evaluated. If `ui-verify` has not been run, block and request it.

---

## Step 4 — Check for unresolved drift

Scan the requirement doc and the issue log (if any):
- Are there open `/issue` entries that were routed to `/requirement` but the requirement doc was never updated?
- Are there slices that were modified after the plan was written (status rolled back, scope note added) without a corresponding `/requirement` update?

If yes, the task has unresolved drift — declare **FAIL** and describe what needs to be resolved before retesting.

---

## Drift handling for this mode

If testing reveals new work outside the plan — a failing test that was not in the TDD Test Plan, a missing AC — route through the Plan Drift Guard decision:
- In-plan gap (the behavior was always intended but a test row was omitted): add the test row, fix the gap, re-run.
- Material gap (the behavior was never in the plan): return to `/requirement`.

Do not silently patch a missing test by adding a new test without updating the plan contract.

---

## Output handoff

Produces for the caller (`/testing`):

```
plan-driven-delivery (testing): [PASS | FAIL]
Slices done: [N/N]
ACs with proof: [N/N]
E2E / journey: [pass | fail | n/a]
ui-verify: [pass | fail | not run]
Open drift: [none | description]
Blocking items: [none | list]
```

In manual mode, follow with the standard 2-option completion message (A/B) per `.claude/rules/completion-format.md`.
