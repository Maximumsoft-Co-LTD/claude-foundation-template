---
type: concept
tags: [product-manager, discovery, user-research, jtbd, double-diamond]
related: [CON-product-vision-strategy, CON-okr-framework, CON-metrics-product, CON-user-story-writing]
updated: 2026-03-25
---

# Product Discovery

Discovery is how you validate assumptions before building. It answers: "Are we building the right thing?" before engineering builds it.

## The Double Diamond Framework

Discovery follows a cycle of **divergence → convergence** repeated twice:

```
Problem Space                    Solution Space
├─ Discover: Explore problems   ├─ Develop: Explore solutions
│  (diverge: many problems)     │  (diverge: many designs)
│
├─ Define: Pick a problem       ├─ Deliver: Pick a solution
   (converge: one focus)           (converge: one MVP)
```

**Phase 1: Problem Discovery**
- User interviews, ethnography, data analysis
- Identify jobs-to-be-done, pain points, opportunities
- Output: Opportunity backlog (prioritized list of problems)

**Phase 2: Solution Discovery**
- Prototypes, user testing, A/B experiments
- Validate which solution resonates
- Output: Validated product direction, feature specs

## Discovery Techniques

### Jobs to Be Done (JTBD)

Instead of "Who is the user?" ask "What job are they trying to do?"

**The framework:**
- Situation → Motivation → Desired outcome

**Example:**
```
Bad framing: "Target millennial coffee drinkers"

Good framing:
Situation: I'm at 3pm and hitting an energy slump
Motivation: I need to stay sharp for a 5pm presentation
Desired outcome: Alert, not jittery; lasts 2+ hours

→ This reveals what coffee is really competing against
  (naps, energy drinks, meditation, candy)
```

**Interview script:**
1. "Tell me about a time you [did X]"
2. "What were you trying to accomplish?"
3. "What was getting in your way?"
4. "How do you solve it today?"
5. "What's frustrating about that?"

### User Interviews

**Best for:** Understanding motivations, pain points, workflows

**Interview checklist:**
- [ ] Recruit actual users (not friends or employees)
- [ ] 5-10 interviews per segment (more doesn't add much)
- [ ] Ask open-ended, not leading questions
- [ ] Listen more than pitch (70% listening, 30% talking)
- [ ] Record with permission; take notes
- [ ] Synthesize notes into themes within 48 hours

### Opportunity Tree

Decompose a big problem into opportunities:

```
We want to reduce meeting fatigue
├─ Fewer meetings total
│  ├─ Auto-decline low-value meetings
│  ├─ Make async work better (so meetings aren't needed)
│  └─ Bundle meetings into focus days
├─ Shorter meetings
│  ├─ Better agendas
│  ├─ Enforce time limits
│  └─ Pre-record updates instead of live
└─ More effective meetings
   ├─ Better note-taking
   ├─ Clear decisions and action items
   └─ Async pre-discussion
```

Pick 2-3 branches to explore deeply.

### Assumption Mapping

List what you believe to be true, prioritize by risk:

| Assumption | Risk | Evidence | Status |
|---|---|---|---|
| Users have Slack | Medium | 80% of target market uses Slack | ✅ Validated |
| Users want async comments | High | No one has asked for it | ❌ Unproven |
| We can build it in 6 weeks | High | Complexity unknown | ❌ Unproven |
| Pricing at $50/user is acceptable | Medium | No pricing feedback yet | ❌ Unproven |

Run experiments on high-risk, unproven assumptions first.

## Continuous Discovery

Don't do discovery once and ship. Establish a cadence:

**Weekly:** Customer calls with 1-2 active users
- What are they using? What's frustrating?
- Ask follow-up questions from last week

**Monthly:** Customer research sprint
- 10-15 interviews on a specific hypothesis
- Build a clickable prototype
- Test with users

**Quarterly:** Larger quantitative validation
- Run surveys or experiments
- Measure NPS on new features
- Gather cohort data

## Discovery Artifacts

### Opportunity Backlog

A list of validated problems, ranked by impact/effort:

```
Priority | Problem | Impact | Effort | Status
---------|---------|--------|--------|--------
1 | Users lose context switching between tools | High | High | In Discovery
2 | Setup takes 30 mins; users abandon | High | Medium | In Development
3 | Mobile app missing key features | Medium | High | In Backlog
```

### Assumption Log

Track what you believed, what you learned:

```
Date | Assumption | Result | Learning
-----|-----------|--------|----------
3/1  | Users want AI summaries | Only 20% asked for it | Feature lower priority
3/8  | Setup takes 5 min | Actually takes 25 min | Need onboarding flow
```

Use this in retros to correct future estimates.

## Validating Before Building

**Bad:** Build first, ask questions later (sunk cost fallacy)
**Good:** Validate before committing engineering

**Validation ladder (cheapest → most expensive):**

1. **Concierge MVP** (1-2 weeks)
   - Manually do the thing for users
   - Validate there's real demand
   - Cost: 1 PM + 1 ops person

2. **Wizard of Oz** (2 weeks)
   - Build the UI, fake the backend
   - Test if users find it useful
   - Cost: 1 designer + 1 frontend dev

3. **Landing page + email list** (1 week)
   - Describe the feature; see who signs up
   - Validates willingness to try
   - Cost: 1 marketer + design

4. **Prototype + user testing** (3 weeks)
   - Clickable prototype; 5-10 user sessions
   - Refine UX before engineering
   - Cost: 1 designer + 1 researcher

5. **Production MVP** (4-6 weeks)
   - Minimal, working feature
   - Measure real usage and feedback
   - Cost: Full squad

**Decision rule:** If validation step fails, pivot or kill before step 5.

## Related References

See [[CON-product-vision-strategy]] for setting strategic direction, [[CON-okr-framework]] for turning discoveries into goals, and [[CON-metrics-product]] for measuring what matters.
