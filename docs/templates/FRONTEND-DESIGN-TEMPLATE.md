# [task-id] — [Title] — Frontend Design

## Metadata
| Field | Value |
|-------|-------|
| **Requirement** | `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` |
| **Assignee** | - |
| **Status** | draft / ready / implemented |

## Design References
<!-- Figma frames, Storybook links, or screenshots. Be specific — link to the exact frame. -->
- Figma: [link]
- Storybook: [link]

## UI/UX Overview
<!-- Describe each screen, modal, or user flow this task introduces or changes. -->

## User Journey Map
<!-- Map the desired user journey (to-be state). Score 1–5 per step: 1=frustrated, 5=delighted. -->

```mermaid
journey
    title [Feature Name] — User Journey
    section Entry
        Lands on page          : 3 : User
        Content loads          : 4 : User
    section Main Flow
        Performs key action    : 4 : User
        Sees feedback          : 5 : User
    section Exit
        Completes goal         : 5 : User
        Navigates away         : 3 : User
```

**Entry point:** where does the user come from before this flow?
**Exit point:** where does the user go after this flow?

## Behavior Mapping
<!-- For each interaction: what the user does → what the UI does → intended feeling. -->

```mermaid
flowchart TD
    A([User arrives]) --> B{First load}
    B -->|loading| C[Skeleton screen\n😐 patient]
    B -->|loaded| D[Content visible\n😊 confident]
    D --> E{User action}
    E -->|submits| F[Spinner + disabled\n🤔 waiting]
    F -->|success| G[Success state\n✅ accomplished]
    F -->|error| H[Inline error\n😟 informed]
    H --> E
    G --> I([Exit flow])
```

**Key behavioral goals:**
<!-- What habits to reinforce? What friction to remove? -->
-

## Routing & Navigation
<!-- List any new routes or changes to existing routes. -->

| Route | Component | Auth required | Notes |
|-------|-----------|---------------|-------|
| `/path` | `PageComponent` | yes / no | |

## Component Breakdown
<!-- List every component to create or modify. -->

| Component | File path | Type | Description |
|-----------|-----------|------|-------------|
| `ComponentName` | `src/components/...` | new / modify | |

## State & Data Flow
<!-- How does data move through this feature? Where does state live? -->

```mermaid
flowchart LR
    API[API / Server] -->|fetch| Store[State Store\nglobal / local]
    Store -->|props| Container[Container\nComponent]
    Container -->|props| UI[UI Component]
    UI -->|event| Action[User Action]
    Action -->|dispatch / mutate| Store
    Action -->|call| API
```

## API Contracts Consumed
<!-- Every backend endpoint this feature calls. Must align with be-design. -->

| Method | Endpoint | Request | Response | Error handling |
|--------|----------|---------|----------|----------------|
| GET | `/api/...` | - | `{ ... }` | show toast / redirect |

## Loading & Skeleton States
<!-- Describe loading UX for every async operation. -->

| State | Behavior |
|-------|----------|
| Initial load | Skeleton screen |
| Submitting form | Button disabled + spinner |
| Error | Inline error message |
| Empty | Empty state illustration + CTA |

## Responsive Behavior
<!-- Define layout changes across breakpoints. -->

| Breakpoint | Behavior |
|------------|----------|
| Mobile (< 768px) | |
| Tablet (768–1024px) | |
| Desktop (> 1024px) | |

## Analytics Events
<!-- Events to fire. Must match Analytics & Tracking section in requirement. -->

| Event name | Trigger | Payload |
|------------|---------|---------|
| `event_name` | user clicks X | `{ userId, ... }` |

## Performance Considerations
<!-- Lazy loading, code splitting, memoization, image optimization. -->
-

## TDD Test Plan
<!-- Write these BEFORE implementing. One row per test case. Map each to an AC. -->

