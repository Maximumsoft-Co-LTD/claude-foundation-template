# task-001 — Retrospective

**Sprint:** sprint-01
**Date:** 2026-03-18
**Status:** done

## Estimate vs Actual
- **Estimated:** 1 day
- **Actual:** < 1 day (completed in single session)
- **Variance:** On track — setup tasks are well-scoped when design tokens are pre-defined

## What went well
- Design token spec was complete in `task-001-frontend.md` before implementation — no guesswork during coding
- Pure HTML/CSS with no build step makes setup trivially verifiable (open in browser = done)
- CSS custom properties approach means all future tasks share one source of truth for colors/spacing/typography
- Folder structure (`index.html`, `styles/`, `assets/`) matches the FE design spec exactly

## What could be improved
- `prefers-reduced-motion` override for `scroll-behavior: smooth` was identified but deferred to task-004 — worth flagging earlier in FE design
- No `.editorconfig` or `README` was created — might be useful for future contributors (out of scope for this task)

## Issues encountered
- None — 0 issues filed

## TDD effectiveness
- Tests written before implementation: yes (manual checklist in TDD Test Plan)
- Bugs caught by tests before manual QA: 0 (clean first pass)
- Gaps found in TDD test plan: none — all 14 rows verified and passed

## Knowledge sharing
- CSS custom properties on `:root` are the single source of truth for the design system — all future tasks must use `var(--token-name)` and never hardcode colors or sizes
- `scroll-behavior: smooth` needs a `@media (prefers-reduced-motion: reduce)` counterpart — add in task-004
- `assets/.gitkeep` pattern used to track empty folder in git

## Action items for next sprint
- task-002 can start immediately — design system is stable and ready to consume
- Consider adding `.editorconfig` (2-space indent, UTF-8, trailing newline) before the project grows
