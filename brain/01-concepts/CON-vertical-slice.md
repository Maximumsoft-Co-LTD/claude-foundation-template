---
type: concept
tags: [task-design, vertical-slice, E2E, fullstack]
related: [CON-story-points, CON-sprint-lifecycle]
updated: 2026-03-25
---

# Vertical Slice

## Definition

A task is a **vertical slice** if it delivers a **complete, user-visible outcome** that can be tested end-to-end — spanning both frontend and backend.

## The Test

Ask: *"Can a user do X and see Y as a result, in a running system?"*

If yes → valid vertical slice.

## Examples

| ✅ Valid (Vertical Slice) | ❌ Invalid (Horizontal Layer) |
|--------------------------|------------------------------|
| "User can log in and see their dashboard" | "Build login API endpoint" |
| "User can upload a profile photo and see it displayed" | "Create S3 upload handler" |
| "User can filter products by category" | "Add category filter to DB query" |

## Exception: Infrastructure Tasks

Pure infrastructure tasks (DB migrations, CI setup, monitoring) are exempt. These are marked as `infra` type and must still include integration tests.

## Why?

- Each task is independently deployable and demonstrable
- Avoids "the API is done but the UI isn't" stalls at sprint end
- Enables parallel work without integration surprises
- Forces upfront agreement on the full contract (API shape, UI behavior)

## Related Decision

[[../02-decisions/DEC-003-vertical-slice-tasks]]

## Story Points Impact

A vertical slice covering FE + BE naturally scopes to 3–8 points. If it requires 13, it must be split into smaller vertical slices.

See: [[CON-story-points]]