| Test Case | AC | Type | Description |
|-----------|----|------|-------------|
| renders correctly | AC-1 | unit | snapshot or visual assertion |
| shows skeleton while loading | AC-1 | unit | |
| displays error message on API failure | AC-2 | unit | |
| user action dispatches correct event | AC-3 | integration | |
| mobile layout renders correctly | - | unit | |

## E2E Test Plan
<!-- Write these BEFORE implementing. Every AC must have at least one E2E scenario.
     E2E tests run against real stack (real browser, real API, real DB).
     Format: Given [starting state] → When [user actions] → Then [observable outcomes]. -->

| Scenario | AC | Steps (user actions) | Expected Outcome |
|----------|----|----------------------|------------------|
| Happy path: [main flow] | AC-1 | 1. Navigate to [URL]<br>2. [User action]<br>3. [User action] | [What user sees / URL / state] |
| Error path: [fail scenario] | AC-2 | 1. Navigate to [URL]<br>2. [Action that triggers error] | [Error message / behavior] |
| Auth guard: unauthenticated access | — | 1. Visit [protected URL] without login | Redirected to login, return URL preserved |

<!-- Add one row per AC. Scenarios should cover happy path + key failure paths only.
     Do NOT duplicate unit test coverage here — focus on full user journeys. -->

## Fail Cases & Fail Flows
<!-- For every user action that can fail: what the UI shows, what data is preserved, and how the user recovers. -->

### Fail Flow Diagram
<!-- Map all failure paths for the main action(s) in this flow. -->

```mermaid
flowchart TD
    A[User Action] --> B[API Call]
    B -->|success| C[Success State]
    B -->|network error| D[Retry banner\npreserve input]
    B -->|400 validation| E[Inline field errors\nstay on form]
    B -->|401| F[Redirect to login\npreserve return URL]
    B -->|403| G[Permission error\nno retry]
    B -->|500| H[Generic error\noffer retry]
    D -->|user retries| B
    H -->|user retries| B
```

### Fail Case Matrix
<!-- One row per failure scenario. Every row must map to a TDD test case. -->

| Action | Fail Scenario | UI Behavior | User Can | Input Preserved? |
|--------|--------------|-------------|----------|-----------------|
| Submit form | 400 validation | Inline errors per field | Fix and resubmit | Yes |
| Submit form | 500 server error | Toast + retry button | Retry or cancel | Yes |
| Submit form | Network timeout | Retry banner | Retry | Yes |
| Load page | 404 not found | Empty state + CTA | Navigate away | N/A |
| Load page | 500 error | Error page + refresh | Refresh | N/A |

### Optimistic Update Rollback
<!-- If this feature updates the UI before the API confirms, define rollback behavior. -->

- **Optimistic update used:** yes / no
- **Rollback trigger:** [what event causes rollback]
- **Rollback behavior:** [what reverts, what the user sees, any toast/notification]

_If no optimistic updates: write "None — all UI updates wait for API confirmation."_

### Partial Success Handling
<!-- For batch or multi-step operations: what if only some parts succeed? -->

- **Scenario:** e.g. uploading 5 files — 3 succeed, 2 fail
- **UI behavior:** show success count + failed items list
- **User path:** retry failed items or cancel remaining

_If no batch operations: write "None — this flow is single atomic operation."_

### Multi-step / Wizard Rollback
<!-- If this flow has multiple steps: what happens when a later step fails? -->

| Fails at | Returns to | State preserved | User sees |
|----------|-----------|-----------------|-----------|
| Step N | Step N | Steps 1–(N-1) | Error message + option to retry |

_If single-step flow: write "None — single step, no rollback needed."_

## Edge Cases & Error States
<!-- Boundary conditions beyond the fail flows above. -->
- Network timeout:
- Empty list:
- Unauthorized (401):
- Server error (500):
- Session expired mid-flow:
- Concurrent edit (another user modified same data):

## Accessibility Notes
<!-- Keyboard nav, focus management, ARIA labels, color contrast. -->
-
