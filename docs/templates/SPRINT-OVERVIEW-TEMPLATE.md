# [sprint-id] — [Epic Title]

## Metadata
| Field | Value |
|-------|-------|
| **Sprint ID** | sprint-XX |
| **Status** | planning / active / done |
| **Start Date** | YYYY-MM-DD |
| **End Date** | YYYY-MM-DD |
| **Team** | - |
| **Epic Owner** | - |

## Problem Statement
<!-- WHY are we building this? What user or business problem does this sprint solve? -->

## Goals
<!-- What does success look like at the end of this sprint? 3–5 clear goals. -->
1.
2.
3.

## Success Metrics
<!-- How do we measure that this sprint delivered value in production? -->
| Metric | Target | Measurement |
|--------|--------|-------------|
| - | - | - |

## Design References
<!-- Overall Figma, wireframes, or prototype links for this epic. -->
- Figma: [link]
- Prototype: [link]

## Scope

### In Scope
-

### Out of Scope
-

## Sub-tasks

```mermaid
flowchart LR
    t001[task-001\nTitle] --> t002[task-002\nTitle]
    t001 --> t003[task-003\nTitle]
    t002 --> t004[task-004\nTitle]
    t003 --> t004

    style t001 fill:#f9f,stroke:#333
    style t002 fill:#bbf,stroke:#333
    style t003 fill:#bbf,stroke:#333
    style t004 fill:#bfb,stroke:#333
```

| Task ID | Title | Depends On | Status |
|---------|-------|------------|--------|
| task-001 | - | — | `todo` |
| task-002 | - | task-001 | `todo` |
| task-003 | - | task-001 | `todo` |
| task-004 | - | task-002, task-003 | `todo` |

## Technical Constraints
<!-- Architectural decisions, existing system limitations, or non-negotiables. -->
-

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| - | - | - | - |

## Definition of Done (Sprint Level)

**"Done" means the sprint delivered its stated goals — not just that tasks were closed.**

### Completeness
- [ ] All sub-tasks are `done` (each verified against their own task-level DoD)
- [ ] Every in-scope item from the discovery doc is covered — nothing silently dropped

### Correctness
- [ ] All sprint Goals (listed above) are observably achieved — not assumed
- [ ] Every Success Metric shows an actual result (number), not just "instrumented"
- [ ] No P0 or P1 bugs open against this sprint's scope
- [ ] Full regression suite passes — no existing feature broken by this sprint

### Delivery
- [ ] Deployed to production (or staging if prod deploy is gated)
- [ ] Smoke-tested end-to-end in the deployed environment
- [ ] Sprint retro written — includes what went well, what didn't, and follow-up actions
