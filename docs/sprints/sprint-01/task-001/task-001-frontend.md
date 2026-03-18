# task-001 — Frontend Design

## Metadata
| Field | Value |
|-------|-------|
| **Requirement** | `docs/sprints/sprint-01/task-001/task-001-requirement.md` |
| **Assignee** | - |
| **Status** | ready |

---

## Design References

No Figma mockup — this task is a pure setup/token task. Visual spec is defined directly below.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#E97F45` | Orange — CTA buttons, accents, step indicators |
| `--color-primary-dark` | `#C96A30` | Hover state for primary |
| `--color-primary-light` | `#FAD4BC` | Subtle tints, highlights |
| `--color-bg` | `#1A1A1A` | Dark page background |
| `--color-bg-surface` | `#242424` | Card / section surface |
| `--color-bg-light` | `#F5F5F5` | Light section background |
| `--color-text` | `#FFFFFF` | Primary text on dark bg |
| `--color-text-muted` | `#A3A3A3` | Secondary / caption text |
| `--color-text-dark` | `#1A1A1A` | Text on light bg |
| `--color-border` | `#333333` | Dividers and borders |

---

## UI/UX Overview

task-001 produces no visible UI — it creates the foundation that all other tasks build on:

1. `index.html` — HTML5 skeleton with correct meta tags, Google Fonts link, and CSS link
2. `styles/main.css` — CSS reset + design tokens (custom properties) + base typography

The output is an intentionally blank page that opens without errors and exposes all CSS variables to DevTools.

---

## User Journey Map

Not applicable — this is a developer-facing setup task, not a user-facing flow.

---

## Behavior Mapping

Not applicable — no interactive elements.

---

## Routing & Navigation

| Route | File | Auth required | Notes |
|-------|------|---------------|-------|
| `/` | `index.html` | no | Entry point for entire site |

---

## Component Breakdown

| Deliverable | File path | Type | Description |
|-------------|-----------|------|-------------|
| HTML skeleton | `index.html` | new | HTML5 doctype, `<head>`, `<body>` with section placeholders |
| CSS reset | `styles/main.css` | new | Box-sizing, margin/padding reset, `*` selector |
| Color tokens | `styles/main.css` | new | CSS custom properties for all brand colors |
| Typography tokens | `styles/main.css` | new | Font-size scale, font-weight, line-height vars |
| Spacing tokens | `styles/main.css` | new | Spacing scale (4px base grid: `--space-1` to `--space-16`) |
| Base typography | `styles/main.css` | new | `body` font-family, font-size, color, line-height |
| Assets folder | `assets/` | new | Empty folder for images/icons (future tasks) |

---

## File Specifications

### `index.html` — exact structure

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Claude Code Workflow — a structured development process for shipping faster with AI." />
    <title>Claude Code Workflow</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="styles/main.css" />
  </head>
  <body>
    <!-- nav: task-002 -->
    <!-- hero: task-002 -->
    <!-- workflow: task-003 -->
    <!-- cta: task-004 -->
    <!-- footer: task-004 -->
  </body>
</html>
```

### `styles/main.css` — exact structure

```css
/* =========================================
   DESIGN TOKENS
   ========================================= */
