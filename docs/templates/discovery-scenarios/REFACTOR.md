# Discovery — Refactor

Scenario-specific prompts for the 10 discovery topics. Use alongside `DISCOVERY-TEMPLATE.md`.

## 1 · Problem
- What current pain motivates the refactor? (Slow tests / coupling / duplication / hard to extend.)
- What concrete recent incident exposed it? (PR that took N days, bug that recurred, onboarding friction.)
- Why is "leave it alone" not acceptable any more?

## 2 · Users & Stakeholders
- Engineers affected by the current code (whose lives improve).
- Owners of code that consumes the refactored surface (who must not regress).

## 3 · Goals & Success
- The end state: name the shape (interfaces, modules, ownership) you'll have when done.
- Measurable improvement: build time, test count flake rate, lines deleted, file count, or specific cycle-time metric.
- **Behavior preservation**: the refactor must be observably a no-op from outside — list what stays the same.

## 4 · As-Is Architecture
- Current module map: where the responsibility lives today.
- Coupling points and cyclic dependencies to break.

## 5 · To-Be Architecture
- New module map: where each responsibility moves to.
- Migration order — what flips first, what's last.

## 6 · Context & Background
- Past refactor attempts at this surface and why they stalled.
- Related ADRs / DEC notes that constrain the new shape.

## 7 · Constraints
- **Behavior preservation invariants** — public API, observable side-effects, persisted shape.
- Test coverage threshold required before any move.
- Window where the refactor must complete (release train, freeze deadline).

## 8 · Approaches
- Big-bang vs. strangler fig (per-module migration).
- In-place rename vs. parallel new module + deprecation.
- Trade-offs: time-to-finish, blast radius, rollback complexity.

## 9 · Unknowns & Open Questions
- Hidden consumers of the refactored API (internal tools, scripts, observability).
- Performance characteristics of the new shape (any benchmark needed?).

## 10 · Risks & Scope
- **Rollback path** — how do we revert one epic without affecting others?
- **Blast radius** — how many services / packages must redeploy together?
- Sprint count. Refactors that span > 2 sprints almost always need a strangler approach.
