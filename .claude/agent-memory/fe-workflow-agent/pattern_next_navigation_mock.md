---
name: next/navigation mock in Jest
description: Any component using useSearchParams/useRouter requires jest.mock('next/navigation') in every test file that imports it — including pre-existing test files for components that statically import the updated component
type: project
---

When a component gains `useSearchParams()` or `useRouter()` from `next/navigation`, add this mock to **every** test file that imports the component (directly or transitively via static import):

```ts
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null } as unknown as ReadonlyURLSearchParams),
  useRouter: () => ({ push: jest.fn() }),
}));
```

**Why:** `next/navigation` hooks are unavailable in jsdom. Without the mock, any test file that statically imports the component will throw on hook invocation — including pre-existing test files written before the hooks were added.

**How to apply:** When modifying an existing component to add navigation hooks, scan all `__tests__/**/*.test.tsx` files for static imports of that component and add the mock before those imports.

Discovered during SP1-T005 when LeaderboardPage gained `useSearchParams`/`useRouter` and the T004 `leaderboard-fe.test.tsx` broke until the mock was added retroactively.
