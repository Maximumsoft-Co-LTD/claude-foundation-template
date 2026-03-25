---
type: MOC
topic: developer-fundamentals
tags: [developer, engineering, fundamentals, clean-code, design-patterns]
updated: 2026-03-25
---

# 🗺️ MOC — Developer Fundamentals

> หลักการพื้นฐานที่ developer ทุกคนควรรู้ ไม่ขึ้นกับภาษาหรือ stack

---

## Core Concepts

- [[../01-concepts/developer/CON-solid-principles]] — Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- [[../01-concepts/developer/CON-clean-code]] — Naming, functions, comments, formatting, DRY, KISS, YAGNI
- [[../01-concepts/developer/CON-design-patterns]] — Creational, Structural, Behavioral patterns (Gang of Four)
- [[../01-concepts/developer/CON-refactoring]] — Safe code improvement without behavior change
- [[../01-concepts/developer/CON-code-review-checklist]] — What to look for when reviewing
- [[../01-concepts/developer/CON-version-control-git]] — Branching strategies, commit best practices, rebase vs merge

## Core Principles Summary

| Principle | Rule |
|-----------|------|
| DRY | Don't Repeat Yourself — extract shared logic |
| KISS | Keep It Simple, Stupid — simplest solution first |
| YAGNI | You Aren't Gonna Need It — don't build for future guesses |
| SRP | One class/function = one reason to change |
| Separation of Concerns | UI logic ≠ business logic ≠ data access |

## Design Patterns Quick Reference

| Category | Pattern | Problem it Solves |
|----------|---------|------------------|
| Creational | Factory, Builder, Singleton | Object creation complexity |
| Structural | Adapter, Decorator, Facade | Object composition |
| Behavioral | Observer, Strategy, Command | Object communication |

## Code Quality Pyramid

```
        Clean Code (naming, structure)
       /
      Design Patterns (reusable solutions)
     /
    Refactoring (continuous improvement)
   /
  Testing (safety net for changes)
 /
Version Control (history + collaboration)
```

## Related MOCs

- [[MOC-Backend]] — applies these principles to server-side
- [[MOC-Frontend]] — applies these principles to UI layer
- [[MOC-QA]] — testing supports developer fundamentals
- [[MOC-Architecture]] — higher-level system design
