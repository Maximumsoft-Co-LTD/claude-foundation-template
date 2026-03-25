---
description: WCAG 2.1 accessibility audit for frontend changes — ARIA, keyboard nav, color contrast, screen reader
allowed-tools: Read, Grep, Bash(git diff *)
disable-model-invocation: false
---

# /accessibility-review
Workflow position: **/testing → START → /retro-task**

Audit all frontend changes in this task against WCAG 2.1 AA criteria. Only runs for tasks with frontend changes — skips silently for backend-only tasks.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Check for FE changes

Parse `[task-id]`, extract `[sprint-id]`.

```bash
git diff main...HEAD --name-only
```

If no files matching `*.tsx`, `*.jsx`, `*.ts` (UI components), `*.html`, `*.vue`, `*.svelte` → print `✓ No frontend changes — accessibility review skipped.` and exit.

Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — identify components added or modified.

---

## Step 2 — ARIA and semantic HTML

For each changed component/page file, check:

| Check | Pass condition |
|-------|---------------|
| Buttons and links | `<button>` for actions, `<a href>` for navigation — not `<div onClick>` |
| Images | `alt` attribute present; decorative images have `alt=""` |
| Form inputs | Every `<input>`, `<select>`, `<textarea>` has an associated `<label>` or `aria-label` |
| Icon-only buttons | Have `aria-label` describing the action |
| Modal/dialog | Has `role="dialog"`, `aria-modal="true"`, focus trapped on open, returns focus on close |
| Loading states | Communicated via `aria-live` or `aria-busy` — not just visually |
| Error messages | Associated with field via `aria-describedby` |
| Lists | Data displayed as list uses `<ul>/<ol>` not `<div>` stack |
| Headings | Logical hierarchy (`h1` → `h2` → `h3`) — no level skipped |
| Landmarks | Page has `<main>`, nav has `<nav>`, `<header>`, `<footer>` where appropriate |

---

## Step 3 — Keyboard navigation

Check interactive elements in changed components:

| Check | Pass condition |
|-------|---------------|
| Tab order | All interactive elements reachable by Tab in logical order |
| Focus visible | No `outline: none` or `outline: 0` without a custom focus style replacement |
| Keyboard-operable | All mouse interactions have keyboard equivalent (`onClick` + `onKeyDown` or native element) |
| Skip link | If page has long nav, a "Skip to main content" link present |
| Trap focus | Focus does not escape modal/drawer while open |
| Escape key | Modals, dropdowns, tooltips dismissible with `Escape` |

---

## Step 4 — Color and contrast

Check CSS / Tailwind / styled-component changes:

| Check | Pass condition |
|-------|---------------|
| Text contrast | Body text ≥ 4.5:1 against background; large text (18pt+) ≥ 3:1 |
| UI components | Interactive element borders/states ≥ 3:1 contrast |
| Color not sole indicator | Status, errors, links not differentiated by color alone (also use icon, text, underline) |
| Disabled states | Disabled elements visually distinguishable (not just lower opacity) |

Note: exact contrast ratios require a browser tool. Flag any color pair that appears borderline for manual verification.

---

## Step 5 — Motion and animation

If CSS transitions or animations introduced:

| Check | Pass condition |
|-------|---------------|
| `prefers-reduced-motion` | Animations respect `@media (prefers-reduced-motion: reduce)` |
| Auto-playing content | No auto-playing video/audio without user control |
| Flashing content | No content flashing > 3 times/second |

---

## Step 6 — Write accessibility report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Accessibility Review: [task-id] — [Task Title]
Result: PASS / ISSUES FOUND
WCAG level targeted: AA (2.1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Critical (WCAG fail):
  ☐ [component:line] — [issue + fix suggestion]

Advisory (best practice):
  • [observation]

Manual checks needed:
  • [color pair] — verify contrast ratio with browser devtools
  • [interaction] — test with screen reader (VoiceOver / NVDA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Output

```
Result: PASS / ISSUES FOUND  ([N] critical / [N] advisory)

Next:
  Critical issues → fix inline or /issue [task-id] [description]
  Pass            → /retro-task [task-id]
```
