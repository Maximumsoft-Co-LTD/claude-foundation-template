---
type: glossary
term: Story Points
tags: [agile, estimation, planning, scrum, sizing]
updated: 2026-03-25
---

# Story Points

**Definition:** A relative unit of estimation representing the effort, complexity, and uncertainty of a user story — not hours, not days, but a dimensionless measure of "how much work" compared to other stories.

## Why Story Points, Not Hours?

### Hours Are Unreliable
```
"Login feature will take 8 hours"
Problem:
- How many days is that? (8 hours = 1 day? 1.3 days?)
- Different developers work different speeds
- Interruptions, meetings, context switches aren't accounted for
- Estimates drift as requirements become clear
```

### Story Points Are Relative
```
"Login is a 3-pointer; Password reset is a 5-pointer"
Meaning:
- Password reset is ~1.67x more complex/effort than login
- Doesn't care about wall-clock time
- Team velocity (points/sprint) is empirical; not predicted
- Better accuracy over time as team learns what points mean
```

## The Scale: Fibonacci Sequence

Standard story point scale: **1, 2, 3, 5, 8, 13, 21, ...**

Why Fibonacci? The gaps increase (1→2 = +1, 5→8 = +3, 8→13 = +5), reflecting uncertainty at larger sizes:

| Points | Effort | Confidence | Typical Duration |
|--------|--------|------------|------------------|
| **1** | Trivial | Very high | < 4 hours |
| **2** | Small | High | 4-8 hours |
| **3** | Medium | High | 1 day |
| **5** | Large | Medium | 2-3 days |
| **8** | Very large | Low | 3-5 days |
| **13** | Epic (too large) | Very low | > 1 week (must split) |
| **21+** | Way too large | N/A | Never use; always split |

**Rule:** If a story is **13 or larger, break it down before sprint planning.** (See [[CON-user-story-format#Story Splitting Techniques (SPIDR)|SPIDR pattern]] for how.)

## How to Estimate with Story Points

### Step 1: Pick a Baseline Story
```
Team selects a recent, completed story as reference:
"Login feature was easy; let's call it a 3-pointer."
```

### Step 2: Estimate Relative to Baseline
```
Story: "Password reset"
Team discussion:
- Has error handling (more complex than login) → adds effort
- Involves email integration (new dependency) → adds risk
- But same authentication patterns as login

Conclusion: "This is bigger than login (3). Probably a 5."
```

### Step 3: Planning Poker (Voting)
Sync estimation across the team:

```
PO reads story: "User can reset password via email"

Round 1 — Silent vote (everyone estimates privately):
  Alice: 5
  Bob: 8
  Carol: 5
  Dave: 8

Observation: Consensus on 5-8 range, but split between two values.

Discussion:
  Bob: "I'm worried about email delivery SLA."
  Alice: "Good point. We might need to research that."

Round 2 — Vote again (after discussion):
  Alice: 5
  Bob: 5
  Carol: 5
  Dave: 8

Question to Dave: "What's your concern?"
Dave: "Actually, I was thinking about crypto. We're not doing that. Change to 5."

Final estimate: 5 points ✅
```

## Story Point Scale Definitions

### **1-Point Story** (Trivial)
- Clear requirement
- No unknowns
- No dependencies
- Example: "Fix typo in footer"

### **2-Point Story** (Small)
- Straightforward implementation
- Some testing required
- Minimal dependencies
- Example: "Add a new field to user profile form"

### **3-Point Story** (Medium)
- Standard complexity
- Some design decisions required
- 1-day effort for one developer
- Example: "User login with email and password"

### **5-Point Story** (Large)
- Multiple components or layers
- Some unknowns requiring research
- 2-3 days for one developer
- Example: "User password reset with email verification"

### **8-Point Story** (Very Large)
- Multiple features bundled
- Significant technical complexity
- Unknowns requiring spikes
- Multiple developers needed
- 3-5 days
- **Action:** Likely should be split. See [[CON-user-story-format#Story Splitting Techniques (SPIDR)|SPIDR]].
- Example: "Payment processing with multiple payment methods"

### **13+ Points** (Too Large)
- **NEVER ESTIMATE AS 13+**
- Must be split before sprint planning
- If a story is 13+, there's insufficient clarity; needs discovery/spike

## Estimation Factors

### **Effort**
Raw work required:
```
Simple CRUD form: 1-2 points
Form with validation + API: 3-5 points
Form with validation + API + payment integration: 5-8 points
```

### **Complexity**
Architectural or domain difficulty:
```
Basic UI change: 1 point
UI + new API endpoint: 3 points
UI + API + database schema + caching: 5-8 points
```

### **Uncertainty**
Unknowns or technical risk:
```
"Add a field (we've done this 100 times)": 1 point → 0 uncertainty
"Integrate with new payment API (first time)": 5 points → high uncertainty
"Optimize database queries (unknown bottleneck)": 8 points → very high uncertainty
```

### **Dependencies**
Blockers from other teams/systems:
```
"Waiting on backend API" → add points for uncertainty/waiting
"Depends on design approval" → add points if design unclear
"Needs input from PO" → defer estimation until clarity
```

## Common Estimation Mistakes

❌ **Converting to hours** — "5 points = 5 hours" (wrong; story points are abstract)
❌ **Comparing across teams** — "Team A's 5 points ≠ Team B's 5 points" (points are relative within a team)
❌ **Over-precision** — "Is it 2.5 or 3?" (Fibonacci; only pick from the scale)
❌ **Ignoring unknowns** — Underestimating because "it should be easy"
❌ **Committing too much** — Velocity of 12 but committing 18 points every sprint

## Velocity Over Time

**Velocity** = average story points completed per sprint

```
Sprint 1: 13 points
Sprint 2: 12 points
Sprint 3: 15 points
Sprint 4: 14 points

Average velocity: 13.5 points/sprint

Next sprint planning: Commit to ~13-14 points
```

**Use velocity to:**
- Plan future sprints (commit to historical velocity)
- Predict release dates ("Feature X is 40 points; at 13 points/sprint, ~3 sprints")
- Identify team health issues (velocity dropping? burnout?)

## Example: Good vs. Bad Estimates

### Bad Estimate ❌
```
Story: "Build user dashboard"
Estimate: 3 points
Reason: "It's just displaying data"

Reality:
- Requires 5 API endpoints (not 1)
- Real-time updates needed (complexity!)
- Mobile responsive (another design)
- Performance optimization (more work)

Actual effort: 13 points
Team completes only 2 of 4 committed stories
```

### Good Estimate ✅
```
Story: "Build user dashboard with real-time data"
Discussion:
- Multiple API integrations → +2 points
- Real-time updates (WebSocket?) → +2 points
- Mobile design → +1 point
- Performance concerns → +1 point

Estimate: 8 points
Note: "This is large; should we split it?"

Decision:
- Spike: "Research real-time tech (1 point, 1 day)"
- Story 1: "Dashboard UI (basic) (5 points)"
- Story 2: "Real-time updates (5 points)"

Team commits to spike + story 1; story 2 in next sprint
```

## See Also

- [[CON-estimation-techniques]] — Multiple estimation methods (planning poker, t-shirt sizing, etc.)
- [[CON-user-story-format]] — How story points relate to story size
- [[GLO-sprint]] — How velocity shapes sprint planning
- [[CON-sprint-mechanics]] — Sprint planning ceremony details
