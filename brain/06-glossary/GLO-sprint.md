---
type: glossary
term: Sprint
tags: [agile, scrum, planning, iteration, team]
updated: 2026-03-25
---

# Sprint

**Definition:** A fixed-length iteration (typically 1-4 weeks) in Scrum during which a cross-functional team commits to delivering a potentially shippable increment of the product.

## Core Characteristics

- **Time-boxed:** Fixed duration (e.g., 2 weeks); never extended
- **Committed scope:** Team commits to a set of user stories at sprint start
- **Potentially shippable:** Deliverable should be production-ready (or nearly so)
- **Self-contained:** Sprint has clear start/end; retrospective captures learnings

## Sprint Duration

| Duration | Typical Use | Pros | Cons |
|----------|------------|------|------|
| **1 week** | Rapid feedback, high-change environments | Frequent delivery, agility | Overhead per sprint, less depth |
| **2 weeks** | Most common standard | Balanced; good feedback loop | — |
| **3-4 weeks** | Longer cycles, big epics | More time per story, fewer ceremonies | Slower feedback, harder to pivot |

Most teams use **2-week sprints** as a default.

## Sprint Timeline (2-Week Example)

### Monday — Sprint Planning
```
Time: 2 hours
Attendees: PO, dev team, scrum master
Outcome: User stories committed, team understands scope

Activity:
- PO presents refined stories
- Team asks clarifying questions
- Team estimates/sizes stories (story points)
- Team commits to stories for the sprint
- "As a [role], I want [goal], so that [benefit]"
```

### Tuesday-Thursday — Development
```
Time: Daily work (daily standup 15 min each day)
Attendees: Dev team only
Standup format:
- "Yesterday I... (completed story X, fixed bug Y)"
- "Today I... (start story Z, pair with Sarah on auth)"
- "Blocked by... (waiting on API from backend team)"
```

### Friday — End of Sprint
```
Morning: Continued development
Afternoon: Sprint Review + Retrospective

Sprint Review (1 hour):
- Team demos completed stories to stakeholders
- Stakeholders ask questions, give feedback
- PO accepts or rejects stories based on AC

Sprint Retrospective (1 hour):
- Team reflects on process: "What went well? What was hard?"
- Identify 1-3 improvements for next sprint
- Example: "We pair-programmed more; fewer bugs in review"
```

### Monday (Following) — Next Sprint Begins
```
Cycle repeats
```

## Example Sprint

**Sprint 1: March 1–14, 2026**

**Committed Stories (13 story points):**
1. "User can sign up with email" (5 points)
2. "User receives confirmation email" (3 points)
3. "User can log in with password" (5 points)

**Result:**
- ✅ All 3 stories completed and accepted
- Velocity: 13 points

**Retrospective findings:**
- ✅ Good: Pair programming on email service prevented bugs
- ❌ Bad: Waiting for API design slowed down story 1
- 📈 Next sprint: Get API design earlier in the sprint

---

**Sprint 2: March 15–28, 2026**

**Committed Stories (18 story points):**
1. "User can reset password" (5 points)
2. "Admin can view user accounts" (8 points)
3. "System sends password reset email" (5 points)

**Result:**
- ✅ Stories 1 & 3 completed (10 points)
- 🔴 Story 2 incomplete (8 points); moved to Sprint 3
- Velocity: 10 points (lower than Sprint 1)

**Retrospective findings:**
- ❌ Bad: Story 2 was harder than expected (13 points was too large)
- ✅ Good: Early API design (from Sprint 1) helped
- 📈 Next sprint: Break 13+ point stories into smaller stories before sprint

---

## Velocity & Burndown

### **Velocity**
The average number of story points a team completes per sprint.

```
Sprint 1: 13 points
Sprint 2: 10 points
Sprint 3: 15 points
Sprint 4: 12 points

Average velocity: 12.5 points/sprint
```

**Use:** Plan future sprints based on historical velocity. If velocity is 12.5 points/sprint and the team is healthy, commit to 12–13 points next sprint.

### **Burndown Chart**
Visualizes progress throughout the sprint.

```
Story Points

20 |
   |     ●
15 |   ● ●
   | ●     ●
10 | ●       ●
   |           ●
 5 |             ●
   | _______________
 0 |Mon  Tue  Wed  Thu  Fri

Ideal line: straight diagonal
Actual line: bumpy (some days burn more, some less)
Completed by Friday: yes ✅
```

**Interpretation:**
- Line above ideal → behind schedule
- Line below ideal → ahead of schedule
- Straight through Friday → on track

## Sprint vs. Iteration vs. Release

| Term | Duration | Output | Release? |
|------|----------|--------|----------|
| **Sprint** | 1-4 weeks | Completed stories | Not always |
| **Iteration** | Generic term for any cycle | Features, fixes | Not always |
| **Release** | 1-4 sprints | Shipped to production | YES |

Example flow:
```
Sprint 1 (completed features) → Sprint 2 (more features) →
Release 1.0 (ship to production) → Sprint 3 (new features)
```

## Common Sprint Anti-Patterns

❌ **Changing scope mid-sprint** — "Just add this quick feature" → chaos
❌ **Pushing too hard** — 30 story points for a 2-week sprint → burnout
❌ **Not committing stories** — No plan; reactive chaos
❌ **Skipping retro** — Never improve; repeat same mistakes
❌ **Scope creep** — Accepting new stories during sprint

## Sprint Success Criteria

A sprint is **successful** when:
- ✅ Team meets or exceeds committed story points
- ✅ All completed stories meet acceptance criteria
- ✅ Code reviewed and tested
- ✅ No critical bugs outstanding
- ✅ Team can articulate 1-3 improvements for next sprint

## See Also

- [[CON-sprint-mechanics]] — Detailed breakdown of sprint structure
- [[CON-scrum-ceremonies]] — Sprint planning, standup, review, retro
- [[CON-sprint-lifecycle]] — How sprints fit into product development
- [[GLO-story-points]] — How to estimate sprint commitments
