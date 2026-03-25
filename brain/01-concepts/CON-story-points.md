---
type: concept
tags: [sizing, planning, story-points]
related: [CON-vertical-slice, CON-sprint-lifecycle]
updated: 2026-03-25
---

# Story Points

## Scale

| Points | Size | Rule |
|--------|------|------|
| **1** | Trivial | Minimal docs — what changes + ACs + brief approach |
| **2** | Small | Core docs — ACs + user stories + approach + basic tests |
| **3** | Medium-small | Standard docs — full requirement + core design |
| **5** | Medium | Extended docs — most sections, system-level design |
| **8** | Large | All sections + full rigor (ADRs, perf, analytics, a11y) |
| **13** | ⛔ Too big | **Block** — break into smaller tasks before any work begins |

## The 13-Point Rule

Tasks estimated at 13 points are **automatically blocked**. No design, no implementation, no code — until the task is decomposed into smaller tasks that each fit in 1–8 points.

This is a hard constraint, not a suggestion.

## What Points Include

Points measure **scope of change** (FE + BE + tests + docs), not raw effort. A 3-point task should be completable by one person in 1–3 days.

## Doc Requirements by Points

| Doc | 1pt | 2pt | 3pt | 5pt | 8pt |
|-----|-----|-----|-----|-----|-----|
| Requirement | Problem + ACs | + Stories + Dependencies | + Feature Flow + Business Rules | + Analytics + UI Copy | + NFR + Open Qs |
| FE Design | Approach + Components + TDD | + API Contracts + State Flow | + Impl Plan + E2E | + Routing + Edge Cases | + Performance + A11y |
| BE Design | Endpoint + TDD | + Validation + full TDD Plan | + Data Models + Service Layer | + Auth + Sequence Diagram | + Caching + Perf |

## Related

- [[CON-vertical-slice]] — why tasks should be E2E slices
- [[CON-sprint-lifecycle]] — how sizing fits the planning flow
