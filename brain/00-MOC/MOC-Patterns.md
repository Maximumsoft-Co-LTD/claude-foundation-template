---
type: MOC
topic: patterns
tags: [patterns, reusable, conventions, code]
updated: 2026-03-25
---

# 🗺️ MOC — Patterns

> Reusable patterns discovered across sprints. Each is an atomic note with a concrete example.

---

## Pattern List

| ID | Pattern | Category | Discovered |
|----|---------|----------|-----------|
| [[../03-patterns/PAT-001-tdd-flow]] | Red → Green → Refactor | Testing | 2026-03-25 |
| [[../03-patterns/PAT-002-parallel-agent-implementation]] | FE + BE agents in parallel | Architecture | 2026-03-25 |
| [[../03-patterns/PAT-003-discovery-before-sprint]] | Always discover before planning | Process | 2026-03-25 |
| [[../03-patterns/PAT-004-superpowers-workflow-integration]] | Superpowers skills layered into template workflow | Workflow | 2026-04-03 |
| [[../03-patterns/PAT-005-subagent-driven-development]] | 3-agent pipeline: implementer → spec reviewer → quality reviewer | Workflow | 2026-04-15 |
| [[../03-patterns/PAT-006-worktree-isolation]] | Git worktrees for parallel-agent file isolation | Workflow | 2026-04-15 |
| [[../03-patterns/PAT-007-headless-parallel-agents]] | `claude -p` subprocesses for context-light parallel runs | Workflow | 2026-04-15 |

---

## Pattern Categories

### Testing Patterns
- [[../03-patterns/PAT-001-tdd-flow]]

### Implementation Patterns
- [[../03-patterns/PAT-002-parallel-agent-implementation]]

### Process Patterns
- [[../03-patterns/PAT-003-discovery-before-sprint]]

### Workflow Patterns
- [[../03-patterns/PAT-004-superpowers-workflow-integration]]
- [[../03-patterns/PAT-005-subagent-driven-development]]
- [[../03-patterns/PAT-006-worktree-isolation]]
- [[../03-patterns/PAT-007-headless-parallel-agents]]

---

## How to Add a Pattern

1. Create `brain/03-patterns/PAT-[NNN]-[slug].md`
2. Include: Problem, Solution, When to Use, When NOT to Use, Example
3. Add to the table above in the right category
4. Link from relevant MOC
