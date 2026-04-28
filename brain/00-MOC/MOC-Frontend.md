---
type: MOC
topic: frontend
tags: [frontend, UI, UX, component, react, state, performance]
updated: 2026-04-02
---

# 🗺️ MOC — Frontend Development

> ทุกอย่างที่ user เห็นและโต้ตอบ — components, state, API calls, performance, accessibility

---

## Core Concepts

- [[../01-concepts/frontend/CON-component-architecture]] — Atomic design, composability, co-location
- [[../01-concepts/frontend/CON-state-management]] — Local vs global state, server state, form state
- [[../01-concepts/frontend/CON-api-integration]] — Fetching, caching, optimistic UI, error states
- [[../01-concepts/frontend/CON-performance-frontend]] — Bundle size, lazy loading, rendering strategies
- [[../01-concepts/frontend/CON-accessibility-a11y]] — WCAG 2.1 AA, ARIA, keyboard navigation
- [[../01-concepts/frontend/CON-responsive-design]] — Mobile-first, breakpoints, fluid layout
- [[../01-concepts/frontend/CON-ui-ux-pro-max]] — Design QA skill: palettes, styles, UX guidelines, 10 stacks

## State Decision Tree

```
Is this data from the server?
  → YES: use React Query / SWR (server state)

Is this UI-only state (open/closed, selected)?
  → YES: useState in component (local state)

Is this shared across many pages/components?
  → YES: Zustand / Redux / Context (global state)

Is this a form?
  → YES: React Hook Form (form state)
```

## Component Checklist

Every component should have:
- [ ] Single responsibility
- [ ] Co-located test file (`Component.test.tsx`)
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Accessible labels on all interactive elements
- [ ] Keyboard navigation support
- [ ] Responsive behavior documented

## Performance Levers

| Technique | When to Use |
|-----------|------------|
| Code splitting / lazy load | Large pages or heavy libraries |
| Memoization (React.memo, useMemo) | Expensive renders, large lists |
| Virtualization | Lists > 100 items |
| Image optimization | Hero images, galleries |
| Prefetching | Predictable navigation |

## Claude Skills for Frontend Work

Use these skills when building UI — invoke with `/skill-name` or via the Skill tool:

| Skill | When to Use |
|-------|-------------|
| `frontend-design` | Building web components, pages, dashboards, landing pages — generates production-grade, visually distinctive UI |
| `ui-ux-pro-max` | Deep UX review, polished interaction design, accessibility + visual hierarchy audit *(install if not present)* |

**Workflow tip:** During the FE Design section of `/requirement` (or before `/implement`), invoke `frontend-design` to scaffold the component, then `ui-ux-pro-max` for design QA before implementation.

> **Skill names are exact** — `fe-design`, `frontend`, etc. will fail. Use the full name as shown above.

## Related MOCs

- [[MOC-Developer-Fundamentals]] — SOLID, clean code in FE context
- [[MOC-Backend]] — API contracts FE depends on
- [[MOC-QA]] — E2E tests for FE flows
- [[MOC-Architecture]] — rendering strategy (SSR, CSR, SSG)
