---
type: concept
tags: [scrum, artifacts, backlog, increment, sprint-backlog]
related: [CON-scrum-roles, CON-scrum-ceremonies]
updated: 2026-03-25
---

# Scrum Artifacts

## 3 Artifacts + 3 Commitments

| Artifact | Commitment | Owner |
|----------|-----------|-------|
| Product Backlog | Product Goal | Product Owner |
| Sprint Backlog | Sprint Goal | Development Team |
| Increment | Definition of Done | Development Team |

---

### 1. Product Backlog
**What:** Ordered list of EVERYTHING that might be needed in the product
**Owner:** Product Owner

```
Priority 1: User can log in with Google [8pts] [READY]
Priority 2: User can reset password [5pts] [READY]
Priority 3: User can set profile photo [3pts] [refinement needed]
Priority 4: Admin can ban users [3pts] [rough]
...
```

**Rules:**
- Top items: detailed, estimated, "Ready"
- Bottom items: rough, not yet estimated (DEEP = Detail, Estimate, Emergence, Prioritize)
- PO orders by value — not by technical dependency
- Never empty — always growing

---

### 2. Sprint Backlog
**What:** Stories selected for the sprint + tasks to achieve Sprint Goal
**Owner:** Development Team

```
Sprint Goal: "Users can complete checkout"

Story: User can add items to cart [5pts]
  - Task: Backend cart API [4h]
  - Task: Frontend cart component [6h]
  - Task: Integration test [2h]

Story: User can checkout [8pts]
  - Task: Payment gateway integration [8h]
  - Task: Order confirmation email [4h]
  ...
```

**Rules:**
- Dev team owns this, not PO
- PO cannot add to Sprint Backlog mid-sprint without team agreement
- Transparent — visible to all stakeholders

---

### 3. Increment
**What:** Sum of all completed PBIs that meet DoD — shippable product
**Owner:** Development Team

- Must be "Done" = passes Definition of Done
- Can be released or not (PO decides) but MUST be releasable
- Each sprint adds to previous increments

## Artifacts Visual

```
Product Backlog (full product)
    ↓ Sprint Planning selects
Sprint Backlog (this sprint)
    ↓ Development produces
Increment (potentially shippable)
    ↓ Sprint Review demo
Stakeholder Feedback
    ↓
Product Backlog (updated)
```

## Related

- [[CON-scrum-roles]] — who owns what
- [[CON-scrum-ceremonies]] — when artifacts are updated
- [[../sdlc/CON-definition-of-done]] — what makes increment "Done"
- [[../../../00-MOC/MOC-Agile-Scrum]]
