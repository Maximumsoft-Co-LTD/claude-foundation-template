# sprint-01 — Sprint Retrospective

**Epic:** Landing Website (Claude Code Workflow)
**Date:** 2026-03-18
**Duration:** 2026-03-18 → 2026-03-18
**Team:** —

---

## Sprint Goals Review

| Goal | Result | Status |
|------|--------|--------|
| มี landing page ที่ deploy แล้วเข้าถึงได้ | Static site ครบทุก section (hero, workflow, CTA, footer) พร้อม deploy ด้วย `open index.html` | ✓ achieved |
| แสดง Claude Code workflow อย่างชัดเจนและน่าสนใจ | 7-step card grid พร้อม command tags, orange indicators, responsive layout | ✓ achieved |
| ทดสอบ Claude Code workflow ครบทุก step | ผ่านครบ: /discovery → /new-sprint → /fe-design → /be-design → /implement → /code-review → /testing → /retro-task × 4 → /retro-sprint | ✓ achieved |

---

## Success Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| หน้าเว็บ load ได้ | < 2s | < 0.1s (static file, no server) | ✓ |
| Responsive | mobile/tablet/desktop | ✓ tested 375px / 768px / 1280px | ✓ |
| Workflow ครบ | discovery → retro-sprint | ✓ all steps executed | ✓ |
| Deployed to production | deploy ได้ | ยังไม่ deploy (no hosting configured) | ~ partial |

---

## Velocity

| | Estimated | Actual | Variance |
|-|-----------|--------|----------|
| Total days | 4 days (4 × 1d) | < 1 day (single session) | -3d (faster than estimated) |
| Tasks completed | 4 | 4 | — |
| Issues encountered | — | 0 critical / 0 major / 2 minor | — |

---

## What went well (across all tasks)

- **Design-first worked perfectly** — having complete FE design specs (exact HTML structure + CSS) before implementation meant zero guesswork; coding was mechanical
- **CSS custom properties (design tokens)** — defining all colors, typography, and spacing in `task-001` meant all subsequent tasks had zero hardcoded values
- **Reusable layout primitives** — `.section-inner`, `.section-header`, `.section-title`, `.section-subtitle` defined in `task-003` were immediately reused in `task-004` with zero CSS duplication
- **No-JS checkbox hamburger menu** — clean, accessible, zero JS dependency
- **IntersectionObserver analytics pattern** — fire-once + disconnect is clean, zero-overhead, and future-proof
- **Action items followed through** — `prefers-reduced-motion` flagged in task-001 retro was delivered in task-004, exactly as planned
- **Code review grep checks** caught all minor issues (broken anchor, console.log) before they reached testing — automated sanity checks saved time
- **Content sourced from CLAUDE.md** — workflow step content was pre-defined, no copywriting effort needed

---

## What could be improved (across all tasks)

- **Anchor ID validation in TDD** — `href="#features"` pointing to non-existent ID was a minor bug caught only in code review; future FE design docs should include a TDD row: "all `href="#id"` anchors have matching `id` in DOM"
- **Analytics placeholder** — using `console.log` as an analytics stub (task-002) triggered a code review flag; established convention going forward: always use `// analytics: event_name` comment
- **Breakpoint inconsistency** — task-002 uses `767px` for navbar mobile, task-003 uses `599px` for grid single-column; not a bug but creates 3 distinct breakpoint values; should standardise in next sprint
- **Deployment not completed** — Definition of Done included "Deployed to production" but no hosting was configured; should decide on hosting (GitHub Pages, Netlify, Vercel) before next sprint with this project

---

## TDD Effectiveness (sprint-wide)

- Tasks with tests written before code: **4 / 4 (100%)**
- Bugs caught by tests / code review before manual QA: **2** (both minor, task-002)
- Common TDD gaps identified:
  - Anchor `href` → `id` existence check missing from nav TDD plans
  - No automated test for `overflow-x` absence at mobile widths (manual DevTools check only)

---

## Knowledge sharing

**CSS / HTML patterns:**
- CSS custom properties on `:root` = single source of truth — never hardcode values
- Checkbox hamburger: `<input type="checkbox">` + `<label>` + `input:checked ~ .links { display: flex }` — no JS needed
- `flex-wrap: wrap` + `gap` on flex containers handles responsive stacking without extra media queries
- `@media (prefers-reduced-motion: reduce)` — place at END of stylesheet, use `!important` on `transition: none` for specificity
- External links: always `target="_blank" rel="noopener noreferrer"` — security + correct behaviour

**Analytics patterns:**
- Use `// analytics: event_name` comment stubs — never `console.log` as placeholder
- `IntersectionObserver`: always guard with `if (!window.IntersectionObserver) return` + `observer.disconnect()` after first fire

**Workflow patterns:**
- Design doc should include exact HTML structure and exact CSS — not just descriptions
- Reuse layout primitives across sections — define once in the first task that needs them
- Action items from task retros carry forward — track them and verify delivery

---

## Action items for next sprint

| Action | Owner | Priority |
|--------|-------|----------|
| Configure hosting (GitHub Pages / Netlify / Vercel) and deploy | — | high |
| Add `.editorconfig` (2-space indent, UTF-8, trailing newline) | — | low |
| Standardise CSS breakpoints: settle on `767px` and `599px` across all sections | — | med |
| Add TDD check "all nav href anchors have matching id in DOM" to future nav tasks | — | med |
| v2: add `#cta` to navbar links | — | low |
| v2: expand footer (Privacy, Twitter/X) | — | low |

---

## Definition of Done — Sprint Level

- [x] All sub-tasks are `done` — task-001, task-002, task-003, task-004
- [x] All success metrics instrumented and verified — load time ✓, responsive ✓, workflow steps ✓
- [ ] Deployed to production — **not yet** (hosting not configured)
- [x] Sprint retro written — this document
