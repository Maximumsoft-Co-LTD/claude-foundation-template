---
type: MOC
topic: decisions
tags: [ADR, decisions, rationale]
updated: 2026-03-25
---

# 🗺️ MOC — Decisions (ADR Registry)

> All architectural and team decisions, with rationale. Never delete — only supersede.

---

## Format

Each decision note follows:
- **Status**: `active` | `superseded by [[DEC-XXX]]` | `proposed`
- **Context**: Why did this come up?
- **Decision**: What was chosen?
- **Rationale**: Why this option?
- **Consequences**: What changes?

---

## Decision Log

| ID | Title | Status | Date |
|----|-------|--------|------|
| [[../02-decisions/DEC-001-real-deps-integration-tests]] | Real deps for integration tests (no mocks) | active | 2026-03-25 |
| [[../02-decisions/DEC-002-posttooluse-lint-hooks]] | Auto-lint on every Write/Edit | active | 2026-03-25 |
| [[../02-decisions/DEC-003-vertical-slice-tasks]] | Tasks must be vertical slices (E2E) | active | 2026-03-25 |

---

## How to Add a Decision

1. Create `brain/02-decisions/DEC-[NNN]-[slug].md`
2. Fill all sections (Status, Context, Decision, Rationale, Consequences)
3. Add to the table above
4. Link from relevant MOC or concept note
5. If superseding an old decision, update old note's Status field
