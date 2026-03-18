# task-002 — Retrospective

**Sprint:** sprint-01
**Date:** 2026-03-18
**Status:** done

## Estimate vs Actual
- **Estimated:** 1 day
- **Actual:** < 1 day (completed in single session)
- **Variance:** On track — component scope was well-defined in FE design doc

## What went well
- Checkbox-based hamburger menu (no JS) worked cleanly — avoids JS dependency for a simple toggle
- CSS-only mobile nav with `input:checked ~ .navbar__links` is robust and accessible
- Design token inheritance from task-001 meant zero hardcoded colors or sizes
- `position: sticky` with `z-index: 100` works without any JS scroll listener
- Hero `min-height: calc(100vh - 65px)` guarantees CTA is always above fold at any viewport

## What could be improved
- `#features` anchor was initially pointing to a non-existent ID — caught and fixed in code review
  → future tasks should define anchor IDs before nav links reference them
- `console.log` was left in analytics placeholder — caught in code review
  → analytics stubs should use comments, not console.log, from the start

## Issues encountered
- 2 total: 0 critical / 0 major / 2 minor (fixed during code review, no /issue filed)
  - Broken anchor: `href="#features"` had no target → corrected to `href="#workflow"`
  - console.log in analytics stub → replaced with comment

## TDD effectiveness
- Tests written before implementation: yes (TDD plan in FE design doc)
- Bugs caught before manual QA: 2 (broken anchor + console.log caught by code review grep)
- Gaps found in TDD test plan: TDD plan did not include an anchor-target-exists check — add this to future nav tasks

## Knowledge sharing
- Checkbox hamburger pattern: `<input type="checkbox" id="nav-toggle">` + `<label for="nav-toggle">` + CSS sibling selector `input:checked ~ .navbar__links { display: flex }` — zero JS, works in all modern browsers
- Always verify anchor `href="#id"` targets exist in the DOM at time of writing — or add a TDD check for it
- Analytics stubs: use `// analytics: event_name` comment instead of console.log to avoid code review flags

## Action items for next sprint
- task-003: define `id="workflow"` on its section so nav anchors resolve correctly
- task-004: add `@media (prefers-reduced-motion: reduce)` override for `scroll-behavior` and `transition`
- Consider adding a TDD test case "all nav href anchors have matching id in DOM" to future navigation tasks
