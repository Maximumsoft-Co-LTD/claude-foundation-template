---
type: moc
tags: [MOC, team, organization]
updated: 2026-03-25
---

# 🗺️ MOC — Team & Organization

> **When to open this MOC:**
> - Org design decisions (team structure, responsibilities)
> - Technical leadership & team dynamics
> - Documentation standards & communication
> - Scrum/Agile practices and ceremonies
> - Stakeholder management and cross-team alignment

---

## Concept Map

### Core Team Concepts

- [[CON-team-topologies]] — 4 team types (stream-aligned, platform, enabling, complicated subsystem), Conway's Law, interaction modes
- [[CON-scrum-roles]] — Scrum Master, Product Owner, Development Team responsibilities
- [[CON-agile-manifesto]] — Agile values and principles; when it applies and when it doesn't
- [[CON-stakeholder-management]] — Managing expectations, communication with non-technical stakeholders

### Documentation & Communication

- [[CON-technical-writing]] — README, ADR, Runbook, API docs; principles and anti-patterns
- [[CON-code-review-checklist]] — What to look for in reviews; how to give and receive feedback
- [[CON-branch-commit-format]] — Branch naming, commit message conventions, PR workflow

### Organizational Patterns

- [[CON-microservices-patterns]] — Service boundaries, API contracts, team ownership
- [[CON-domain-driven-design]] — Ubiquitous language, bounded contexts, domain modeling
- [[CON-distributed-teams]] — Time zones, async communication, documentation as sync medium

---

## Quick Navigation by Scenario

### "I'm designing a new org structure"
Start: [[CON-team-topologies]]
Then: [[CON-conway-law-inverse]]

### "I'm documenting a service/API"
Start: [[CON-technical-writing]]
Focus on: README, API docs sections

### "I'm writing an ADR for a major decision"
Start: [[CON-technical-writing]]
Focus on: ADR template and examples

### "I'm creating an on-call runbook"
Start: [[CON-technical-writing]]
Focus on: Runbook structure, alert response

### "I'm setting up a Scrum team"
Start: [[CON-scrum-roles]]
Then: [[CON-agile-manifesto]]

### "I need to communicate with stakeholders"
Start: [[CON-stakeholder-management]]
Combine with: [[CON-technical-writing]] for writing clear updates

### "I'm setting up code review process"
Start: [[CON-code-review-checklist]]
Also: [[CON-branch-commit-format]]

---

## Related MOCs

- [[MOC-Backend]] — Architecture, API design, database patterns
- [[MOC-Frontend]] — UI/UX, component design, state management
- [[MOC-QA]] — Testing, quality metrics, debugging
- [[MOC-Decisions]] — ADR examples, decision-making framework
- [[MOC-Lessons]] — What went wrong? Retrospective learnings

---

## Key Principles from This MOC

1. **Conway's Law is inescapable** — Your team structure will emerge in your architecture
2. **Use the right team type** — Most teams should be stream-aligned (product-focused), not layer-aligned
3. **Documentation is leverage** — Good docs scale knowledge and reduce on-call burden
4. **Async-first communication** — Especially important for distributed teams; documents enable this
5. **Clear ceremonies matter** — Scrum rituals work when they solve a real problem (not for their own sake)

---

**Last updated:** 2026-03-25
**Review frequency:** Quarterly (check if any concepts feel outdated)
