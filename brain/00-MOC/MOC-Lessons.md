---
type: MOC
topic: lessons
tags: [retro, lessons, improvement]
updated: 2026-03-25
---

# 🗺️ MOC — Lessons Learned

> Retrospective learnings extracted from sprint and task retros. These evolve the team's practice.

---

## Lesson Log

| ID | Lesson | Source | Sprint | Date |
|----|--------|--------|--------|------|
| [[../04-lessons/LES-001-tdd-skipped-on-deadline]] | TDD Skipped Under Deadline Pressure Creates More Rework | template-example | example | — |
| [[../04-lessons/LES-002-mock-vs-real-db-divergence]] | Mocked Integration Tests Masked a Real Migration Bug | template-example | example | — |
| [[../04-lessons/LES-003-discovery-skipped-caused-rework]] | Skipping /discovery on a "Simple" Feature Led to Mid-Sprint Scope Expansion | template-example | example | — |
| [[../04-lessons/LES-004-audit-outside-transaction]] | Audit Row Outside the State-Change Transaction Allows Silent Divergence | retro-task SP1-T001 (from-bug) | SP1 | 2026-05-05 |

> Rows above marked `template-example` ship as illustrative examples. Real entries from this team start with `LES-004` onward.

---

## Lesson Categories

### Process Improvements
*(TBD)*

### Technical Insights
*(TBD)*

### Team Dynamics
*(TBD)*

### Anti-Patterns to Avoid
*(TBD)*

---

## How Lessons Are Added

1. **Automatically** — `/retro-sprint` scans task retros for "Knowledge sharing" items and prompts to add them here
2. **Manually** — After any learning moment, create `brain/04-lessons/LES-[NNN]-[slug].md` and link here
3. **Pattern extraction** — If a lesson becomes a pattern, promote it to `brain/03-patterns/`

---

## Lesson → Action Loop

```
Lesson found in retro
    ↓
Create LES note with: Problem Observed → Root Cause → What Changed
    ↓
If recurring → promote to PAT (pattern) or DEC (decision)
    ↓
CLAUDE.md updated (via /retro-sprint) if team-wide convention changes
```
