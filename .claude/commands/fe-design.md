# /fe-design
Workflow position: **/requirement → START → /be-design**

Write the complete frontend design and TDD test plan. Run BEFORE writing any code.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read in order:
1. `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — epic goals and constraints
2. `docs/discovery/` — scan for related doc. If found, read: constraints (technical, UX, performance, accessibility).
3. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs, success metrics, design references

Validate: if ACs are all empty → stop: "Fill in `[task-id]-requirement.md` first."

**Explore existing codebase** — do this before designing anything:
1. Glob `src/` (or equivalent) to understand folder structure — where components, pages, hooks, stores, tests live.
2. From the ACs, identify what UI elements/screens/flows this task needs. Search the codebase for any existing component or page that is similar or overlapping.
3. Read 2–3 of the most relevant existing components/pages to extract:
   - Naming convention (PascalCase? kebab-case files?)
   - State management pattern used (Redux, Zustand, Context, local state?)
   - How API calls are made (axios instance, fetch wrapper, React Query?)
   - How errors and loading states are handled
   - How tests are structured (describe/it blocks, what's mocked, what test utilities exist)
4. Check existing routing file — how routes are registered, what wrappers/guards are used.
5. Note everything that can be **reused** (components, hooks, utilities, test helpers). Do NOT redesign what already exists.

Write findings as **Existing Code Context** at the top of your design doc:
```
## Existing Code Context
- File structure: src/components/ | src/pages/ | src/hooks/ | ...
- Naming: PascalCase components, kebab-case files
- State: [pattern found]
- API calls: [pattern found]
- Reusable: [list actual components/hooks/utilities to reuse]
- Test pattern: [describe what test utilities/factories exist]
```
If the codebase is empty (new project) → note "No existing code — establishing conventions" and proceed.

Read **Points** from requirement doc Metadata. Apply points-based section scope (write `"N/A — Xpt task"` for unrequired sections):

| Points | Required sections |
|--------|------------------|
| **1pt** | Approach paragraph, Component list, 1 TDD test per AC |
| **2pt** | + Component Breakdown (table), API Contracts Consumed, State & Data Flow (brief), Fail State table |
| **3pt** | + UI/UX Overview, Loading & Skeleton States, Implementation Plan, E2E Test Plan, Fail Case Matrix |
| **5pt+** | All sections — User Journey Map, Behavior Mapping, Routing, Responsive, Analytics, Performance, Fail Flows, Accessibility, State Inventory |
| **8pt** | All sections + ADR entries for non-obvious design choices |

Read existing draft `[task-id]-frontend.md` and `docs/templates/FRONTEND-DESIGN-TEMPLATE.md`.

---

## Step 2 — Fill the complete FE design

For every section required at this point level (per the table above), write implementation-ready content using `docs/templates/FRONTEND-DESIGN-TEMPLATE.md` as the structure.

Key requirements:
- **Implementation Plan** — file paths must be **real paths** from Existing Code Context, not hypothetical. `/implement` follows this plan exactly.
- **TDD Test Plan** — min 1 unit + 1 integration per AC. Written BEFORE code.
- **E2E Test Plan** — min 1 scenario per AC. Format: "Given → When → Then." Written BEFORE code.
- **Fail Case Matrix** — every user action that can fail must have: presentation pattern + exact error copy + recovery CTA + input preserved flag.

---

## Step 2b — Coverage check vs ACs and discovery

For each AC in requirement doc:
- Design component/flow that implements it? TDD test? E2E scenario? Flag any missing.

For each discovery constraint (if doc found):
- Is it addressed in a design section (Responsive, Performance, Accessibility, etc.)? Flag missing.

```
FE Coverage check:
✅ AC-1: component [X] + TDD [Y] + E2E [Z]
⚠️ AC-N: missing TDD → adding to TDD Test Plan
⚠️ Constraint [X]: not addressed → adding to [section]
```
Fill every gap immediately. Do NOT leave gaps unresolved.

---

## Step 3 — Save and update status

1. Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`.
2. Update BACKLOG.md status to `in-progress` if was `todo`.

---

## Output

```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md

TDD Test Plan — write these failing tests BEFORE implementing:
[print TDD test plan table]

E2E Test Plan:
[print E2E test plan table]

Next: /be-design [task-id]
```
