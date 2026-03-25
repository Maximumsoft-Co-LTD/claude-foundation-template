---
type: MOC
topic: architecture
tags: [system-design, tech-stack, structure, conventions]
updated: 2026-03-25
---

# 🗺️ MOC — Architecture

> Map of all architectural knowledge: system structure, tech decisions, and code conventions.

---

## Project Structure

```
[project root]/
├── CLAUDE.md              ← AI session manifest (loaded every session)
├── brain/                 ← 🧠 Knowledge vault (this folder)
├── docs/
│   ├── BACKLOG.md         ← Task registry
│   ├── discovery/         ← Pre-sprint discovery docs
│   ├── sprints/SP[N]/     ← Per-sprint output
│   └── templates/         ← Doc scaffolds
└── .claude/
    ├── commands/          ← Slash command definitions
    ├── rules/             ← Path-scoped lint rules (auto-loaded)
    ├── hooks/             ← PostToolUse lifecycle scripts
    └── settings.json      ← Hook trigger config
```

## Path-Scoped Rules (Auto-Loaded by Claude)

| Rule File | Applies To |
|-----------|------------|
| `.claude/rules/testing.md` | All test files |
| `.claude/rules/backend.md` | `src/api/**`, `internal/**`, `pkg/**`, `server/**` |
| `.claude/rules/frontend.md` | `src/**/*.{ts,tsx}`, `pages/**`, `app/**` |

## Lifecycle Hooks

| Hook | Trigger | Script |
|------|---------|--------|
| Lint Go | `Write\|Edit` | `lint_go.py` → `golangci-lint` |
| Lint TS | `Write\|Edit` | `lint_ts.py` → `tsc` |
| Lint JS | `Write\|Edit` | `lint_js.py` → ESLint |
| Run Tests | `Write\|Edit` | `run_tests.py` → full test suite |

## Conventions

- [[../01-concepts/CON-branch-commit-format]]
- [[../01-concepts/CON-task-id-format]]
- [[../01-concepts/CON-document-structure]]

## Key Architectural Decisions

- [[../02-decisions/DEC-001-real-deps-integration-tests]]
- [[../02-decisions/DEC-002-posttooluse-lint-hooks]]
- [[../02-decisions/DEC-003-vertical-slice-tasks]]

## Backend Conventions (from rules)

- HTTP handler → service layer → repository layer (no skipping)
- Services must NOT import HTTP types
- Repositories must NOT contain business logic
- All endpoints need integration tests against real test DB
- Never `SELECT *` — name columns explicitly
- Migrations must be backward-compatible
- Return 422 (validation), 404 (not found), 409 (conflict)

## Frontend Conventions (from rules)

- PascalCase for file and export names (`UserCard.tsx`)
- Co-locate tests: `UserCard.test.tsx` next to component
- One component per file, no barrel exports for components
- No inline styles — use project's design system
- Server state: React Query / SWR (no manual `useEffect` for fetching)
- Form state: React Hook Form
- All interactive elements need accessible labels
