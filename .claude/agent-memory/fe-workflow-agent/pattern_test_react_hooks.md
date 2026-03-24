---
name: react_hooks_test_pattern
description: How to test React components with hooks in Jest — static imports required, no resetModules()
type: feedback
---

Components that use React hooks (useState, useEffect, useCallback) MUST be imported statically at the top of the test file. Never call jest.resetModules() before dynamically require()-ing a component with hooks.

**Why:** jest.resetModules() causes a fresh copy of React to be loaded when the component is required. @testing-library/react's render() holds a reference to the original React instance. Two copies of React → "Invalid hook call" error at runtime.

**How to apply:**
- Static imports at top of .test.tsx for all components with hooks
- Only use jest.resetModules() + dynamic require() for pure utility functions (no React deps)
- LeaderboardPage, WeekRangeHeader, MemberRow, etc. — all statically imported in leaderboard-fe.test.tsx
- formatDuration, formatDistance, formatCalories — safe to use resetModules() + require() per-test
