# [task-id] — [User Story] — Frontend Design

## Metadata

| Field           | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| **Requirement** | `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` |
| **Points**      | 1 / 2 / 3 / 5 / 8                                            |
| **Assignee**    | -                                                             |
| **Status**      | draft / ready / implemented                                   |

<!-- Section scope by points: see /design fe command -->

## Approach
<!-- 1pt+ required -->

## Design References
<!-- See requirement doc for Figma / Storybook / external design links -->

## UI/UX Overview
<!-- 3pt+ -->

## User Journey Map
<!-- 5pt+ -->
<!-- Entry point → main flow → exit point. Use mermaid journey diagram. -->

**Entry point:**
**Exit point:**

## Behavior Mapping
<!-- 5pt+ -->

### Entry Paths

| Entry path | How they get here | Pre-loaded state / context |
| ---------- | ----------------- | -------------------------- |
|            |                   |                            |

### Behavior Flow
<!-- mermaid flowchart showing all interactions including fail states -->

### Fail State Summary

| Fail state | What user sees | Feeling | Can recover? |
| ---------- | -------------- | ------- | ------------ |
|            |                |         |              |

## State Inventory
<!-- 5pt+ -->
<!-- mermaid stateDiagram-v2 + table -->

| Component | States | Notes |
|-----------|--------|-------|
|           |        |       |

## Design Decisions
<!-- 8pt — ADR entries for non-obvious choices -->

| Decision | Why | Alternatives Rejected |
|----------|-----|-----------------------|
|          |     |                       |

## Routing & Navigation
<!-- 5pt+ -->

| Route | Component | Auth required | Notes |
| ----- | --------- | ------------- | ----- |
|       |           |               |       |

## Existing Code Context
<!-- 1pt+ required. Reuse first, build new second. -->

**Components available:**
| Component | File path | Notes |
|-----------|-----------|-------|
|           |           |       |

**Hooks available:**
| Hook | File path | Notes |
|------|-----------|-------|
|      |           |       |

**Project patterns to follow:**
-

## Environment / Config Dependencies
<!-- 2pt+ required -->

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
|          |         |          |         |

## Component Breakdown
<!-- 2pt+ -->

| Component | File path | Type | Description |
| --------- | --------- | ---- | ----------- |
|           |           | new / modify |   |

## Async Interaction Sequence
<!-- 3pt+ — mermaid sequenceDiagram showing user actions, API calls, state updates -->

## State & Data Flow
<!-- 2pt+ -->
<!-- mermaid flowchart: [API/Store] → [Container] → [Props] → [UI] → [Action] → [Dispatch] -->

## API Contracts Consumed
<!-- 2pt+ -->

| Method | Endpoint | Request | Response | Error handling |
| ------ | -------- | ------- | -------- | -------------- |
|        |          |         |          |                |

## Loading & Skeleton States
<!-- 3pt+ -->

| State | Behavior |
| ----- | -------- |
| Initial load | |
| Submitting | |
| Error | |
| Empty | |

## Responsive Behavior
<!-- 5pt+ -->

| Breakpoint | Behavior |
| ---------- | -------- |
| Mobile (< 768px) | |
| Tablet (768–1024px) | |
| Desktop (> 1024px) | |

## Analytics Events
<!-- 5pt+ -->

| Event name | Trigger | Payload |
| ---------- | ------- | ------- |
|            |         |         |

## Performance Considerations
<!-- 5pt+ -->

-

## Scope Overview
<!-- 2pt+ — 3–6 bullets. High-level scope for orientation BEFORE the detailed Implementation Plan. Group by layer or feature area (e.g. Routing / Components / State / API / E2E). Each bullet = one paragraph-level chunk of work, not a micro-step. -->
- **[Area]:** [what gets built at the high level]

## Implementation Plan
<!-- 3pt+ -->
<!-- Ordered steps. Each step: [N]. [file path] — create/modify — [what] — [design ref]. /implement follows this exactly. -->

| # | Phase | File path | Action | What to implement | References |
|---|-------|-----------|--------|-------------------|------------|
| 1 | Routing | | | | |
| 2 | Components | | | | |
| 3 | State | | | | |
| 4 | API | | | | |
| 5 | Loading/Error | | | | |

## TDD Test Plan
<!-- 2pt+ -->
<!-- Write BEFORE implementing. Min 1 unit + 1 integration per AC. -->

| Test Case | AC | Type | Description |
| --------- | -- | ---- | ----------- |
|           |    | unit / integration | |

## E2E Test Plan
<!-- 3pt+ -->

| Scenario | AC | Steps | Expected Outcome |
| -------- | -- | ----- | ---------------- |
|          |    |       |                  |

## Fail Cases & Fail Flows
<!-- 3pt+ -->

### Fail Flow Diagram
<!-- mermaid flowchart showing every error path -->

### Fail Case Matrix

| Action | Fail Scenario | Presentation | Error Message | Recovery CTA | Input Preserved? |
| ------ | ------------- | ------------ | ------------- | ------------ | ---------------- |
|        |               | toast / inline / modal / page-level | | | |

### Optimistic Update Rollback

- **Used:** yes / no
- **Rollback trigger:**
- **Rollback behavior:**

### Partial Success Handling

- **Scenario:**
- **UI behavior:**

## Edge Cases & Error States
<!-- 5pt+ required -->

- Network timeout:
- Empty list:
- 401:
- 500:
- Session expired mid-flow:

## Accessibility Notes
<!-- 5pt+ -->

-
