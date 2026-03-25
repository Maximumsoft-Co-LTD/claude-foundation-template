---
type: concept
tags: [scrum, roles, product-owner, scrum-master, development-team]
related: [CON-scrum-ceremonies, CON-scrum-artifacts, CON-agile-manifesto]
updated: 2026-03-25
---

# Scrum Roles

## 3 Core Roles

### 1. Product Owner (PO)
**Accountability:** Maximize value delivered by the Development Team

| Responsibility | Activity |
|---------------|---------|
| Own Product Backlog | Write, refine, order all backlog items |
| Clarify requirements | Answer dev questions, define ACs |
| Accept/reject work | Sprint Review — pass/fail each story |
| Stakeholder liaison | Communicate priorities, gather feedback |
| Say "no" to scope creep | Protect team from unplanned work |

**Not PO's job:** Assign tasks to developers, manage how team works

---

### 2. Scrum Master (SM)
**Accountability:** Team effectiveness — remove impediments, coach Agile

| Responsibility | Activity |
|---------------|---------|
| Facilitate ceremonies | Planning, Daily, Review, Retro |
| Remove blockers | Resolve impediments dev team can't self-solve |
| Coach team | Agile practices, Scrum rules |
| Shield team | Protect from external interruptions |
| Improve process | Use retros to continuously improve |

**Not SM's job:** Project manager, assign tasks, write code (usually)

---

### 3. Development Team
**Accountability:** Deliver a "Done" Increment every sprint

| Characteristic | Detail |
|---------------|--------|
| Self-organizing | Team decides HOW to build, not management |
| Cross-functional | All skills to build the Increment (FE, BE, QA, etc.) |
| Collective ownership | No "my code" — team owns all code |
| Size | 3-9 people optimal |

**Not Dev Team's job:** Promise delivery dates (they commit to Sprint goal, not specific stories)

## Role Interaction

```
PO (WHAT) → Backlog → Dev Team (HOW) → Increment
     ↑                        ↑
     └─── SM (HOW WELL) ──────┘
           (coaching both)
```

## Anti-patterns

| Anti-pattern | Problem |
|-------------|---------|
| PO micromanages dev | Undermines self-organization |
| SM acts as project manager | Creates dependency, kills Agile |
| PO not available for questions | Dev blocks, velocity drops |
| "Hero" dev — single point of knowledge | Bus factor = 1 |

## Related

- [[CON-scrum-ceremonies]] — roles participate differently per ceremony
- [[CON-scrum-artifacts]] — roles own different artifacts
- [[../product-owner/CON-sprint-planning-po]] — PO's role in sprint planning
- [[../../../00-MOC/MOC-Agile-Scrum]]
