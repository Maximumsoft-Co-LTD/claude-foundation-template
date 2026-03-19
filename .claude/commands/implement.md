# /implement
Workflow position: **/be-design → START → /issue (loop) → /code-review**

Implement the task following the FE and BE design docs. Always write failing tests first, then implement until all pass.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Read all files **in parallel**:
- `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals and constraints
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs and success metrics
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — FE design + TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — BE design + TDD test plan

Validate:
- If either design doc is incomplete or missing → stop: "Run `/fe-design` and `/be-design` first."
- Collect ALL tests from both TDD Test Plans.

**Assess parallelization scope:**
Determine which of the following apply — this drives the strategy below:
- `HAS_FE`: frontend design doc has test plan items
- `HAS_BE`: backend design doc has test plan items
- `SHARED_TYPES`: FE and BE share type/interface definitions that must be established first
- `HAS_MIGRATION`: BE includes DB migrations that must run before other BE work

---

## Step 2 — Write failing tests

**If `HAS_FE` AND `HAS_BE` (and no `SHARED_TYPES` blocker):**

Launch **2 sub-agents in parallel**:

> **Agent A — FE Tests**
> Write all test files from `[task-id]-frontend.md` TDD Test Plan.
> Run FE tests — confirm every new test **fails** (red).
> Do NOT write any implementation code.

> **Agent B — BE Tests**
> Write all test files from `[task-id]-backend.md` TDD Test Plan.
> Run BE tests — confirm every new test **fails** (red).
> Do NOT write any implementation code.

Wait for both agents to complete, then collect their red-test confirmation.

**If `SHARED_TYPES`:**
Write shared type/interface files first, then launch agents A and B above.

**If only `HAS_FE` or only `HAS_BE`:**
Write all test files sequentially in main context. Confirm all tests **fail** (red).

---

## Step 3 — Implement

**If `HAS_MIGRATION`:**
Run DB migrations first in main context before launching implementation agents.

**If `HAS_FE` AND `HAS_BE` (and FE/BE are interface-stable):**

Launch **2 sub-agents in parallel**:

> **Agent C — FE Implementation**
> Implement components, routing, state, API calls, loading/error states, analytics events, responsive behavior, and accessibility as specified in `[task-id]-frontend.md`.
> Implement only what the design specifies — no extras, no shortcuts.
> Run FE tests after each logical unit. If a bug or unexpected behavior is found, log it (do NOT run /issue — report it back in output).
> Final state: all FE tests green.

> **Agent D — BE Implementation**
> Implement endpoints, validation, service logic, repository, event publishing, caching, logging, and security as specified in `[task-id]-backend.md`.
> Implement only what the design specifies — no extras, no shortcuts.
> Run BE tests after each logical unit. If a bug or unexpected behavior is found, log it (do NOT run /issue — report it back in output).
> Final state: all BE tests green.

Wait for both agents. If either agent reported bugs/unexpected behavior → run `/issue [task-id] [description]` for each one, then continue.

**If only `HAS_FE` or only `HAS_BE`:**
Implement sequentially in main context following the relevant design doc.

---

## Step 4 — Verify

Run the full test suite (**FE and BE in parallel** if separate test commands exist):
1. All new tests must **pass** (green).
2. No existing tests may be broken.
3. Confirm each AC in `[task-id]-requirement.md` is covered by at least one passing test.

---

## Step 5 — Output

```
✓ Implementation complete: [task-id]

Tests: [N] passing, 0 failing

ACs covered:
  ✓ AC-1: [description]
  ✓ AC-2: [description]
  ...

Next step: /code-review [task-id]
```
