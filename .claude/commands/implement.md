# /implement
Workflow position: **/be-design → START → /issue (loop) → /code-review**

Implement the task following the FE and BE design docs. Always write failing tests first, then implement until all pass.
Arguments: $ARGUMENTS
Format: `[sprint-id] [task-id]`  — e.g. `sprint-01 task-002`

---

## Step 1 — Load context

Read these files in order:
1. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals and constraints
2. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs and success metrics
3. `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — FE design + TDD test plan
4. `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — BE design + TDD test plan

Validate:
- If either design doc is incomplete or missing → stop: "Run `/fe-design` and `/be-design` first."
- Collect ALL tests from both TDD Test Plans.

---

## Step 2 — Write failing tests

Before writing any implementation code:

1. Create all test files from the combined FE + BE TDD Test Plans.
2. Run the full test suite — confirm every new test **fails** (red).
3. Do NOT write any implementation code until all tests are red.

---

## Step 3 — Implement

Follow the design docs strictly:

- **FE**: implement components, routing, state, API calls, loading/error states, analytics events, responsive behavior, and accessibility as specified in `[task-id]-frontend.md`.
- **BE**: implement endpoints, validation, service logic, repository, migrations, event publishing, caching, logging, and security as specified in `[task-id]-backend.md`.

Rules:
- Implement only what the design specifies — no extras, no shortcuts.
- Run tests after each logical unit of work.
- If you discover a bug or unexpected behavior → run `/issue [sprint-id] [task-id] [description]` and continue.

---

## Step 4 — Verify

1. Run the full test suite — all new tests must **pass** (green).
2. No existing tests may be broken.
3. Confirm each AC in `[task-id]-requirement.md` is covered by at least one passing test.

---

## Step 5 — Output

```
✓ Implementation complete: [sprint-id] [task-id]

Tests: [N] passing, 0 failing

ACs covered:
  ✓ AC-1: [description]
  ✓ AC-2: [description]
  ...

Next step: /code-review [sprint-id] [task-id]
```
