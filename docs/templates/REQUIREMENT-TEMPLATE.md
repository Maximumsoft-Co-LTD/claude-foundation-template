# [task-id] — [Title]

## Metadata
| Field | Value |
|-------|-------|
| **Sprint** | sprint-XX |
| **Points** | 1 / 2 / 3 / 5 / 8 |
| **Priority** | critical / high / medium / low |
| **Assignee** | - |
| **Requester** | - |
| **Status** | todo |

<!-- Required sections by points — see CLAUDE.md Story Points Scale
  1pt : Problem Statement, ACs, Out of Scope, Done
  2pt : + User Stories, Dependencies, Test Data, Rollout Strategy
  3pt : + Feature Flow, System Behavior, Business Rules, Success Metrics
  5pt : + Design References, Analytics, UI Copy, DO/DON'T
  8pt : + NFR, Open Questions — add extra edge cases and constraints
  Write "N/A — Xpt task" for any section not required at this points level.
-->

## Problem Statement
<!-- WHY does this task exist? What pain point or opportunity does it address? -->

## Overview
<!-- 1pt+ — always required. One paragraph summary of what this task delivers. -->

## Feature Flow
<!-- High-level flowchart of the main user flow this task enables. -->

```mermaid
flowchart TD
    START([User starts]) --> A[Step 1]
    A --> B{Decision?}
    B -->|yes| C[Happy path]
    B -->|no| D[Alternate path]
    C --> END([Done])
    D --> END
```

## User Stories
| # | Story | Maps to AC |
|---|-------|-----------|
| US-1 | As a __, I want __, so that __. | AC-1, AC-2 |

## System Behavior
| Trigger | System Response | Side Effects | Timing |
|---------|----------------|-------------|--------|
| - | - | - | sync / async |

## Acceptance Criteria
<!-- Each AC must be specific, testable, and user-visible (observable from the browser/client).
     Format: multi-line GIVEN / WHEN / THEN / AND — no single-line summaries.
     ❌ BAD : "user สามารถ login ได้"
     ✅ GOOD:
       GIVEN user กรอก email + password ถูกต้อง
       WHEN กด submit
       THEN redirect ไป /dashboard ภายใน 2s
       AND session token ถูก set ใน httpOnly cookie
     Every AC must map to at least one E2E test scenario. -->

- [ ] **AC-1: [scenario title]**
  GIVEN [context — starting state or precondition]
  WHEN [user action or system event]
  THEN [observable outcome — what the user sees or what the system does]
  AND [additional outcome] _(remove if not needed)_

- [ ] **AC-2: [scenario title]**
  GIVEN [context]
  WHEN [action]
  THEN [outcome]

- [ ] **AC-3: [scenario title]**
  GIVEN [context]
  WHEN [action]
  THEN [outcome]

## Data & Business Rules
| Rule ID | Rule | Example | Applies to AC |
|---------|------|---------|--------------|
| R-1 | - | - | AC-X |

## Success Metrics
<!-- How do we know this task succeeded in production? -->
- [ ] Metric-1: e.g. error rate < 1%
- [ ] Metric-2: e.g. page load < 2s
- [ ] Metric-3: e.g. conversion rate increases by X%

## Design References
<!-- Figma links, mockups, wireframes, or screenshots. -->
- Figma: [link]
- Mockup: [link]

## Analytics & Tracking
<!-- Events, funnels, or metrics to instrument as part of this task. -->
- [ ] Event: e.g. `user_signed_up` — fired when AC-1 completes

## Open Questions
<!-- Questions that MUST be resolved before implementation starts. -->
<!-- Implementation must NOT start until all Open Questions are resolved. -->
| # | Question | Owner | Deadline | Decision |
|---|----------|-------|----------|----------|
| 1 | | | | |

## UI Copy
<!-- Exact strings for all visible text. No guessing during implementation. -->
| Location | Copy |
|----------|------|
| Page heading | |
| Submit button | |
| Empty state | |
| Success message | |
| Confirm dialog | |

## DO / DON'T
| DO | DON'T |
|----|-------|
| - | - |

## Non-Functional Requirements
| Category | Requirement | Target | How to Verify |
|----------|------------|--------|---------------|
| Performance | - | - | - |
| Security | - | - | - |
| Scalability | - | - | - |
| Reliability | - | - | - |

## Rollout / Release Strategy
<!-- 2pt+ — required for any user-visible change. For 1pt internal/refactor tasks write "N/A — no user-facing impact."
     How will this feature reach users? Prevents deploy-day assumptions. -->
- **Strategy:** all-at-once / feature flag / gradual rollout / internal-only first
- **Feature flag name:** `feature_flag_name` _(if applicable)_
- **Rollback plan:** [how to disable or revert if something goes wrong in prod]
- **Who gets it first:** [all users / specific cohort / internal team]

## Out of Scope
<!-- Explicitly list what is NOT included. Prevents scope creep. -->
-

## Dependencies
<!-- Other tasks, services, APIs, or team decisions this task waits on. -->
-

## Test Data / Seed Requirements
<!-- 2pt+ — required when the task has meaningful ACs that depend on existing data or config. For 1pt tasks write "N/A — no special data needed."
     Data or accounts needed before testing can begin. Prevents "works on my machine" blockers. -->
| What | Value / Setup | Who sets it up |
|------|---------------|----------------|
| Test account | e.g. `test@example.com / password123` | - |
| Seed data | e.g. 3 active products in DB | - |
| Feature flag | e.g. `new_checkout=true` | - |

_If no special data needed: write "None — standard dev environment is sufficient."_

## Definition of Done

**"Done" means correct — not just complete.**

### Functional Correctness
- [ ] Every AC passes — verified in a real browser against a real API and real DB
- [ ] Every error scenario in the Fail Case Matrix shows the correct message and behavior
- [ ] No AC is "assumed passing" — each one has a passing E2E test to prove it

### Test Coverage
- [ ] Unit tests written and green
- [ ] Integration tests written and green — real DB, no mocks
- [ ] E2E tests written and green — one scenario per AC + one per key error path
- [ ] No test is skipped, commented out, or marked `.only`

### Quality Gates
- [ ] No console errors or warnings in the browser during normal use
- [ ] Page load / API response within performance targets in Success Metrics
- [ ] No regression in existing flows touched by this task (run full suite)
- [ ] Code reviewed and approved — reviewer confirmed ACs, not just code style

### Design Fidelity
- [ ] UI matches Figma/mockup (if Design References are provided)
- [ ] All error states render correctly — not just happy path

### Delivery
- [ ] Deployed to staging and smoke-tested end-to-end by the implementer
- [ ] Success metrics instrumented and verified firing in staging
- [ ] BACKLOG.md updated to `done`
