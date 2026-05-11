# mode-code-review

Loaded by `plan-driven-delivery` SKILL.md when the caller is `/code-review`.

This mode is the plan-compliance gate during code review. Its purpose is not to judge code quality (that belongs to the broader review) but to detect whether the diff is faithful to the plan contract. A diff that is clean but silent about plan drift is a failing review.

---

## What this mode reads

- The git diff (already loaded by `/code-review`).
- `## Execution Slices` — every slice that should be `done` by this diff.
- `## Implementation Plan` — the engineering rows with their file paths.
- `## Acceptance Criteria` — the user-visible outcomes.
- `## Plan Drift Guard` — this task's rules for what counts as material drift.

---

## What this mode writes

- Review findings, categorized as `Critical`, `Minor`, or `Suggestion`.
- Does NOT modify the requirement doc — findings are reported to the reviewer; the reviewer decides whether to return to `/requirement`.

---

## Step 1 — Map every changed file to a plan row

For every file in the diff, find its corresponding row in the `Implementation Plan`. A file that appears in the diff but in no plan row is an automatic **Critical** finding.

Exception: call-site updates that are a trivial mechanical consequence of a planned change (e.g., updating a renamed import across the codebase) may be flagged as `Minor` rather than `Critical` if the impact is clearly bounded.

---

## Step 2 — Check slice completeness

For every slice that should be `done` based on the diff:
- Is `Status` actually `done`?
- Does the `Exit evidence` cell contain the promised artifact?
- Does the TDD Test Plan row for this slice have a corresponding passing test in the diff?

A slice with `Status = planned` in a diff that obviously implements it is a **Critical** finding — either the status was not updated or the slice was not actually completed.

---

## Step 3 — Check AC coverage

For every AC in the requirement doc, find at least one passing test in the diff (or in the existing test suite) that covers it. An AC with no proof path is a **Critical** finding.

---

## Step 4 — Detect unrecorded drift

Look for signs that the plan contract was silently changed during implementation:
- New files in the diff that are not in any slice's `Planned files` and are not trivial call-site updates.
- API shape changes that are not reflected in the requirement doc's `## API Contract` or slice rows.
- New migrations, permission changes, or external dependencies that did not go through `/requirement`.
- Scope added during implementation that is not referenced by any AC.

Any of these is a **Critical** finding. The review must not pass until either (a) the requirement doc is updated to reflect the actual work, or (b) the out-of-scope code is removed.

---

## Findings classification

| Class | When to use |
|---|---|
| `Critical` | Diff breaks the plan contract, hides material drift, or an AC has no proof path. Review cannot pass. |
| `Minor` | Code is in-plan but implementation is incomplete, weak, or missing a non-critical exit evidence item. |
| `Suggestion` | Polish inside a valid slice — naming, clarity, optional improvement. Does not block passing. |

Missing `impact-map` coverage or missing `risk-register` evidence (for changes that required them) are automatic **Critical** findings per `.claude/rules/workflow.md`.

---

## Drift handling for this mode

If the review uncovers material drift, the finding is `Critical` and the resolution path is:
1. Author returns to `/requirement` and updates the plan contract to match the actual work.
2. Review re-runs after the requirement doc is updated.

Do not accept a diff that changed the plan contract without re-running through `/requirement` — even if the new direction is clearly better. The process gate exists to keep the doc and code synchronized.

---

## Output handoff

Produces for the caller (`/code-review`):

```
plan-driven-delivery (review): [PASS | FAIL]
Critical: [count] — [brief list]
Minor: [count] — [brief list]
Suggestions: [count]
Unplanned files: [none | list]
Drift: [none | return to /requirement — reason]
```

In manual mode, follow with the standard 2-option completion message (A/B) per `.claude/rules/completion-format.md`.
