# task-004 — Retrospective

**Sprint:** sprint-01
**Date:** 2026-03-18
**Status:** done

## Estimate vs Actual
- **Estimated:** 1 day
- **Actual:** < 1 day (completed in single session)
- **Variance:** On track — scope was minimal and well-defined

## What went well
- `.section-inner` / `.section-header` / `.section-title` / `.section-subtitle` reuse from task-003 worked perfectly — CTA section required zero new layout CSS
- `overflow-x: hidden` on `body` is a one-line fix that resolves all mobile horizontal scroll issues globally
- `@media (prefers-reduced-motion: reduce)` delivered as promised from task-001 retro action item — good follow-through
- `flex-wrap: wrap` + `gap` on `.footer-inner` handles responsive stacking without a separate media query for the row layout
- `rel="noopener noreferrer"` on external links is a security best practice — caught proactively, not in code review
- Combined implement + code-review + testing in one pass — efficient for a small, well-specified task

## What could be improved
- `#cta` anchor is not linked from the nav — Visitor can't navigate directly to CTA section from navbar; acceptable for this scope but worth adding if nav grows
- Footer has only 2 links — minimal but sufficient for v1; v2 could add Twitter/X, Privacy Policy

## Issues encountered
- 0 total — clean first-pass implementation

## TDD effectiveness
- Tests written before implementation: yes (TDD plan in FE design doc)
- Bugs caught by tests before manual QA: 0 (clean pass)
- Gaps found in TDD test plan: none

## Knowledge sharing
- `flex-wrap: wrap` + `gap` on flex containers is a robust responsive pattern — avoids needing explicit media queries just for wrapping
- `@media (prefers-reduced-motion: reduce)` rule: place at the END of stylesheet so it overrides all earlier transitions; use `!important` on the `transition: none` to ensure specificity
- External link pattern: always pair `target="_blank"` with `rel="noopener noreferrer"` — `noopener` prevents tab-napping, `noreferrer` prevents referrer leakage
- Reusing shared layout classes (`.section-inner`, `.section-header`) across sections is the right approach — don't duplicate CSS for structurally identical layouts

## Action items for next sprint
- sprint-01 is complete — run `/retro-sprint sprint-01` after committing this task
- v2 backlog: add `#cta` to navbar links if a contact/signup flow is added
- v2 backlog: expand footer with additional links (Privacy, Twitter/X)
