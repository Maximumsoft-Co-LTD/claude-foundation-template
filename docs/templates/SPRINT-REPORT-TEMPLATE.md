# [sprint-id] — Sprint Report

**Epic:** [Epic Title]
**Date:** YYYY-MM-DD
**Sprint window:** YYYY-MM-DD → YYYY-MM-DD
**Branch / commit range:** `[branch-or-range]`
**Status:** ready for QA / signed off

---

# Part A — Stakeholder Summary

## Executive Summary
<!-- 3–5 plain-language bullets. What shipped, what users get, what changed visibly. No jargon. -->
-

## Deliverables at a Glance
| Task | Story (1-line) | Type | Points | ACs delivered | Notes |
|------|----------------|------|--------|---------------|-------|
| SP[N]-T[NNN] | As a __, I want __, so that __. | fullstack / fe-only / be-only / infra | 1 / 2 / 3 / 5 / 8 | N/N | — |

## Sprint Goal — Outcome
<!-- One paragraph: did the sprint hit its goal? Plain language for non-engineers. -->

---

# Part B — Per-Task Detail (Technical)

> One sub-section per task. Copy the block below for each task.

## SP[N]-T[NNN] — [Story title]

**Story:** As a __, I want __, so that __.
**Type:** fullstack / fe-only / be-only / infra
**Points:** N · **Estimate vs Actual:** Xd → Yd

### Acceptance Criteria — Delivered
| AC | Title | How verified | Evidence |
|----|-------|--------------|----------|
| AC-1 | [title] | unit / integration / e2e / ui-verify | `path/to/test:LN` or smoke.md |

### What changed
- **Files added/modified:** [N] — key paths: `[path1]`, `[path2]`
- **API endpoints:** [list new/changed endpoints, or "—"]
- **DB / schema:** [new collections / migrations / "—"]
- **Config / env:** [new env vars / flags / "—"]

### Known limitations carried into ship
- [Limitation 1, with link to follow-up backlog item if any] / "—"

---

# Part C — Manual Test Checklist

> Use during QA. Tick each item only after running it on the sprint build. Bugs found → log via `/issue [task-id] [desc]`.

## C.1 — Per-task golden paths
> The single most important happy-path flow for each task.

### SP[N]-T[NNN] — [Story title]
- [ ] **Setup:** [pre-conditions, seed data, role/permissions]
- [ ] **Steps:**
  1. [step]
  2. [step]
  3. [step]
- [ ] **Expected:** [observable outcome — what the user sees / what data persists]

## C.2 — Per-task edge cases
> Boundary conditions, validation, error states, empty states. Mirror the boundary rows from each task's TDD test plan but translate to manual UI/API steps.

### SP[N]-T[NNN]
- [ ] **[Edge case name]** — Steps: [...] · Expected: [...]
- [ ] **[Validation failure]** — Steps: [...] · Expected: [error message / state]
- [ ] **[Empty / zero state]** — Steps: [...] · Expected: [...]

## C.3 — Cross-task integration scenarios
> Flows that touch >1 task in this sprint. These are NOT covered by any single task's smoke.md and require eyes-on QA before sign-off.

| # | Scenario | Touches tasks | Steps | Expected |
|---|----------|---------------|-------|----------|
| 1 | [e.g. user signs up (T001) → completes profile (T002) → receives email (T003)] | T001, T002, T003 | [step list] | [outcome] |

## C.4 — Regression spot-checks
> Pre-existing flows most likely to be impacted by this sprint's changes (per impact-map). Tick each after a quick re-run.

- [ ] [Existing flow 1 — why at risk: ...]
- [ ] [Existing flow 2 — why at risk: ...]

---

# Part D — Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| QA | | | ☐ pass · ☐ pass-with-issues · ☐ blocked |
| Product Owner | | | ☐ accepted · ☐ changes requested |
| Tech Lead | | | ☐ approved · ☐ approved-with-followups |

**Bugs raised during this report:**
- [ ] [`SP[N]-T[NNN]-issues.md` entry] / "none"