:root {
  /* Colors */
  --color-primary:       #E97F45;
  --color-primary-dark:  #C96A30;
  --color-primary-light: #FAD4BC;

  --color-bg:            #1A1A1A;
  --color-bg-surface:    #242424;
  --color-bg-light:      #F5F5F5;

  --color-text:          #FFFFFF;
  --color-text-muted:    #A3A3A3;
  --color-text-dark:     #1A1A1A;

  --color-border:        #333333;

  /* Typography */
  --font-family:         'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  --font-size-xs:        0.75rem;   /* 12px */
  --font-size-sm:        0.875rem;  /* 14px */
  --font-size-base:      1rem;      /* 16px */
  --font-size-lg:        1.125rem;  /* 18px */
  --font-size-xl:        1.25rem;   /* 20px */
  --font-size-2xl:       1.5rem;    /* 24px */
  --font-size-3xl:       1.875rem;  /* 30px */
  --font-size-4xl:       2.25rem;   /* 36px */
  --font-size-5xl:       3rem;      /* 48px */

  --font-weight-regular:  400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;
  --font-weight-bold:     700;

  --line-height-tight:  1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* Spacing (4px base grid) */
  --space-1:   0.25rem;   /* 4px  */
  --space-2:   0.5rem;    /* 8px  */
  --space-3:   0.75rem;   /* 12px */
  --space-4:   1rem;      /* 16px */
  --space-5:   1.25rem;   /* 20px */
  --space-6:   1.5rem;    /* 24px */
  --space-8:   2rem;      /* 32px */
  --space-10:  2.5rem;    /* 40px */
  --space-12:  3rem;      /* 48px */
  --space-16:  4rem;      /* 64px */
  --space-20:  5rem;      /* 80px */
  --space-24:  6rem;      /* 96px */

  /* Layout */
  --max-width: 1200px;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px;
}

/* =========================================
   RESET
   ========================================= */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

/* =========================================
   BASE TYPOGRAPHY
   ========================================= */
body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  color: var(--color-text);
  background-color: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

img, svg {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

ul, ol {
  list-style: none;
}
```

---

## State & Data Flow

Not applicable — static HTML/CSS, no state.

---

## API Contracts Consumed

None.

---

## Loading & Skeleton States

| State | Behavior |
|-------|----------|
| Initial load | Browser renders HTML + CSS instantly, no async |
| Font load | FOUT acceptable — Inter loads via `display=swap` |

---

## Responsive Behavior

| Breakpoint | Notes |
|------------|-------|
| All | Design tokens are global — apply uniformly at all widths |
| Token override | No breakpoint overrides in this task — task-002/003/004 add responsive rules |

---

## Analytics Events

None.

---

## Performance Considerations

- `rel="preconnect"` on Google Fonts domain reduces DNS lookup time
- `font-display: swap` (via Google Fonts URL param) prevents render blocking
- No JavaScript — zero JS parse cost

---

## TDD Test Plan

| Test Case | AC | Type | Description |
|-----------|----|------|-------------|
| `index.html` opens with no console errors | AC-1 | manual | Open in Chrome, check DevTools Console |
| `<meta charset="UTF-8">` present | AC-1 | manual | View source |
| `<meta name="viewport">` present | AC-1 | manual | View source |
| `<title>` is non-empty | AC-1 | manual | View source |
| `<meta name="description">` present | AC-1 | manual | View source |
| `styles/main.css` linked and loads (200) | AC-2 | manual | Network tab — no 404 |
| CSS reset applied — `body` margin is 0 | AC-2 | manual | DevTools computed styles |
| `--color-primary` = `#E97F45` on `:root` | AC-3 | manual | DevTools → `:root` computed |
| `--color-bg` = `#1A1A1A` on `:root` | AC-3 | manual | DevTools → `:root` computed |
| `--font-size-base` = `1rem` on `:root` | AC-4 | manual | DevTools → `:root` computed |
| `--font-weight-bold` = `700` on `:root` | AC-4 | manual | DevTools → `:root` computed |
| `--space-4` = `1rem` on `:root` | AC-5 | manual | DevTools → `:root` computed |
| `assets/` folder exists | AC-6 | manual | Check file system |
| `styles/` folder exists | AC-6 | manual | Check file system |

---

## Edge Cases & Error States

- **Google Fonts blocked** (firewall/offline): `font-family` fallback chain handles gracefully — system font renders
- **CSS file 404**: layout breaks for all tasks — ensure path `styles/main.css` exactly matches `<link href>`

---

## Accessibility Notes

- `<html lang="en">` set — screen readers announce language correctly
- `scroll-behavior: smooth` — avoid for users with `prefers-reduced-motion` (add override in task-004 polish)
- Color contrast: `--color-primary` (`#E97F45`) on `--color-bg` (`#1A1A1A`) = 4.6:1 — passes WCAG AA for large text
