---
type: concept
tags: [docs, structure, file-organization]
related: [CON-task-id-format, CON-sprint-lifecycle]
updated: 2026-03-25
source: template
---

# Document Structure

## Full Layout

```
docs/
├── BACKLOG.md                          ← global task registry
├── discovery/
│   └── disc-001-[name].md              ← /discovery output
├── sprints/
│   └── SP1/
│       ├── SP1-overview.md             ← /new-sprint output
│       ├── SP1-retro.md                ← /retro-sprint output
│       └── SP1-T001/
│           ├── SP1-T001-requirement.md ← /requirement output
│           ├── SP1-T001-frontend.md    ← /design fe output
│           ├── SP1-T001-backend.md     ← /design be output
│           ├── SP1-T001-issues.md      ← /issue output (auto-created)
│           └── SP1-T001-retro.md       ← /retro-task output
└── templates/
    ├── DISCOVERY-TEMPLATE.md
    ├── SPRINT-OVERVIEW-TEMPLATE.md
    ├── REQUIREMENT-TEMPLATE.md
    ├── FRONTEND-DESIGN-TEMPLATE.md
    ├── BACKEND-DESIGN-TEMPLATE.md
    ├── ISSUE-TEMPLATE.md
    ├── RETRO-TASK-TEMPLATE.md
    └── RETRO-SPRINT-TEMPLATE.md
```

## Brain Structure (Separate)

```
brain/                                  ← 🧠 knowledge vault
├── BRAIN-INDEX.md                      ← master entry point for Claude
├── 00-MOC/                             ← Maps of Content
├── 01-concepts/                        ← atomic concept notes
├── 02-decisions/                       ← ADR-style decision notes
├── 03-patterns/                        ← reusable patterns
├── 04-lessons/                         ← retro learnings
├── 05-sprints/                         ← per-sprint knowledge summary
└── 06-glossary/                        ← project vocabulary
```

## Key Principle

`docs/` = **what we built** (output documents, one per sprint/task)
`brain/` = **what we learned** (durable knowledge, grows across all sprints)

## When Each File is Created

| File | Created by |
|------|-----------|
| `disc-NNN-name.md` | `/discovery` |
| `SP[N]-overview.md` | `/new-sprint` |
| `SP[N]-T[NNN]-requirement.md` | `/requirement` |
| `SP[N]-T[NNN]-frontend.md` | `/design fe` |
| `SP[N]-T[NNN]-backend.md` | `/design be` |
| `SP[N]-T[NNN]-issues.md` | `/issue` (auto) |
| `SP[N]-T[NNN]-retro.md` | `/retro-task` |
| `SP[N]-retro.md` | `/retro-sprint` |

## Related

- [[CON-task-id-format]] — naming convention for all docs
- [[CON-sprint-lifecycle]] — when each phase's doc is written
