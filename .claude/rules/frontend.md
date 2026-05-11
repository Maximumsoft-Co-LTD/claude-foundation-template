---
name: Frontend Rules
description: Conventions enforced when editing UI code — PascalCase components, co-located tests, no inline styles, a11y labels, server state via React Query/SWR.
scope: path
paths:
  - "src/**/*.{ts,tsx}"
  - "src/components/**/*"
  - "src/pages/**/*"
  - "src/app/**/*.{ts,tsx}"
  - "app/**/*.{ts,tsx}"
  - "pages/**/*.{ts,tsx}"
---

# Frontend Rules

<!-- Customize for your project. Defaults below are sensible starting points. -->

## Component Conventions
- File and export naming: PascalCase (`UserCard.tsx`, `export function UserCard`)
- Co-locate test files: `UserCard.test.tsx` next to `UserCard.tsx`
- One component per file — no barrel exports for components

## Styling
- No inline styles — use the project's styling system (Tailwind / CSS Modules / styled-components)
- Design tokens for colors/spacing — no hardcoded hex values

## Accessibility
- All interactive elements must have accessible labels (`aria-label` or visible text)
- Keyboard navigation must work for all interactive flows

## State & Data Fetching
- Server state via React Query / SWR — no manual `useEffect` for fetching
- Form state via React Hook Form — no uncontrolled inputs for complex forms
