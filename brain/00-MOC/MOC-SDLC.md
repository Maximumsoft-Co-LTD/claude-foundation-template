---
type: MOC
topic: sdlc
tags: [sdlc, lifecycle, process, methodology]
updated: 2026-03-25
---

# 🗺️ MOC — SDLC (Software Development Lifecycle)

> ทุก software ผ่าน lifecycle นี้ — รู้จัก phase และ model ช่วยให้วางแผนและสื่อสารกับทีมได้ตรงจุด

---

## Core Concepts

- [[../01-concepts/sdlc/CON-sdlc-phases]] — 7 phases: Planning → Requirements → Design → Implementation → Testing → Deployment → Maintenance
- [[../01-concepts/sdlc/CON-sdlc-models]] — Waterfall vs Agile vs Spiral vs V-Model
- [[../01-concepts/sdlc/CON-definition-of-done]] — เงื่อนไข "เสร็จจริง" ในแต่ละ phase
- [[../01-concepts/sdlc/CON-definition-of-ready]] — เงื่อนไขก่อน task จะเข้า sprint ได้
- [[../01-concepts/sdlc/CON-technical-debt]] — debt คืออะไร วัดอย่างไร จัดการอย่างไร

## Phase Summary

| Phase | Key Output | Owner |
|-------|-----------|-------|
| Planning | Project charter, scope, timeline | PM / PO |
| Requirements | PRD, user stories, ACs | PO / BA |
| Design | Architecture doc, wireframes | Architect / Designer |
| Implementation | Working code + tests | Dev |
| Testing | Test reports, bug list | QA |
| Deployment | Running system | DevOps / Dev |
| Maintenance | Incidents, enhancements | All |

## Related MOCs

- [[MOC-Agile-Scrum]] — Agile คือ SDLC model หนึ่ง
- [[MOC-Product-Owner]] — ผู้ drive requirements phase
- [[MOC-QA]] — Testing phase
- [[MOC-DevOps]] — Deployment phase
