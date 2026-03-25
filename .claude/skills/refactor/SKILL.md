---
description: Safe, test-first refactoring — rename, extract, decompose, or restructure with documented rationale
allowed-tools: Read, Edit, Grep, Bash(git *), Bash(npm test *), Bash(go test *), Bash(python -m pytest *)
disable-model-invocation: false
---

# /refactor
Workflow position: **after /retro-task (when tech debt surfaced) → START → /git-commit**

Safely restructure existing code without changing external behavior. Every refactor starts from green tests and ends at green tests.
Arguments: `[task-id] [refactor-type] [target]`
e.g. `SP2-T005 extract UserValidator from UserService`
e.g. `SP2-T005 rename OrderStatus → OrderState throughout`
e.g. `SP2-T005 decompose processPayment — too many responsibilities`

Refactor types: `extract` · `rename` · `decompose` · `move` · `inline` · `simplify`

---

## Step 1 — Confirm green baseline

Parse `[task-id]`, `[refactor-type]`, `[target]`.

Run full test suite. **If any test is red → stop.** A refactor must start from a clean baseline.

```
Baseline: [N] tests passing, 0 failing
```

---

## Step 2 — Understand the target

Read the file(s) containing `[target]`. Identify:
- All call sites: `grep -rn "[target]"` across the codebase
- Public interface vs internal implementation
- Any tests that directly test the target (will need updating for renames/moves)
- Size: lines of code, number of responsibilities (for decompose)

---

## Step 3 — Write the refactor plan

Before touching any code, write the plan:

```
Refactor: [type] — [target]
Reason:   [why — from retro or code quality concern]

Steps:
  1. [atomic step]
  2. [atomic step]
  3. ...

Files affected: [list]
Call sites to update: [N]
Tests to update: [N]
Breaking change to public API: yes/no
```

Show plan and confirm before proceeding.

---

## Step 4 — Execute atomically

Perform the refactor in the **smallest safe increments**. After each step:
- Run tests — must stay green.
- If a step makes tests red → revert that step immediately, reconsider approach.

**Rename:**
- Update definition, then all call sites, then tests.
- Use search-and-replace only for unambiguous identifiers.

**Extract:**
- Copy to new location first, verify tests pass.
- Then replace original with delegation to new location.
- Then remove delegation once all call sites updated.

**Decompose:**
- Add new units alongside the original (don't delete yet).
- Move responsibility one piece at a time.
- Delete original only when it has no remaining responsibilities.

**Move:**
- Copy to new location, add re-export from old location.
- Update call sites to new import path.
- Remove re-export from old location last.

---

## Step 5 — Verify

Run full test suite after all steps complete.

```
After refactor: [N] tests passing (same as baseline)
Changed files: [list]
```

If any test is red → identify whether it's a test that needs updating (interface changed) or a regression (behavior changed). Fix tests only if the interface change was intentional.

---

## Step 6 — Document

If refactor was prompted by a retro tech debt item — update the relevant `[task-id]-retro.md` to mark it resolved.

If the refactor changes a significant design pattern → consider running `/adr [task-id] [decision-title]`.

---

## Output

```
✓ Refactor complete: [type] — [target]
  Files changed: [N]  |  Call sites updated: [N]  |  Tests updated: [N]
  Baseline: [N] green → After: [N] green  |  Regressions: 0

Next: /git-commit [task-id]
```
