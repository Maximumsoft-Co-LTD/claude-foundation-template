---
type: concept
tags: [frontend, responsive, mobile-first, breakpoints, CSS, layout]
related: [CON-component-architecture, CON-accessibility-a11y]
updated: 2026-03-25
---

# Responsive Design

## Mobile-First Principle

Design for mobile first, then enhance for larger screens:

```css
/* ✅ Mobile-first: base style is mobile */
.container {
  width: 100%;
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container { max-width: 768px; }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container { max-width: 1200px; padding: 2rem; }
}

/* ❌ Desktop-first: harder to undo, worse mobile experience */
.container { max-width: 1200px; }
@media (max-width: 768px) { .container { ... } }
```

## Common Breakpoints

| Name | Min Width | Typical Devices |
|------|----------|----------------|
| xs (mobile) | 0px | Phones portrait |
| sm | 640px | Phones landscape |
| md | 768px | Tablets |
| lg | 1024px | Laptops |
| xl | 1280px | Desktops |
| 2xl | 1536px | Large monitors |

**Tailwind CSS** uses these breakpoints by default.

## Fluid Typography

```css
/* Scales smoothly between breakpoints */
html {
  font-size: clamp(14px, 2vw, 18px);
  /* min: 14px, preferred: 2% of viewport, max: 18px */
}

/* Fluid heading */
h1 {
  font-size: clamp(1.5rem, 5vw, 3rem);
}
```

## Layout Patterns

### Flexbox (1D: row or column)
```css
/* Navigation bar */
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* Stack on mobile, row on tablet+ */
.card-group {
  display: flex;
  flex-direction: column;  /* mobile: stack */
}
@media (min-width: 768px) {
  .card-group { flex-direction: row; flex-wrap: wrap; }
}
```

### CSS Grid (2D: rows and columns)
```css
/* Responsive grid: 1 → 2 → 3 columns */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;  /* mobile: 1 column */
  gap: 1.5rem;
}
@media (min-width: 640px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Auto-fit (no media queries needed) */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

## Touch Targets (Mobile UX)

```
Minimum touch target size: 44x44px (Apple) / 48x48dp (Google)

/* ✅ */
button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}

/* ❌ Too small for touch */
button {
  padding: 4px 8px;
}
```

## Responsive Images

```html
<!-- Modern: srcset for different densities -->
<img
  src="image-800w.jpg"
  srcset="image-400w.jpg 400w, image-800w.jpg 800w, image-1600w.jpg 1600w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 800px"
  alt="Product photo"
/>

<!-- Picture element for art direction (different crop per breakpoint) -->
<picture>
  <source media="(min-width: 1024px)" srcset="hero-wide.jpg" />
  <source media="(min-width: 640px)" srcset="hero-medium.jpg" />
  <img src="hero-square.jpg" alt="Hero" />
</picture>
```

## Testing Responsive Design

```
Chrome DevTools:
  DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
  Test: iPhone SE (375px), iPad (768px), Desktop (1440px)

Real devices: Test on actual phone — simulators miss touch behavior

Key things to verify per breakpoint:
  ✓ Text readable without zoom
  ✓ Touch targets large enough
  ✓ No horizontal scroll
  ✓ Images not distorted
  ✓ Navigation accessible
  ✓ Forms usable
```

## Related

- [[CON-component-architecture]] — components designed for all breakpoints
- [[CON-accessibility-a11y]] — responsive + accessible go together
- [[../../../00-MOC/MOC-Frontend]]
