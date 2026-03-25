---
description: Analyse test coverage gaps, map untested paths to ACs, generate prioritised missing test list
allowed-tools: Read, Grep, Bash(npm *), Bash(go tool cover *), Bash(python -m pytest --cov *), Bash(git diff *)
disable-model-invocation: false
---

# /test-coverage
Workflow position: **after /testing → START → /retro-task**
Also useful: **pre-sprint quality gate** or **standalone audit**

Measure actual test coverage, map gaps to ACs, and produce a prioritised list of missing tests.
Arguments: `[task-id]`  — e.g. `SP1-T002`
Or: `[sprint-id]` to audit all tasks in a sprint.

---

## Step 1 — Run coverage report

Detect test runner and run with coverage:

**JavaScript/TypeScript (Jest/Vitest):**
```bash
npm test -- --coverage --coverageReporters=text --watchAll=false
```

**Go:**
```bash
go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out
```

**Python:**
```bash
python -m pytest --cov=src --cov-report=term-missing -q
```

Capture: overall coverage %, per-file coverage, uncovered lines.

If no coverage tool is configured → document the gap and suggest setup. Do not fail the skill.

---

## Step 2 — Load task context

Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — list all ACs.
Read `[task-id]-frontend.md` and `[task-id]-backend.md` — TDD Test Plan tables.

---

## Step 3 — Map coverage gaps to ACs

For each AC, check:
- Is there at least one unit test?
- Is there at least one integration test (real DB/service)?
- Is there at least one E2E test (for non-infra tasks)?

| AC | Unit | Integration | E2E | Coverage % |
|----|------|-------------|-----|------------|
| AC-1: [text] | ✓ | ✓ | ✓ | 94% |
| AC-2: [text] | ✓ | ✗ | ✗ | 61% |
| AC-3: [text] | ✗ | ✗ | ✗ | 12% |

Flag any AC with < 80% coverage or missing a test tier as **gap**.

---

## Step 4 — Identify high-value uncovered paths

From the coverage report, find uncovered lines in the changed files (`git diff main...HEAD --name-only`). Prioritise by:

1. **Error handling paths** — uncovered `catch` blocks, error returns
2. **Boundary conditions** — min/max values, empty inputs, nulls
3. **Auth/permission checks** — uncovered authorization branches
4. **AC-linked code** — functions directly implementing an AC

Skip: getter/setter boilerplate, logging-only lines, generated code.

---

## Step 5 — Generate missing test list

For each gap, write a specific test description (not just "add more tests"):

```
Missing tests (prioritised):

  HIGH — AC gap:
    [ ] AC-2: Integration test — POST /orders with duplicate item SKU returns 409
    [ ] AC-3: E2E — user cannot checkout with out-of-stock item

  MEDIUM — error path:
    [ ] UserService.create() — when DB throws unique constraint violation
    [ ] PaymentGateway.charge() — when gateway returns timeout

  LOW — boundary:
    [ ] order total calculation with 0 items
    [ ] product name longer than 255 chars
```

---

## Step 6 — Write missing tests (optional)

If `--write` flag or user confirms → write the highest-priority missing tests (HIGH only by default).
Follow TDD: write failing test first, confirm it fails, then stop — do not implement to make it pass.

---

## Step 7 — Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coverage Report: [task-id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall:       [N]%  (threshold: 80%)
Changed files: [N]%
AC coverage:   [N/M] ACs fully covered

Gaps: [N] high / [N] medium / [N] low
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next:
  Gaps exist → write missing tests, re-run /test-coverage
  All ACs covered → /retro-task [task-id]
```
