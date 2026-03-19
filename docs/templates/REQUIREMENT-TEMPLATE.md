# [task-id] — [Title]

## Metadata
| Field | Value |
|-------|-------|
| **Sprint** | sprint-XX |
| **Priority** | critical / high / medium / low |
| **Estimate** | X days |
| **Assignee** | - |
| **Requester** | - |
| **Status** | todo |

## Problem Statement
<!-- WHY does this task exist? What pain point or opportunity does it address? -->

## Overview
<!-- What does this task deliver? One paragraph summary. -->

## User Stories
<!-- Format: As a [role], I want [goal], so that [reason]. -->
- As a __, I want __, so that __.

## Acceptance Criteria
<!-- Each AC must be specific, testable, and user-visible (observable from the browser/client).
     Format: "Given [context], when [user action], then [observable outcome]."
     Every AC must map to at least one E2E test scenario. -->
- [ ] AC-1: Given __, when __, then __.
- [ ] AC-2: Given __, when __, then __.
- [ ] AC-3: Given __, when __, then __.

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

## Out of Scope
<!-- Explicitly list what is NOT included. Prevents scope creep. -->
-

## Dependencies
<!-- Other tasks, services, APIs, or team decisions this task waits on. -->
-

## Definition of Done
- [ ] All acceptance criteria pass
- [ ] Success metrics are instrumented
- [ ] Unit tests written and green
- [ ] Integration tests written and green (real DB / real services — no mocks)
- [ ] E2E tests written and green — one scenario per AC
- [ ] Code reviewed and approved
- [ ] Deployed to staging and smoke-tested end-to-end
- [ ] BACKLOG.md updated to `done`
