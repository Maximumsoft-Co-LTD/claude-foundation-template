# mode-implement

Loaded by `plan-driven-delivery` SKILL.md when the caller is `/implement`.

This mode is the execution gate for each slice. It tells `/implement` exactly which slice to work next, restricts the work surface to what the plan says, enforces the test-first Iron Law, and records the exit evidence before marking the slice done.

---

## What this mode reads

- `## Execution Slices` — the ordered list of planned checkpoints with `Status`.
- `## Implementation Plan` — the engineering task rows (file paths, layer, AC coverage).
- `## TDD Test Plan` — test names and run commands for the current slice.
- `## Plan Drift Guard` — the rules for this task about what stays in-plan vs returns to `/requirement`.

---

## What this mode writes

- `## Execution Slices` — updates the `Status` column of the current slice to `doing` at start and `done` when exit evidence exists.
- Does NOT modify ACs, the Implementation Plan table, or the TDD Test Plan unless instructed to do so by a drift-handling decision.

---

## Step 1 — Pick the next slice

Read `Execution Slices`. Select the first row where `Status = planned` AND all prior slices are `done`. If two slices are `planned` and neither depends on the other, pick the one that appears first in the table.

Do not skip a `planned` slice unless:
- its entry in `Covers ACs` is a strict subset of an already-`done` slice (rare, but valid after a `/issue` fix).
- the `Plan Drift Guard` explicitly permits reordering.

If no `planned` slice exists and all are `done`, this mode should not be invoked — the task is ready for `/testing`.

---

## Step 2 — Constrain the work surface

For this slice only, work is restricted to:
- The ACs listed in `Covers ACs`.
- The files listed in `Planned files`.
- The tests listed in `Test-first proof`.

Do not touch files outside the slice's `Planned files` list unless:
- The file is a call-site update that is a trivial consequence of the planned file change (e.g., updating an import path).
- The Plan Drift Guard explicitly permits it.

Touching an out-of-scope file without justification is a drift signal — log it and evaluate against the Plan Drift Guard before proceeding.

---

## Step 3 — Write tests first (Iron Law)

Per `.claude/rules/testing.md`:
1. Write the tests named in `Test-first proof` for this slice.
2. Run them and confirm RED. The failure message must match the expected behavior gap — not a syntax error or missing import.
3. Do NOT write any production code until RED is confirmed.

If a test passes immediately (before any production code), the test is testing existing behavior. Fix the test or report the AC as already satisfied.

---

## Step 4 — Implement until GREEN

Write production code scoped to the planned files. Run the slice's tests. Iterate until GREEN.

Do not mark the slice `done` based on GREEN tests alone — GREEN is necessary but not sufficient. The exit evidence must also exist.

---

## Step 5 — Record exit evidence and close the slice

Verify the `Exit evidence` cell for this slice. Collect the named artifact (build log line, screenshot, test output excerpt, audit log row, or whatever was promised). If the exit evidence does not exist, the slice is not done — find out why before declaring completion.

When evidence exists, update the slice row: `Status → done`.

---

## Drift handling for this mode

If during implementation you discover work that cannot be completed without going outside the plan:

- **Same AC, same contract, same outcome, trivial scope**: keep it in the current slice; note the extra file in the slice's `Planned files` cell.
- **New AC needed, API shape change, new risky dependency, or material estimate change**: STOP. Do not continue. Evaluate against the Plan Drift Guard. If it qualifies as material drift, return the task to `/requirement` before writing any more production code.

The cost of returning to `/requirement` is one round-trip. The cost of silently drifting is a review that fails and a requirement doc that no longer describes the code.

---

## Output handoff

Produces for the caller (`/implement`):

```
plan-driven-delivery (implement): S[N] — [goal]
Files: [paths touched]
Tests: [N] RED → [N] GREEN
Exit evidence: [description or "MISSING — blocked"]
Status: doing | done
```

In manual mode, follow with the standard 2-option completion message (A/B) per `.claude/rules/completion-format.md`.
