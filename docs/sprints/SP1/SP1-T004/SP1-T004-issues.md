# SP1-T004 — Leaderboard Frontend — Issues

<!-- One file per task. Each issue is appended as a new section. -->
<!-- Summary updates automatically as issues are added. -->

## Summary
- **Total:** 1 issue (0 critical / 0 major / 1 minor)

---

## Issue: UI/UX — leaderboard visual design insufficient

**Date:** 2026-03-24
**Severity:** minor

<!-- critical = blocks task or breaks existing functionality -->
<!-- major    = AC not met but workaround exists -->
<!-- minor    = cosmetic, performance, or edge case not in ACs -->

### Description
The initial leaderboard implementation was functionally correct but lacked visual polish. The layout used flat, unstyled containers with no hierarchy between rank positions, plain text stats, and no clear brand identity. Filter tabs had no icons and the active state was unclear.

### Steps to Reproduce
1. Open the leaderboard page in the browser.
2. Observe flat card list with no rank differentiation.
3. Observe filter tabs with no icons, minimal contrast between active/inactive states.
4. Observe no hero header or brand colour treatment.

### Expected
A visually engaging leaderboard matching a community fitness app — dark gradient hero, Strava orange brand colour, medal icons for top 3, emoji-icon filter tabs, and clean card/table layout.

### Actual
Plain white containers, no gradient, no medal differentiation, no emoji icons on filter tabs, generic button styles.

### Root Cause
Initial implementation prioritised functional correctness and AC coverage over visual design quality. No design reference was provided for the hero header, rank badges, or filter tab icon treatment.

### Fix
Full redesign across 9 component files:
- `app/globals.css` — Strava orange CSS variable (`--strava: #FC4C02`), zinc-100 body background
- `app/components/LeaderboardPage.tsx` — dark gradient hero (`from-zinc-900 via-zinc-800`) with "Strava Club" label, orange title accent
- `app/components/WeekRangeHeader.tsx` — white text on dark hero, green sync badge
- `app/components/FilterTabs.tsx` — emoji icons (`aria-hidden`), orange active pill, hover transition
- `app/components/MemberRow.tsx` — medal `RankBadge` (🥇🥈🥉 for top 3), tinted row backgrounds
- `app/components/LeaderboardTable.tsx` — `rounded-2xl` card container, `shadow-sm`
- `app/components/MemberCard.tsx` — medal card border colours, stat grid with `bg-white/70` cells
- `app/components/EmptyState.tsx` — 🏁 emoji, dashed border treatment
- `app/components/ErrorState.tsx` — 😵 emoji, red theme, rounded-full retry button

Tests updated to match new text copy and accessible label conventions:
- `__tests__/leaderboard-fe.test.tsx` — FE-T009 aria-label, FE-T014 "No activities this week"
- `__tests__/filter-tabs.test.tsx` — FE-T028 banner text "Unknown filter"
- `__tests__/page.test.tsx` — heading test updated for new page structure

### Test Added
All 131 existing tests pass after fix — no new tests required (cosmetic change, no new behaviour).

### Blocks
none

---
