---
type: concept
tags: [product-owner, backlog, prioritization, refinement]
related: [CON-user-story-writing, CON-acceptance-criteria, CON-sprint-planning-po, CON-sprint-mechanics]
updated: 2026-03-25
---

# Product Backlog Management

The Product Backlog is the single source of truth for what needs to be built. It's a living document, constantly refined and reprioritized based on market feedback, strategic goals, and team capacity.

## What Is a Product Backlog?

An ordered list of features, enhancements, bugs, and technical work that delivers value. It:
- Is **never complete** — emerges as the product evolves
- Is **ordered by priority** — top items ready to pull into sprints
- Is **publicly visible** — stakeholders see what's coming
- Is **PO-owned** — single wringable neck for prioritization

## The DEEP Model

Backlog health follows the DEEP framework:

| Dimension | Definition | Signal |
|---|---|---|
| **Detailed** | Top items have clear AC and estimates | Can start dev immediately |
| **Estimated** | Sized in story points (top 20% always have estimates) | Team can commit with confidence |
| **Emergent** | Backlog evolves based on feedback and learning | Refinement happens continuously |
| **Prioritized** | Items ordered by business value and urgency | Everyone knows what comes next |

**Healthy vs Unhealthy:**
- ✅ Top 5 items fully refined, bottom items vague (ok for future planning)
- ❌ All items estimated equally (indicates no prioritization)
- ❌ Backlog not touched between sprints (stale, reactive)
- ❌ 100+ items in backlog, none estimated (bottleneck for planning)

## Refinement Cadence

Establish a regular rhythm:

**Weekly Refinement Session** (1-2 hours)
- PO + 1-2 dev leads + QA (not full team)
- Focus: next 2-3 sprints worth of work
- Output: AC finalized, estimates confirmed, blockers identified

**Continuous Backlog Grooming**
- PO regularly updates priority based on feedback
- Team asks clarifying questions async
- Spikes launched for high-uncertainty items

**Pre-Sprint Planning Review**
- Confirm top 20 items are DEEP
- Identify any new blockers
- Ensure AC align with sprint goal

## Prioritization Techniques

### MoSCoW Method (Simple, useful for startups)
- **Must** (P0) — Project fails without this
- **Should** (P1) — Important, but not blockers
- **Could** (P2) — Nice-to-have, low effort
- **Won't** (P3) — Explicitly deprioritized this cycle

**Use when:** You need quick decisions and stakeholders aren't data-driven.

### Weighted Shortest Job First (WSJF) (Complex, useful for large portfolios)

```
Priority = (Business Value + Time Criticality + Risk Reduction) / Job Size
```

- **Business Value** — Revenue, competitive advantage, market expansion (1-9)
- **Time Criticality** — Launch deadline, market window (1-9)
- **Risk Reduction** — Mitigates technical or market risk (1-9)
- **Job Size** — Estimated effort (1-13 story points)

**Use when:** You need to balance multiple strategic goals with tight constraints.

### Kano Model (Psychological, useful for understanding value perception)

| Type | Definition | Example |
|---|---|---|
| **Hygiene Factors** | Expected; lack causes dissatisfaction | Login works, no crashes |
| **Satisfiers** | Proportional; more = happier | Faster load times, more features |
| **Delighters** | Unexpected; cause delight | Offline mode, AI-powered suggestions |

**Use when:** Designing new products or understanding customer satisfaction drivers.

## Backlog Health Signals

**Green (Healthy):**
- Top 20% items have AC and estimates
- Refinement happens at least weekly
- Average backlog age < 2 sprints (old items purged or moved to archive)
- Stakeholders have shared view of top 5 items
- Velocity predictable ± 10%

**Red (Unhealthy):**
- Items waiting for "PO clarification" blocking sprints
- Backlog size > 100 items with no clear priority
- Same items stay at top for 3+ sprints without movement
- AC missing or too vague ("make it work")
- Backlog items added mid-sprint, pushing planned work

## Splitting Epics into Stories

Large items (> 8 points, called Epics) must be broken down before committing:

**Bad Split (by role/phase):**
```
Epic: User Authentication
  - Story: Design the login screen
  - Story: Build backend API
  - Story: Write tests
❌ (Waterfall; blocks dev until design done)
```

**Good Split (by user value):**
```
Epic: User Authentication
  - Story: User can login with email + password
  - Story: User can reset forgotten password
  - Story: User can enable 2FA
  - Story: Admin can manage user sessions
✅ (Each story delivers value; team can parallelize)
```

**Splitting Questions:**
1. Does this story provide value to users on its own?
2. Can it be completed in one sprint?
3. Can two people work on different stories in parallel?
4. Can QA test it independently?

If any answer is "no," split further.

## Backlog Refinement Anti-Patterns

| Anti-Pattern | Signal | Fix |
|---|---|---|
| **Scope Creep** | New AC added mid-sprint | AC finalized before sprint; document change requests separately |
| **Kitchen Sink** | Huge stories; nobody commits | Enforce max 8 points; break epics before refinement |
| **Zombie Items** | Same low-priority items never get done | Archive items > 3 sprints old without movement |
| **PO Bottleneck** | Team blocked waiting for clarification | PO must attend refinement; async channels for questions |
| **Ivory Tower** | Backlog designed without talking to users | Continuous discovery; user feedback in AC |

## Related References

See [[CON-user-story-writing]] for writing individual stories, [[CON-sprint-planning-po]] for pulling items into sprints, and [[CON-acceptance-criteria]] for AC standards.
