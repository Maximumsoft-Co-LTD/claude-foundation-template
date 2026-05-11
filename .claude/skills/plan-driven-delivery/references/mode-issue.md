# mode-issue

Loaded by `plan-driven-delivery` SKILL.md when the caller is `/issue`.

This mode is the triage gate for fixes discovered during implementation, review, or testing. Its core responsibility is a single binary decision: is this fix in-plan (handled inside `/issue` without touching the requirement doc) or material drift (which requires returning to `/requirement` first)?

---

## What this mode reads

- The issue description provided by the caller.
- `## Execution Slices` — which slice is currently `doing` or was most recently `done`.
- `## Acceptance Criteria` — the owning AC for the issue.
- `## Plan Drift Guard` — this task's explicit rules for in-plan vs material drift.
- `## Implementation Plan` — to find the owning row.

---

## What this mode writes

- An issue log entry (inline in the requirement doc or in a separate issue note, per the caller's convention).
- Updates to the owning slice's `Exit evidence` or `Status` if the fix changes what was promised.
- Does NOT modify ACs or add slices without routing through `/requirement`.

---

## Step 1 — Map the issue to its owning AC and slice

Find which AC the issue violates. Find which slice owns that AC. If the issue doesn't map to any AC or slice, that itself is a drift signal — the code that produced the issue may be unplanned work.

---

## Step 2 — Apply the Plan Drift Guard decision tree

Read the `## Plan Drift Guard` for this task. Classify the fix:

**In-plan fix — stay in `/issue`** when ALL of the following are true:
- The fix restores behavior described by an existing AC (not new behavior).
- The user-visible workflow does not change.
- The API shape (request, response, error codes) does not change.
- No new migration, permission change, payment rule, or external dependency is introduced.
- The owning slice's exit evidence still holds after the fix (or a minor update to the evidence is sufficient).
- The task estimate does not change materially.

**Return to `/requirement`** when ANY of the following are true:
- An existing AC must be rewritten to describe the correct behavior.
- A new AC is needed to capture behavior the plan never specified.
- The fix would change the API shape or a published contract.
- A new migration, permission change, or external dependency is required.
- The fix's scope is large enough to alter the dependency graph or sprint estimate.
- The Plan Drift Guard for this task explicitly lists the trigger condition.

If the classification is ambiguous and the Plan Drift Guard does not give a clear answer — flag `?` in autopilot or BLOCK in manual mode and ask the user before proceeding.

---

## Step 3 — Execute the in-plan fix

If the decision is in-plan:
1. Run `bug-repro` first — produce a verified-RED failing test that reproduces the issue before touching the implementation. Per `.claude/rules/testing.md`, a bug fix always starts with a failing test.
2. Implement the fix scoped to the owning slice's planned files.
3. Confirm the new test is GREEN and the full suite still passes.
4. Update the slice's `Exit evidence` if the promised artifact changed.
5. Log the fix: which AC, which slice, what was wrong, what changed.

---

## Step 4 — Route material drift to /requirement

If the decision is material drift:
1. Do NOT write any fix code.
2. Write the issue log entry describing what was found and why it requires a plan update.
3. Return the task to `/requirement` with a summary of what needs to change.
4. After `/requirement` updates the plan contract, `/implement` continues from the next planned slice.

---

## Drift handling for this mode

The Plan Drift Guard is this mode's primary decision instrument. If it is missing or too generic (e.g., just says "if ACs change, go back"), treat that as a gap in the requirement doc and flag it — a missing drift guard is itself a `Minor` finding that should be added before the task closes.

---

## Output handoff

Produces for the caller (`/issue`):

```
plan-driven-delivery (issue): [in-plan | return-to-requirement]
AC: [AC-N]
Slice: [S-N]
Decision: [one-line reason]
Fix scope: [files touched | n/a — routed to /requirement]
Slice evidence updated: [yes | no | n/a]
```

In manual mode, follow with the standard 2-option completion message (A/B) per `.claude/rules/completion-format.md`.
