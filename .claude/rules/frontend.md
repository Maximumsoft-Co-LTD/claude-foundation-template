---
paths:
  - "src/**/*.{ts,tsx}"
  - "src/components/**/*"
  - "src/pages/**/*"
  - "src/app/**/*.{ts,tsx}"
  - "app/**/*.{ts,tsx}"
  - "pages/**/*.{ts,tsx}"
---

# Frontend Rules

<!-- Replace with your project's FE conventions. Examples below. -->

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

## Glob patterns for this project (customize these)
<!-- Common patterns to adapt:
  src/**/*.{ts,tsx}           — all TypeScript source
  src/components/**/*         — component library
  src/features/**/*.{ts,tsx}  — feature modules
  app/**/*.{ts,tsx}           — Next.js app router
  pages/**/*.{ts,tsx}         — Next.js pages router
-->
