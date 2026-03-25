---
type: MOC
topic: agile, scrum
tags: [agile, scrum, sprint, ceremony, kanban]
updated: 2026-03-25
---

# 🗺️ MOC — Agile & Scrum

> Framework สำหรับ deliver ซอฟต์แวร์เป็น increments สั้น ๆ พร้อมรับ feedback ได้เร็ว

---

## Core Concepts

- [[../01-concepts/agile/CON-agile-manifesto]] — 4 values, 12 principles ที่เป็นรากฐาน
- [[../01-concepts/agile/CON-scrum-roles]] — Product Owner / Scrum Master / Development Team
- [[../01-concepts/agile/CON-scrum-ceremonies]] — Sprint Planning, Daily, Review, Retro
- [[../01-concepts/agile/CON-scrum-artifacts]] — Product Backlog, Sprint Backlog, Increment
- [[../01-concepts/agile/CON-sprint-mechanics]] — Sprint cycle, velocity, capacity planning
- [[../01-concepts/agile/CON-user-story-format]] — As a... / I want... / So that... + ACs
- [[../01-concepts/agile/CON-estimation-techniques]] — Planning Poker, T-shirt sizing, story points

## Scrum at a Glance

```
Product Backlog (PO owns)
    ↓ Sprint Planning (team pulls)
Sprint Backlog (Dev owns)
    ↓ 2-week sprint
    Daily Scrum (15 min sync)
    ↓
Sprint Review  → Increment demo to stakeholders
Sprint Retro   → Team improves process
    ↓
Next Sprint
```

## Key Metrics

| Metric | What It Tells You |
|--------|------------------|
| Velocity | Story points completed per sprint (avg over 3 sprints) |
| Cycle Time | Time from "in-progress" to "done" |
| Lead Time | Time from request to delivery |
| Burn-down | Remaining work over sprint timeline |
| Defect Rate | Bugs per story point or per sprint |

## Scrum vs Kanban Quick Comparison

| | Scrum | Kanban |
|-|-------|--------|
| Cadence | Fixed sprints | Continuous flow |
| Planning | Sprint planning | On-demand |
| WIP limit | Per sprint | Per column |
| Best for | Feature development | Support / ops |

## Related MOCs

- [[MOC-Product-Owner]] — PO role in Scrum
- [[MOC-Product-Manager]] — PM works alongside Scrum
- [[MOC-SDLC]] — Scrum is an Agile SDLC model
- [[MOC-Workflow]] — This project's sprint workflow
