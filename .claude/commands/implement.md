# /implement
Workflow position: **/be-design → START → /issue (loop) → /code-review**

Implement the task following FE and BE design docs. Write failing tests first, then implement until all pass.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`. Register sub-tasks (wire sequentially; mark in_progress/completed at each step):
```
t1 = TaskCreate("[task-id] — impl: load context")
t2 = TaskCreate("[task-id] — impl: pre-implementation check")
t3 = TaskCreate("[task-id] — impl: write failing tests")
t4 = TaskCreate("[task-id] — impl: implement")
t5 = TaskCreate("[task-id] — impl: verify all tests pass")
```
Mark t1 in_progress.

Read **in parallel**:
- `docs/sprints/[sprint-id]/[sprint-id]-overview.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`

Validate:
- Missing requirement or empty ACs → stop: "Run `/requirement [task-id]` first."
- Missing or incomplete design docs → stop: "Run `/fe-design` and `/be-design` first."

Assess parallelization flags:
- `HAS_FE`: FE design has test plan items
- `HAS_BE`: BE design has test plan items
- `SHARED_TYPES`: FE and BE share type/interface definitions
- `HAS_MIGRATION`: BE includes DB migrations

Mark t1 completed, t2 in_progress.

---

## Step 1b — Pre-implementation readiness check

For each AC in requirement: is there at least one test row in FE or BE TDD Test Plan? Flag any AC with no test → **stop**, fix design doc first.

Mark t2 completed, t3 in_progress.

---

## Step 2 — Write failing tests

**If `SHARED_TYPES`:** write shared type/interface files first, then proceed.

**If `HAS_FE` AND `HAS_BE`:** launch 2 parallel sub-agents:

> **Agent A — FE Tests**
> Write all test files from `[task-id]-frontend.md` TDD Test Plan.
> Run FE tests — confirm every new test **fails** (red). Do NOT write implementation code.

> **Agent B — BE Tests**
> Write all test files from `[task-id]-backend.md` TDD Test Plan.
> Run BE tests — confirm every new test **fails** (red). Do NOT write implementation code.

Wait for both agents. Collect red-test confirmation.

**If only `HAS_FE` or only `HAS_BE`:** write all test files sequentially. Confirm all **fail** (red).

Mark t3 completed, t4 in_progress.

---

## Step 3 — Implement

**If `HAS_MIGRATION`:** run DB migrations first in main context.

**If `HAS_FE` AND `HAS_BE`:** launch 2 parallel sub-agents:

> **Agent C — FE Implementation**
> Implement components, routing, state, API calls, loading/error states, analytics, responsive, accessibility per `[task-id]-frontend.md` Implementation Plan.
> Implement only what the design specifies — no extras, no shortcuts.
> Run FE tests after each logical unit. Log any bugs found (do NOT run /issue — report in output).
> Final state: all FE tests green.

> **Agent D — BE Implementation**
> Implement endpoints, validation, service logic, repository, event publishing, caching, logging, security per `[task-id]-backend.md` Implementation Plan.
> Implement only what the design specifies — no extras, no shortcuts.
> Run BE tests after each logical unit. Log any bugs found (do NOT run /issue — report in output).
> Final state: all BE tests green.

Wait for both agents. If either reported bugs → run `/issue [task-id] [description]` per bug.

**If only `HAS_FE` or only `HAS_BE`:** implement sequentially in main context.

Mark t4 completed, t5 in_progress.

---

## Step 4 — Verify

Run full test suite (FE and BE in parallel if separate commands):
1. All new tests must **pass** (green).
2. No existing tests broken.
3. Each AC in requirement has at least one passing test.

Mark t5 completed.

---

## Output

```
✓ Implementation complete: [task-id]
  Tests: [N] passing, 0 failing

ACs covered:
  ✓ AC-1  ✓ AC-2  ✓ AC-3

Next: /code-review [task-id]
```
