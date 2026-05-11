# mode-requirement

Loaded by `plan-driven-delivery` SKILL.md when the caller is `/requirement`.

This mode is responsible for producing the four plan-contract control surfaces inside the requirement doc. It runs after ACs, Implementation Plan, and TDD Test Plan are drafted — its job is to collapse that content into execution-ready structures before `/implement` starts.

---

## What this mode reads

- `## Acceptance Criteria` — the user-visible outcomes that define done.
- `## Scope Overview` — the major work areas (not implementation steps).
- `## Implementation Plan` — engineering task rows with file paths.
- `## TDD Test Plan` and `## E2E Test Plan` — proof rows per AC / boundary case.

---

## What this mode writes

- `## Execution Slices` — created or refreshed with the canonical shape below.
- `## Plan Drift Guard` — created or refreshed with task-specific rules.

---

## Step 1 — Search before creating

Check whether the requirement doc already exists:
- If it exists and already has `Execution Slices` and `Plan Drift Guard` → refresh them against the current ACs and Implementation Plan (the task may have evolved since the last run).
- If it exists but these sections are missing → add them.
- If neither the doc nor the sections exist → the caller has not yet run `/requirement`; stop and tell the caller to run `/requirement` first.

---

## Step 2 — Collapse the plan into Execution Slices

Write or update `## Execution Slices` using this shape:

```markdown
## Execution Slices
| Slice | Goal | Covers ACs | Planned files | Test-first proof | Exit evidence | Status |
|-------|------|------------|---------------|------------------|---------------|--------|
| S1    | …    | AC-1, AC-2 | path/a, path/b | test names + command | what proves this slice is done | planned |
```

Rules:
- 1–7 slices per task. More than 7 means the task is too large or slices are too granular.
- One slice is one meaningful checkpoint — not one checkbox from the Implementation Plan.
- Every slice maps to at least one AC.
- Every slice names its proof (test name + run command) before implementation starts.
- `Status` starts as `planned`; changes to `doing` or `done` only when the proof exists.
- Every AC from the requirement doc must appear in at least one slice row.

---

## Step 3 — Write the Plan Drift Guard

Write or update `## Plan Drift Guard` with three subsections, specific to this task:

```markdown
## Plan Drift Guard
- **In-plan fixes stay in `/issue`:** [concrete examples for this task — e.g. "validation error text changes", "typo in response field name"]
- **Return to `/requirement` when:** [concrete triggers for this task — e.g. "a new AC is needed", "the API shape changes", "a new migration appears"]
- **Permitted follow-ups after ship:** [deferred work that is explicitly out of scope — e.g. "pagination on the list endpoint"]
```

Generic placeholders ("if ACs change, go back") are not acceptable. The rules must be specific enough that an agent can classify a fix without ambiguity.

---

## Step 4 — Verify the contract

Before declaring the mode complete, check:
- Every AC appears in at least one slice's `Covers ACs` cell.
- Every slice has at least one entry in `Test-first proof`.
- No planned file in any slice is invented outside the existing codebase or explicitly scaffolded in the Implementation Plan.
- No risky change (migration, auth, payment, external dependency) is present without a concrete drift rule in the Plan Drift Guard.
- If `## E2E Test Plan` is required (3pt+ or any FE-touching task), at least one slice references an E2E proof row.

---

## Drift handling for this mode

At requirement time there is no prior plan to drift from — this mode creates the contract. However:
- If the user's edits to ACs or Implementation Plan since the last run contradict existing slices, update the slices to match.
- If the ACs are still ambiguous after reading the doc, flag `?` in autopilot or BLOCK in manual mode before writing slices — ambiguous slices are worse than no slices.

---

## Output handoff

Produces for the caller (`/requirement`):

```
plan-driven-delivery (requirement): contract written
Slices: S1 … SN
Next slice: S1 — [goal]
Blocking ambiguities: [none | list]
```

In manual mode, follow with the standard 2-option completion message (A/B) per `.claude/rules/completion-format.md`.
