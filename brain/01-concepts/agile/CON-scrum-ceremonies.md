---
type: concept
tags: [scrum, ceremonies, sprint-planning, daily, review, retro, refinement]
related: [CON-scrum-roles, CON-scrum-artifacts, CON-sprint-mechanics]
updated: 2026-03-25
source: template
---

# Scrum Ceremonies

## 5 Ceremonies

### 1. Sprint Planning
**When:** Start of every sprint
**Duration:** 2-4 hours (for 2-week sprint)
**Who:** Entire Scrum Team

```
Part 1 — WHAT (PO leads):
  PO presents top backlog items
  Team asks clarifying questions
  Team agrees on Sprint Goal

Part 2 — HOW (Dev Team leads):
  Dev team selects stories (based on velocity)
  Break stories into tasks
  Estimate tasks
  Commit to Sprint Backlog
```

**Output:** Sprint Goal + Sprint Backlog

---

### 2. Daily Scrum (Stand-up)
**When:** Every day, same time
**Duration:** 15 minutes MAX
**Who:** Dev Team (SM optional, PO optional)

**Format (3 questions):**
- ✅ What did I finish yesterday?
- 🔜 What will I do today?
- 🚫 Any impediments?

**Anti-patterns:**
- ❌ Status report to SM/manager (should be team sync)
- ❌ Problem solving in standup (take offline)
- ❌ > 15 minutes

---

### 3. Sprint Review (Demo)
**When:** End of sprint
**Duration:** 2-4 hours
**Who:** Scrum Team + Stakeholders

```
1. PO presents Sprint Goal + what was planned
2. Dev team demos working software
3. PO accepts/rejects each item
4. Stakeholders give feedback
5. PO updates backlog based on feedback
```

**Key rule:** Only demo "Done" items (pass DoD) — no "90% done"

---

### 4. Sprint Retrospective
**When:** After Sprint Review, end of sprint
**Duration:** 1-3 hours
**Who:** Scrum Team only (no stakeholders)

**Classic format (Start/Stop/Continue):**
```
Start:   What should we start doing?
Stop:    What should we stop doing?
Continue: What's working that we should keep?
```

**Output:** ≤ 3 action items for next sprint (measurable)

---

### 5. Backlog Refinement (Grooming)
**When:** Mid-sprint (not end of sprint planning)
**Duration:** 1-2 hours
**Who:** PO + Dev Team

```
1. PO presents upcoming stories
2. Team asks questions → PO clarifies
3. Team estimates (Planning Poker)
4. Stories become "Ready" for next sprint
```

**Goal:** 80%+ of next sprint backlog is "Ready" before Sprint Planning

## Ceremony Calendar (2-Week Sprint)

```
Day 1:  Sprint Planning (2-4h)
Day 3-4: Backlog Refinement (1-2h)
Day 1-10: Daily Stand-up (15 min/day)
Day 10: Sprint Review (2-4h)
Day 10: Sprint Retrospective (1-3h)
```

## Related

- [[CON-scrum-roles]] — who participates in each ceremony
- [[CON-sprint-mechanics]] — velocity, capacity, sprint tracking
- [[../../../00-MOC/MOC-Agile-Scrum]]
