---
type: concept
tags: [sdlc, phases, lifecycle]
related: [CON-sdlc-models, CON-definition-of-done, CON-definition-of-ready]
updated: 2026-03-25
source: template
---

# SDLC Phases

## 7 Phases

```
1. Planning
   → กำหนด scope, feasibility, timeline, budget
   → Output: Project Charter, WBS, Resource Plan
   → Owner: PM, Stakeholders

2. Requirements Analysis
   → เก็บ functional + non-functional requirements
   → Output: PRD, User Stories, ACs, Use Cases
   → Owner: PO, BA, PM + Stakeholders

3. System Design
   → Architecture, data model, API design, UI wireframes
   → Output: Architecture Doc, DB Schema, API Spec, Wireframes
   → Owner: Architect, Tech Lead, Designer

4. Implementation (Coding)
   → เขียน code ตาม design doc + TDD
   → Output: Working code, unit tests, integration tests
   → Owner: Dev Team

5. Testing & QA
   → Verify, validate, regression, performance, security
   → Output: Test reports, Bug list, Sign-off
   → Owner: QA, Dev, PO (UAT)

6. Deployment
   → Deploy to production, monitor, rollback plan
   → Output: Running system, deployment report
   → Owner: DevOps, Dev

7. Maintenance
   → Bug fixes, enhancements, monitoring, incident response
   → Output: Patches, new versions, SLA reports
   → Owner: All
```

## Phase Gates (Checklist before moving)

| Gate | Condition |
|------|-----------|
| Planning → Requirements | Budget approved, scope agreed |
| Requirements → Design | All requirements signed off |
| Design → Implementation | Architecture reviewed, API contracts agreed |
| Implementation → Testing | All ACs have tests, CI green |
| Testing → Deployment | All critical/major bugs fixed, sign-off obtained |
| Deployment → Maintenance | Monitoring live, runbook documented |

## In Agile (Scrum)

All phases happen **within every sprint** at a micro level:
- Sprint Planning = mini-requirements
- Daily dev = implementation
- PR review = mini design review
- CI/CD = mini deployment
- Retro = mini-maintenance planning

## Related

- [[CON-sdlc-models]] — which model fits which project
- [[CON-definition-of-done]] — when is each phase really done
- [[../../../00-MOC/MOC-SDLC]]
