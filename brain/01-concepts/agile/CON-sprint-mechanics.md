---
type: concept
tags: [scrum, sprint, velocity, capacity, burndown]
related: [CON-scrum-ceremonies, CON-scrum-artifacts]
updated: 2026-03-25
---

# Sprint Mechanics

## Sprint Duration

- Fixed — same length every sprint (1, 2, or 4 weeks)
- **Most common: 2 weeks** — enough time to deliver, short enough to pivot
- Never extend a sprint — better to cut scope

## Velocity

**Definition:** Average story points completed per sprint (last 3 sprints)

```
Sprint 1: 32 pts
Sprint 2: 28 pts
Sprint 3: 35 pts
Velocity = (32 + 28 + 35) / 3 = 31.7 ≈ 32 pts
```

**Uses:**
- Sprint capacity planning (don't commit > velocity)
- Release date forecasting

**Anti-patterns:**
- Using velocity to compare teams (different teams, different scales)
- Inflating estimates to "show high velocity"
- Including partial stories in velocity (only count fully Done)

## Capacity Planning

```
Capacity = (Team size) × (sprint days) × (focus factor)

Example:
  Team: 4 developers
  Sprint: 10 working days
  Focus factor: 70% (meetings, reviews, etc.)

  Capacity = 4 × 10 × 0.7 = 28 dev-days
  Convert to story points using team's point-to-day ratio
```

## Sprint Burndown Chart

```
Story Points
40 |*
   | *
30 |  *    ← ideal line
   |   *
20 |    *
   |    *  ← actual (falling behind)
10 |      *
   |        *
 0 +--+--+--+--+--
   D1 D3 D5 D7 D9 D10
```

**Reading:**
- Above ideal line → falling behind → re-scope or work faster
- Below ideal line → ahead of schedule → pull more from backlog

## User Story Estimation

**Planning Poker:**
1. PO reads story
2. Team asks questions
3. Everyone votes simultaneously (Fibonacci cards)
4. Discuss outliers (highest + lowest vote)
5. Re-vote until consensus

**Fibonacci scale:** 1, 2, 3, 5, 8, 13 (21 = too big, split it)

**Story Points measure:** Complexity + Uncertainty + Effort (not just hours)

## Related

- [[CON-scrum-ceremonies]] — sprint planning, daily, review
- [[CON-scrum-artifacts]] — sprint backlog, increment
- [[../../../CON-story-points]] — this project's story point rules
- [[../../../00-MOC/MOC-Agile-Scrum]]
