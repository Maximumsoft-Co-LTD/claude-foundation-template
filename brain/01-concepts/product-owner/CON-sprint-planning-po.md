---
type: concept
tags: [product-owner, sprint-planning, scrum, sprint-goal]
related: [CON-scrum-ceremonies, CON-definition-of-ready, CON-product-backlog-management, CON-sprint-mechanics]
updated: 2026-03-25
source: template
---

# Sprint Planning: The Product Owner's Role

Sprint planning is the contract-setting ceremony between PO and development team. The PO brings prioritized work, the team brings realistic capacity, and together you negotiate the sprint goal and scope.

## The PO's Pre-Planning Responsibilities

### 1 Week Before Sprint Planning

**Prepare the backlog:**
- Top 20 items are DEEP (Detailed, Estimated, Emergent, Prioritized)
- AC finalized; no ambiguity
- Spikes (research tasks) completed or included in sprint
- Dependencies identified and flagged
- Blocked items removed or marked "can't start until X"

**Communicate the direction:**
- Share sprint goal draft with stakeholders
- Preview top 5 items to team leads
- Gather any last-minute blocking feedback

**Gather metrics:**
- Review last sprint's velocity
- Identify any capacity changes (holidays, support rotations)
- Estimate new sprint capacity

## During Sprint Planning

### Part 1: Sprint Goal (15 minutes)

The PO presents a **single, focused goal** for the sprint. It answers: "Why are we doing this sprint?"

**Good sprint goals:**
- "Enable users to invite team members to workspaces" (user-facing value)
- "Reduce API latency by 30% to meet SLA targets" (business outcome)
- "De-risk payment integration before Q2 launch" (risk reduction)

**Bad sprint goals:**
- "Work on login and reporting and bug fixes" (no focus; sounds like a task list)
- "Implement OAuth" (technical implementation, not a goal)
- "Keep the lights on" (too vague; doesn't explain why these items)

**The sprint goal drives prioritization:** If the team has capacity questions (story A vs story B), the goal breaks ties.

### Part 2: Item Selection (45 minutes)

**Process:**
1. PO presents top backlog item, reads user story and AC aloud
2. Team asks clarifying questions (shouldn't take long if backlog was refined)
3. Team estimates story (planning poker or t-shirt sizes)
4. PO confirms: "Is this acceptable?" (rarely changes post-refinement estimate)
5. Story added to sprint if capacity remains
6. Repeat until team says "that's our capacity"

**The PO's job:**
- **Clarify, don't defend.** If team asks "why is this a feature?", answer. Don't argue.
- **Be present.** Answer questions immediately; don't punt to "I'll figure out offline."
- **Accept the team's velocity.** If they say "we can take 40 points," don't push 45.
- **Know what can flex.** Have 2-3 stories you can cut if surprises emerge.

### Part 3: Definition of Ready Checklist (5 minutes)

Before finalizing, confirm all committed stories pass:

- [ ] AC written in Gherkin (Given/When/Then)
- [ ] AC is testable (dev + QA both understand success)
- [ ] No story is > 8 points (epic needs breaking down)
- [ ] Dependencies called out and available
- [ ] No blocked items without unblock date
- [ ] Tech team confirmed no "unknown unknowns"
- [ ] Acceptance criteria don't mention implementation details
- [ ] Design (if needed) is approved or in-progress with team

If any item fails, either fix it or remove it from the sprint.

## Capacity vs Commitment

**Capacity** = Maximum points team can theoretically take
**Commitment** = Points team actually takes (usually 80-90% of capacity)

**Healthy discipline:**
- Don't load team to 100% capacity (leaves no buffer for blockers, support, learning)
- Account for meetings, reviews, documentation
- Reduce capacity for known distractions (conference, major incident, vacation)

**Example:**
```
Ideal velocity: 45 points
Team capacity: 45 points
Sprint commitment: 38 points
Buffer: 7 points (15%) for unknowns
```

## Negotiating Scope

When the team is at capacity and a high-priority item doesn't fit:

**Option 1: Remove low-priority items**
- "If we drop the reporting enhancement, we can fit payment retry logic"

**Option 2: Break the item into smaller stories**
- "Can we ship the happy path in this sprint and handle edge cases next sprint?"

**Option 3: Move the item to next sprint**
- "This is important but not urgent; we'll prioritize it in SP7"

**Option 4: Extend the sprint** (rare)
- Only if velocity is proven incorrect; don't make this a habit

**The PO does NOT:**
- Demand more points without removing items ("You must take all of these")
- Hide scope ("Just take X, and we'll add Y mid-sprint")
- Split attention (attending sprint planning while on a call with a customer)

## Sprint Planning Outputs

By the end of planning, you should have:

1. **Sprint Goal** — Single, compelling reason for the sprint
2. **Committed Stories** — Ordered, with AC, in Jira/tool
3. **Capacity/Velocity Baseline** — For retrospective comparison
4. **Known Blockers** — External dependencies, waiting for design, etc.
5. **Definition of Ready Confirmed** — All stories pass the checklist
6. **Communication Plan** — How stakeholders hear about sprint goal

## Common Pitfalls

| Mistake | Impact | Prevention |
|---|---|---|
| **PO doesn't attend** | Team guesses at priorities; scope creeps | Make it the PO's #1 meeting |
| **Backlog not refined** | Lengthy planning; team gets stuck | Refinement happens weekly |
| **Overfull sprint** | Items spill to next sprint; demoralizes team | Stick to team's velocity |
| **Scope creep mid-planning** | Final list differs from what team estimated | Freeze backlog 24h before planning |
| **Sprint goal is vague** | No tiebreaker for scope debates | Write one sentence; if it needs more, it's not a goal |

## Related References

See [[CON-scrum-ceremonies]] for all agile ceremonies, [[CON-definition-of-ready]] for quality gate details, and [[CON-product-backlog-management]] for maintaining a healthy backlog.
