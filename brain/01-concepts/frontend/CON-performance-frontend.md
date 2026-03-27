---
type: concept
tags: [frontend, performance, Core-Web-Vitals, optimization, bundle-size]
related: [CON-component-architecture, CON-state-management]
updated: 2026-03-25
source: template
---

# Frontend Performance

## Core Web Vitals (Google's Metrics)

| Metric | Measures | Good | Needs Work |
|--------|---------|------|-----------|
| **LCP** (Largest Contentful Paint) | Load speed of main content | < 2.5s | > 4s |
| **INP** (Interaction to Next Paint) | Responsiveness to user input | < 200ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | Visual stability (no jumpy content) | < 0.1 | > 0.25 |

## Bundle Size Optimization

```
Tools: webpack-bundle-analyzer, vite-bundle-visualizer

Techniques:
1. Code Splitting (lazy load routes)
   const Dashboard = lazy(() => import('./pages/Dashboard'))

2. Dynamic imports (load on demand)
   const { heavy } = await import('./heavyLib')

3. Tree shaking (eliminate dead code)
   import { specific } from 'lodash'  // ✅ tree-shakeable
   import _ from 'lodash'             // ❌ imports all

4. Externals (CDN for large libs)
   React from CDN, not in bundle
```

## Rendering Strategies

| Strategy | When to Use | Example |
|----------|-----------|---------|
| **CSR** (Client-Side Rendering) | Dashboard, authenticated, dynamic | React SPA |
| **SSR** (Server-Side Rendering) | SEO needed, fast first load | Next.js pages |
| **SSG** (Static Site Generation) | Marketing, blogs, rarely changing | Next.js static |
| **ISR** (Incremental Static Regen) | Mix: static but refreshable | Next.js with revalidate |
| **Streaming** | Large pages, partial hydration | React Suspense |

## React Performance Optimization

```typescript
// 1. React.memo — skip re-render if props unchanged
const UserCard = React.memo(({ user }: { user: User }) => (
  <div>{user.name}</div>
))

// 2. useMemo — memoize expensive calculation
const sortedUsers = useMemo(
  () => users.sort((a, b) => a.name.localeCompare(b.name)),
  [users]  // Only recalculate when users changes
)

// 3. useCallback — stable function reference
const handleClick = useCallback(
  (id: string) => router.push(`/users/${id}`),
  [router]
)

// When to use: Only when profiler shows actual performance issue
// Premature optimization: useMemo/useCallback on every function
```

## Image Optimization

```tsx
// Next.js Image component — automatic optimization
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority  // LCP image: preload
  placeholder="blur"  // Prevent CLS
  sizes="(max-width: 768px) 100vw, 1200px"
/>

// Manual: always specify width + height to prevent CLS
// Use WebP/AVIF format (50% smaller than JPEG)
// Lazy load below-fold images (loading="lazy")
```

## List Virtualization

For lists > 100 items — only render visible items:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,  // Row height
  })

  return (
    <div ref={parentRef} style={{ height: '500px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Performance Profiling Process

```
1. Measure first (don't guess)
   Chrome DevTools → Performance tab → Record → Analyze

2. Identify bottleneck type:
   → Long JS tasks: optimize/split computation
   → Slow network: caching, CDN, compression
   → Layout shifts: specify image dimensions
   → Too many re-renders: React DevTools Profiler

3. Fix one thing at a time
4. Measure again to confirm improvement

Lighthouse audit: Chrome DevTools → Lighthouse → Analyze
```

## Related

- [[CON-component-architecture]] — component design affects performance
- [[CON-state-management]] — unnecessary state = unnecessary renders
- [[CON-api-integration]] — server state caching reduces requests
- [[../../../00-MOC/MOC-Frontend]]
