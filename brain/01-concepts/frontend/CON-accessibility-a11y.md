---
type: concept
tags: [frontend, accessibility, a11y, WCAG, ARIA, keyboard]
related: [CON-component-architecture]
updated: 2026-03-25
---

# Accessibility (a11y)

## WCAG 2.1 AA — 4 Principles (POUR)

```
P — Perceivable    → content must be seen/heard in some form
O — Operable       → interface must be navigable (keyboard, etc.)
U — Understandable → content and UI behavior must be clear
R — Robust         → works with assistive technologies (screen readers)
```

## Must-Have Rules

### Semantic HTML First

```html
<!-- ✅ Semantic = free accessibility -->
<button>Submit</button>
<nav>...</nav>
<main>...</main>
<article>...</article>
<h1>Page Title</h1>

<!-- ❌ Div soup = broken accessibility -->
<div onclick="submit()">Submit</div>
<div class="nav">...</div>
```

### Interactive Elements Must Have Labels

```tsx
// ✅ Visible label
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ aria-label for icon buttons
<button aria-label="Close modal">
  <XIcon />
</button>

// ✅ aria-labelledby
<dialog aria-labelledby="dialog-title">
  <h2 id="dialog-title">Confirm Delete</h2>
</dialog>

// ❌ No label
<button><XIcon /></button>
```

### Keyboard Navigation

```
All interactive elements must be reachable via:
  Tab          → navigate between focusable elements
  Enter/Space  → activate button/link
  Escape       → close modal/dropdown
  Arrow keys   → navigate within composite widgets (tabs, menus)
```

### Color Contrast

```
WCAG AA minimum:
  Normal text:  4.5:1 ratio
  Large text:   3:1 ratio (18pt+ or 14pt bold+)
  UI components: 3:1 ratio

Tools: WebAIM Contrast Checker, browser DevTools accessibility
```

### Focus Management

```tsx
// When modal opens → move focus inside
useEffect(() => {
  if (isOpen) {
    modalRef.current?.focus()
  }
}, [isOpen])

// When modal closes → return focus to trigger
useEffect(() => {
  if (!isOpen) {
    triggerRef.current?.focus()
  }
}, [isOpen])
```

### Images

```tsx
// ✅ Meaningful image
<img src="chart.png" alt="Bar chart showing Q3 revenue of $2M, up 15% from Q2" />

// ✅ Decorative image
<img src="decorative-line.png" alt="" role="presentation" />
```

## ARIA Roles (Use Sparingly)

Use native HTML first. ARIA only when no native element exists.

```tsx
// ✅ When necessary
<div role="alert">Error: Please fix the form</div>
<div role="progressbar" aria-valuenow={65} aria-valuemin={0} aria-valuemax={100} />

// ❌ Redundant ARIA
<button role="button">Click me</button>  // button already has role
```

## Testing Accessibility

- **axe DevTools** — browser extension, catches ~57% of issues
- **Lighthouse** — audit in Chrome DevTools
- **Screen reader** — NVDA (Windows), VoiceOver (Mac), TalkBack (Android)
- **Keyboard only** — unplug mouse, navigate entire flow

## Related

- [[CON-component-architecture]] — component checklist includes a11y
- [[../../../00-MOC/MOC-Frontend]]
