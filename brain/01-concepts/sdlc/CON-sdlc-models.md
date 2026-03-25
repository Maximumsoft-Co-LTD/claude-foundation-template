---
type: concept
tags: [sdlc, waterfall, agile, spiral, v-model]
related: [CON-sdlc-phases]
updated: 2026-03-25
---

# SDLC Models

## Model Comparison

| Model | Flow | Best For | Risk |
|-------|------|---------|------|
| Waterfall | Sequential, no going back | Fixed requirements, compliance, government | High — late discovery of problems |
| Agile/Scrum | Iterative sprints | Most software products | Medium — needs discipline |
| V-Model | Development + Testing in parallel | Safety-critical systems (medical, automotive) | Medium |
| Spiral | Risk-driven iterations | Large, complex, experimental | High cost |
| Kanban | Continuous flow | Support, ops, maintenance | Risk of no planning |
| RAD | Rapid prototyping | UI-heavy, fast MVPs | Scope creep |

## Waterfall

```
Requirements → Design → Implementation → Testing → Deployment → Maintenance
```
- Strict sequential — can't go back
- Heavy documentation upfront
- Works when requirements are 100% fixed
- Problem: testing happens very late = expensive bugs

## Agile

```
Sprint 1: Plan → Build → Test → Review
Sprint 2: Plan → Build → Test → Review  (incorporates feedback)
Sprint N: ...
```
- Iterative — deliver working software every 1-4 weeks
- Embrace changing requirements
- Customer collaboration over contract negotiation
- See [[../agile/CON-agile-manifesto]]

## V-Model

```
Requirements Analysis ─────────────────────── Acceptance Testing
    System Design ─────────────────── System Testing
       Architecture Design ──────── Integration Testing
           Module Design ────── Unit Testing
                    Implementation
```
- Every development phase has a corresponding test phase
- Tests are designed alongside development, not after
- Used in aerospace, defense, medical devices

## Choosing a Model

```
Are requirements stable and fully known?
  → YES: consider Waterfall (with modern CI/CD)
  → NO:  use Agile

Is safety/compliance the top priority?
  → YES: V-Model or Spiral
  → NO:  Agile/Scrum

Is this maintenance/support work?
  → YES: Kanban
  → NO:  Scrum
```

## Related

- [[CON-sdlc-phases]] — phases exist in all models
- [[../agile/CON-agile-manifesto]] — Agile model foundation
- [[../../../00-MOC/MOC-SDLC]]
