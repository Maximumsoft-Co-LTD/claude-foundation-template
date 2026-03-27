---
type: concept
tags: [frontend, components, atomic-design, composability, react]
related: [CON-state-management, CON-api-integration, CON-performance-frontend]
updated: 2026-03-25
source: template
---

# Component Architecture

## Atomic Design

```
Atoms       → smallest UI units (Button, Input, Icon, Label)
Molecules   → combination of atoms (SearchBar = Input + Button)
Organisms   → complex UI sections (Header = Logo + Nav + SearchBar)
Templates   → page layout (no real data, just structure)
Pages       → templates + real data = what user sees
```

## Component Rules

```
✅ Single responsibility (does one thing well)
✅ Co-located test: UserCard.tsx + UserCard.test.tsx
✅ PascalCase file and export name
✅ One component per file
✅ No barrel exports for components

❌ Components that do too much:
   - Fetches data AND renders AND handles form state AND validates
   → Split into: hook (data/logic) + component (render)
```

## Composability Pattern

```tsx
// ✅ Composable — parent controls layout
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>

// ❌ Monolithic — hard to customize
<Card title="Title" body="Content" footer="Actions" />
```

## Folder Structure Options

```
Feature-based (recommended for large apps):
  src/features/auth/
    ├── components/
    │   ├── LoginForm.tsx
    │   └── LoginForm.test.tsx
    ├── hooks/
    │   └── useAuth.ts
    └── api/
        └── authApi.ts

Type-based (simple apps):
  src/
  ├── components/
  ├── hooks/
  └── pages/
```

## Component Checklist

Every component should handle:
- [ ] Happy path (normal data)
- [ ] Loading state (skeleton or spinner)
- [ ] Error state (error message + retry option)
- [ ] Empty state (no data message)
- [ ] Responsive at all breakpoints
- [ ] Accessible (aria-labels, keyboard nav)

## Presentational vs Container Components

```
Presentational (Dumb):
  - Receives data via props
  - Only renders UI
  - Highly reusable
  - Easy to test

Container (Smart):
  - Fetches data (or uses hooks)
  - Passes to presentational
  - Handles side effects

Best practice: Keep most components presentational
Use hooks to separate data fetching from rendering
```

## Related

- [[CON-state-management]] — where state lives
- [[CON-api-integration]] — how components fetch data
- [[CON-accessibility-a11y]] — every component must be accessible
- [[../../../00-MOC/MOC-Frontend]]
