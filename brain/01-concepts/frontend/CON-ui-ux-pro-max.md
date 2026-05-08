---
type: concept
tags: [ui-ux, design, frontend, accessibility, skill]
related: [CON-component-architecture, CON-accessibility-a11y, CON-responsive-design]
updated: 2026-04-03
---

# CON — ui-ux-pro-max Skill

## Definition

`ui-ux-pro-max` is an externally installed Claude Code skill providing deep UI/UX design intelligence for web and mobile projects. It acts as a **design QA layer** on top of scaffolded components — auditing aesthetics, accessibility, visual hierarchy, and interaction patterns.

## What It Provides

| Capability | Details |
|------------|---------|
| Design styles | 50+ curated visual styles |
| Color palettes | 161 production-ready palettes |
| Font pairings | 57 typographic combinations |
| Product types | 161 UI product archetypes (dashboard, landing page, e-commerce, etc.) |
| UX guidelines | 99 evidence-based UX rules |
| Chart types | 25 data visualization types |
| Stacks | React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, and more |

## When to Invoke

Invoke `ui-ux-pro-max` **after** `/requirement` has drafted the FE design and **before or during** implementation when you want design QA:

```
/requirement  →  frontend-design (scaffold)  →  ui-ux-pro-max (design QA)  →  /implement
```

Use it when:
- Running a deep UX review on a new page or feature
- Auditing visual hierarchy, spacing, and typography
- Checking accessibility (WCAG 2.1 contrast, ARIA, keyboard flow)
- Selecting a color palette or design style for a new product area
- Validating interaction patterns (hover states, loading states, error states)

## How to Invoke

```
Skill("ui-ux-pro-max")
```

**Exact name required.** Abbreviated forms (`ui-ux`, `ux-pro`, `ui-ux-pro`) will fail.

Install if not present: the skill is not bundled in the template — it is provided by an external plugin.

## Workflow Position

```
/requirement task
  Step 1: Read requirement + brain MOC-Frontend
  Step 2: Invoke frontend-design → generates component scaffold
  Step 3: Invoke ui-ux-pro-max → design QA, palette, guidelines
  Step 4: Document decisions back into [task-id]-requirement.md
  Step 5: Hand off to /implement
```

## What It Does NOT Replace

- `frontend-design` — generates the initial component code and structure
- `/testing` + `accessibility-review` skill — systematic WCAG audit with test coverage
- Design system decisions documented in `02-decisions/`

## Related

- [[CON-accessibility-a11y]] — WCAG 2.1 AA rules
- [[CON-component-architecture]] — component structure context
- [[CON-responsive-design]] — mobile-first layout principles
- [[../../../00-MOC/MOC-Frontend]] — Frontend skill overview
