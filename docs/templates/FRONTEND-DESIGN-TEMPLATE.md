# [task-id] — [Title] — Frontend Design

## Metadata

| Field           | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| **Requirement** | `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` |
| **Points**      | 1 / 2 / 3 / 5 / 8                                            |
| **Assignee**    | -                                                             |
| **Status**      | draft / ready / implemented                                   |

<!-- Section scope by points: see /fe-design command -->

## Approach
<!-- 1pt+ required -->

## Design References

- Figma: [link]
- Storybook: [link]

## UI/UX Overview

## User Journey Map
<!-- Entry point → main flow → exit point. Use mermaid journey diagram. -->

**Entry point:**
**Exit point:**

## Behavior Mapping

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

| Component | File path | Type | Description |
| --------- | --------- | ---- | ----------- |
|           |           | new / modify |   |

## Async Interaction Sequence
<!-- 3pt+ — mermaid sequenceDiagram showing user actions, API calls, state updates -->

## State & Data Flow
<!-- mermaid flowchart: [API/Store] → [Container] → [Props] → [UI] → [Action] → [Dispatch] -->

## API Contracts Consumed

| Method | Endpoint | Request | Response | Error handling |
| ------ | -------- | ------- | -------- | -------------- |
|        |          |         |          |                |

## Loading & Skeleton States

| State | Behavior |
| ----- | -------- |
| Initial load | |
| Submitting | |
| Error | |
| Empty | |

## Responsive Behavior

| Breakpoint | Behavior |
| ---------- | -------- |
| Mobile (< 768px) | |
| Tablet (768–1024px) | |
| Desktop (> 1024px) | |

## Analytics Events

| Event name | Trigger | Payload |
| ---------- | ------- | ------- |
|            |         |         |

## Performance Considerations

-

## Implementation Plan
<!-- Ordered steps. Each step: [N]. [file path] — create/modify — [what] — [design ref]. /implement follows this exactly. -->

| # | Phase | File path | Action | What to implement | References |
|---|-------|-----------|--------|-------------------|------------|
| 1 | Routing | | | | |
| 2 | Components | | | | |
| 3 | State | | | | |
| 4 | API | | | | |
| 5 | Loading/Error | | | | |

## TDD Test Plan
<!-- Write BEFORE implementing. Min 1 unit + 1 integration per AC. -->

| Test Case | AC | Type | Description |
| --------- | -- | ---- | ----------- |
|           |    | unit / integration | |

## E2E Test Plan

| Scenario | AC | Steps | Expected Outcome |
| -------- | -- | ----- | ---------------- |
|          |    |       |                  |

## Fail Cases & Fail Flows

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

-
