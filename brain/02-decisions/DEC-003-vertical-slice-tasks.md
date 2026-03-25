---
type: decision
id: DEC-003
status: active
date: 2026-03-25
tags: [task-design, vertical-slice, fullstack, E2E]
---

# DEC-003 — Tasks Must Be Vertical Slices (E2E Testable)

## Status
`active`

## Context

There are two ways to decompose a feature into tasks:
1. **Horizontal** (by layer): "Build login API" → "Build login UI" → "Wire them together"
2. **Vertical** (by user outcome): "User can log in and see their dashboard"

Many teams default to horizontal decomposition because it matches team specialization (BE dev, FE dev).

## Decision

**Every task must be a vertical slice** — a complete, user-visible outcome spanning FE and BE, independently deployable and E2E testable.

Exception: pure infrastructure tasks (`infra` type) are exempt but must have integration tests.

## Rationale

Horizontal slices cause:
- Integration surprises at sprint end ("API done but UI can't use it")
- Incomplete features at sprint boundary (API done, UI not started)
- Delayed feedback — you only test the full flow at the very end
- Blocked dependencies ("FE can't start until BE is done")

Vertical slices enable:
- Independent demo of each task at any point
- Parallel discovery of integration issues early
- Clear definition of done (user can do X)
- Meaningful code review (full feature context)

## Consequences

**Positive:**
- Every merged task is a shippable increment
- Integration issues surface early
- Clear demo-ability for stakeholder reviews
- Simpler "done" definition

**Negative:**
- Requires FE and BE developers to collaborate within a task (not sequential)
- Task scope is harder to estimate upfront (both layers)
- May require feature flags for large partial features

## Related

- [[../01-concepts/CON-vertical-slice]]
- [[../01-concepts/CON-story-points]]
- [[../03-patterns/PAT-002-parallel-agent-implementation]]
