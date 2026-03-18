# task-003 — Retrospective

**Sprint:** sprint-01
**Date:** 2026-03-18
**Status:** done

## Estimate vs Actual
- **Estimated:** 1 day
- **Actual:** < 1 day (completed in single session)
- **Variance:** On track — content (7 steps) was pre-defined in CLAUDE.md workflow

## What went well
- Content was fully derivable from `CLAUDE.md` workflow table — no guesswork on copy
- `.section-inner` / `.section-header` / `.section-title` / `.section-subtitle` pattern is reusable — task-004 CTA section can use these same classes
- `IntersectionObserver` pattern (fire-once + disconnect) is clean and zero-overhead
- CSS grid `repeat(3,1fr)` → `repeat(2,1fr)` → `1fr` responsive cascade worked without any overrides to existing styles
- Heading hierarchy H1 → H2 → H3 maintained naturally by section structure

## What could be improved
- `<span class="step-tag">/fe-design &nbsp;/be-design</span>` uses `&nbsp;` for spacing between two commands — a minor HTML smell; could use two separate `<span>` elements with gap, but not worth changing now
- Mobile breakpoint at 599px (instead of 768px used elsewhere) creates a third breakpoint value — future tasks should align all grid breakpoints for consistency

## Issues encountered
- 0 total — clean implementation, no issues filed

## TDD effectiveness
- Tests written before implementation: yes (TDD plan in FE design doc)
- Bugs caught by tests before manual QA: 0 (first-pass clean)
- Gaps found in TDD test plan: none

## Knowledge sharing
- `.section-inner` + `.section-header` + `.section-title` + `.section-subtitle` are now reusable layout primitives — task-004 should use them for the CTA section heading
- `IntersectionObserver` pattern: always guard with `if (!window.IntersectionObserver) return` and call `observer.disconnect()` after first fire to avoid memory leaks
- CSS grid breakpoints: standardize on `1023px` (tablet) and `599px` (small mobile) across all grid sections for consistency

## Action items for next sprint
- task-004: reuse `.section-inner` and `.section-header` classes for CTA section — avoids duplicating layout CSS
- task-004: add `@media (prefers-reduced-motion: reduce)` override for `scroll-behavior` and all CSS `transition` properties (flagged in task-001 retro, required before shipping)
- Future: align mobile grid breakpoint — consider standardising on `767px` across navbar, hero, and all grid sections
