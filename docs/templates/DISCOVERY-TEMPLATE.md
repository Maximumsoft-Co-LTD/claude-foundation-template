# [disc-id] — [Title]

## Metadata
| Field | Value |
|-------|-------|
| **Discovery ID** | disc-XXX |
| **Status** | discovery / backlog |
| **Date** | YYYY-MM-DD |
| **Requester** | - |
| **Facilitator** | - |

---

## 1. Problem Statement
<!-- What problem are we solving? Who experiences it, how often, and what is the impact? -->

**Problem:**

**Who is affected:**

**Current workaround (if any):**

---

## 2. Affected Users & Stakeholders
<!-- Who are the primary users? Who else is impacted (internal teams, external systems)? -->

| Role | Impact | Notes |
|------|--------|-------|
| - | - | - |

---

## 3. Personas
| Persona | Role / Description | Goal | Key Pain Point | Frequency of Use |
|---------|--------------------|------|----------------|------------------|
| - | - | - | - | daily / weekly / rarely |

---

## 4. Goals & Success Criteria
<!-- What does success look like? Every goal must have a measurable metric. -->

| Goal | Success Metric | How to Measure |
|------|---------------|----------------|
| - | - | - |

---

## 5. Current User Journey (As-Is)
<!-- Map how users currently solve this problem. Score 1–5: 1=frustrated, 5=delighted. -->

```mermaid
journey
    title Current Journey (As-Is) — [Problem Area]
    section Current Flow
        User encounters problem  : 2 : User
        Finds workaround         : 1 : User
        Completes task manually  : 2 : User
        Result is error-prone    : 1 : User
```

**Pain points identified:**
-

---

## 6. Future User Journey (To-Be)
<!-- Map how users will experience the solved flow. Score 1–5: 1=frustrated, 5=delighted. -->

```mermaid
journey
    title Future Journey (To-Be) — [Problem Area]
    section New Flow
        User encounters need     : 4 : User
        System guides user       : 5 : User
        Task completes smoothly  : 5 : User
        Result is reliable       : 5 : User
```

**Improvements over As-Is:**
-

---

## 7. Context & Background
<!-- Relevant history, existing systems, previous attempts, related decisions. -->

---

## 8. Constraints
<!-- Hard limits that shape the solution space. -->

- **Technical:** (stack, existing systems, APIs)
- **Business:** (budget, compliance, stakeholder requirements)
- **Timeline:** (deadlines, dependencies on other teams)
- **UX:** (design system, accessibility requirements)

---

## 9. Event Storming
### Domain Events (orange)
| Event | Trigger | Aggregate | Data Produced |
|-------|---------|-----------|---------------|
| `EventName` | - | - | - |

### Commands (blue)
| Command | Actor | Triggers Event | Input |
|---------|-------|----------------|-------|
| `CommandName` | - | - | - |

### Aggregates (yellow)
| Aggregate | Key Entities | Invariants / Rules |
|-----------|-------------|-------------------|
| - | - | - |

_If not applicable: write "Skipped — no domain modeling needed."_

---

## 10. SIPOC — Process Boundaries
| Suppliers | Inputs | Process Step | Outputs | Customers |
|-----------|--------|-------------|---------|-----------|
| - | - | - | - | - |

_If not applicable: write "Skipped — process boundaries are clear from the user journey."_

---

## 11. Proposed Approaches
<!-- At least 2 options considered. More options = better decision. -->

### Option A: [Name]
- **Description:**
- **Pros:**
- **Cons:**
- **Estimated effort:**

```mermaid
graph TB
    subgraph "Option A — High-Level Architecture"
        UI[Frontend] --> API[API Layer]
        API --> SVC[Service]
        SVC --> DB[(Database)]
    end
```

### Option B: [Name]
- **Description:**
- **Pros:**
- **Cons:**
- **Estimated effort:**

```mermaid
graph TB
    subgraph "Option B — High-Level Architecture"
        UI[Frontend] --> GW[API Gateway]
        GW --> SVC_A[Service A]
        GW --> SVC_B[Service B]
        SVC_A --> DB[(Database)]
        SVC_B --> DB
    end
```

---

## 12. Decision Log
| # | Date | Decision | Rationale | Alternatives Rejected | Decided by |
|---|------|----------|-----------|----------------------|------------|
| 1 | YYYY-MM-DD | | | | |

**Current chosen approach:** [name from row above]

---

## 13. Unknowns & Open Questions
<!-- What do we not know yet? Each item must be resolved before sprint planning. -->

- [ ] Q1:
- [ ] Q2:

---

## 14. Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| - | high / med / low | high / med / low | - |

---

## 15. Scope Estimate
<!-- Rough sizing to help sprint planning. Not a commitment. -->

- **Estimated sprints:** X
- **v1 scope (must-have):**
- **v2 scope (nice-to-have):**
- **Explicitly out of scope:**

---

## 16. Glossary / Ubiquitous Language
| Term | Definition | Also Known As | NOT the Same As |
|------|-----------|---------------|-----------------|
| - | - | - | - |

---

## 17. Next Steps
<!-- What must happen before this is ready for /new-sprint? -->

- [ ] Resolve all open questions
- [ ] Get stakeholder sign-off on chosen approach
- [ ] Confirm timeline with team
- [ ] Update status to `backlog` when ready
