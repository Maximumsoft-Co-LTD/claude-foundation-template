---
type: concept
tags: [agile, estimation, planning-poker, story-points, t-shirt-sizing]
related: [CON-sprint-mechanics, CON-scrum-artifacts]
updated: 2026-03-25
source: template
---

# Estimation Techniques

## Why Estimate?

- Sprint planning: how much can we commit to?
- Release planning: when will features be ready?
- Stakeholder management: set expectations

**Key insight:** Estimates are probabilistic, not promises.

---

## Story Points (Relative Estimation)

Story points measure **complexity + uncertainty + effort** relative to other stories — NOT hours.

```
Fibonacci scale: 1, 2, 3, 5, 8, 13 (21+ = must split)

Calibration example:
  "User can reset password via email link" = 3 pts (baseline)
  "User can log in" = 2 pts (simpler than reset)
  "User can log in with Google OAuth" = 5 pts (more complex)
  "User can manage team members with roles" = 8 pts (much more)
```

**Advantages over hours:**
- No false precision (hours feel concrete but aren't)
- Accounts for uncertainty naturally
- Team velocity is stable in points, not hours
- Points don't change with team size

---

## Planning Poker

Process:
```
1. PO reads user story + acceptance criteria
2. Team asks clarifying questions
3. Everyone picks card SIMULTANEOUSLY (Fibonacci deck)
   → Simultaneous to avoid anchoring bias
4. Reveal all cards
5. Discuss outliers (highest AND lowest vote)
   → "Why did you vote 2?" + "Why did you vote 8?"
6. Re-vote (usually converge in 2 rounds)
7. Record agreed estimate
```

**Online tools:** PlanningPoker.com, Jira planning poker, Miro

---

## T-Shirt Sizing (For Roadmap / Early Discovery)

When stories aren't refined enough for story points:

| Size | Rough Story Points | Days |
|------|-------------------|------|
| XS | 1-2 | < 1 day |
| S | 3 | 1-2 days |
| M | 5 | 3-4 days |
| L | 8 | 1 week |
| XL | 13+ | Must split |

Good for: Roadmap planning, discovery phase, epics

---

## Affinity Mapping (Speed Estimation)

Fast technique for estimating many stories at once:
```
1. Write each story on sticky note
2. Team simultaneously sorts stories into buckets (S/M/L)
3. Discuss disagreements only
4. Convert buckets to points
```

Takes 1-2 hours for 50 stories vs. hours for Planning Poker.

---

## Common Estimation Anti-Patterns

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| Estimating in hours | False precision, changes with skills | Use story points |
| Manager sets estimates | Removes team ownership | Team estimates |
| Inflation for padding | Distorts velocity | Track as risk/dependency instead |
| "We'll figure it out" | Commits to unknown scope | Time-box as spike |
| Estimating bugs | Bugs are unpredictable | Use separate bug budget |

---

## Spike (Time-boxed Research)

When a story can't be estimated because too much is unknown:
```
Create a "spike" story:
  Title: [SPIKE] Research OAuth2 integration options
  Points: Fixed time-box (e.g., 1 day = 8 hrs)
  Output: Recommendation + rough estimate for real story

Spike is NOT about completing the work — it's about learning enough to estimate.
```

## Related

- [[CON-sprint-mechanics]] — velocity uses estimates
- [[CON-scrum-ceremonies]] — planning poker in Sprint Planning
- [[../../CON-story-points]] — this project's sizing rules
- [[../../00-MOC/MOC-Agile-Scrum]]
