# /new-sprint
Workflow position: **/discovery → START → /requirement**

Create a new sprint from an epic description and scaffold all sub-tasks.
Arguments: `[sprint-id] [epic description]`  — e.g. `SP2 Build user authentication with OAuth`

---

## Step 1 — Validate

1. Parse `[sprint-id]` and `[epic description]` from `$ARGUMENTS`.
2. Read `docs/BACKLOG.md`:
   - If `[sprint-id]` already exists → stop and warn.
   - Scan ALL task IDs to find the highest `T[NNN]`. Next task starts at +1. If none → start from `T001`.
3. Check `docs/discovery/` for a discovery doc related to this epic:
   - **Not found** → warn: "⚠️ No discovery doc found. Running `/discovery` first is recommended. Continue? (y/n)"
   - **Found** → read it (Problem Statement, chosen approach, scope, constraints). Check for unresolved open questions. If any → warn and list them: "These may affect task scope. Continue? (y/n)"

---

## Step 2 — Create sprint directory and overview

1. Create `docs/sprints/[sprint-id]/`.
2. Create `docs/sprints/[sprint-id]/[sprint-id]-overview.md` from `docs/templates/SPRINT-OVERVIEW-TEMPLATE.md`.
3. Pre-fill: Sprint ID, epic title, Start Date (today), Problem Statement (from discovery or description), Status: `planning`.

---

## Step 3 — Propose sub-task breakdown

Rules:
- Each task is completable by one person in 1–3 days.
- **Each task must be a vertical slice** — delivers a complete user-visible outcome (FE + BE, E2E testable). ✅ "User can log in and see their dashboard" ❌ "Build login API" (BE only).
  - Exception: pure infrastructure tasks (DB migrations, CI) — mark `infra` type, require integration tests.
- No cap on task count — propose as many as needed to cover full epic scope.
- Order by dependencies. Task IDs continue from the global counter found in Step 1.

Present the breakdown:
```
Proposed sub-tasks for [sprint-id] — [epic title]:
(Last used: T[NNN] → starting from T[NNN+1])

| Task ID  | Title | Type | E2E Scenario (one sentence) | Depends On | Points |
|----------|-------|------|-----------------------------|------------|--------|
| SP2-T005 | ...   | fullstack | User does X → sees Y   | —          | 3      |
```
Points: 1 trivial · 2 small · 3 medium-small · 5 medium · 8 large · **13 = too big, split first**.

<HARD-GATE>
If ANY task in the table is assigned 13 points → STOP. Do not proceed to Step 3b.
Break down every 13pt task into smaller tasks (each ≤ 8pt), re-present the full table, and wait for user confirmation before continuing.
</HARD-GATE>

---

## Step 3b — Coverage check vs discovery

If a discovery doc was found, cross-check proposed tasks against it:
- **Goals** — which task covers each Goal / Success Metric? Flag uncovered goals.
- **In-scope items** — which task covers each? Flag uncovered items.
- **User journeys** — which task delivers each To-Be journey end-to-end? Flag uncovered journeys.

```
Coverage check:
✅ Covered:    [item] → T00N
⚠️ Not covered → adding T00N: [title]
➖ Out of scope: [item] — reason: [why]
```
Do NOT silently drop any in-scope item. Add a task or mark explicitly out-of-scope.

Ask: "Does this breakdown look right? Rename, add/remove rows, or say 'confirm'."
Wait for confirmation.

---

## Step 4 — Update docs

1. Fill the Sub-tasks table in `[sprint-id]-overview.md` with the confirmed list.
2. Add sprint section to `docs/BACKLOG.md`:

```markdown
## [sprint-id] — [Epic Title]
> `docs/sprints/[sprint-id]/[sprint-id]-overview.md`

| Task | Title | Depends On | Points | Status | Priority | Assigned |
|------|-------|------------|--------|--------|----------|----------|
| SP2-T005 | ... | — | 3 | `todo` | — | — |
```
No per-task files created here. `/requirement` creates them when work begins.

---

## Output

```
✓ docs/sprints/[sprint-id]/[sprint-id]-overview.md
✓ BACKLOG.md updated — [N] tasks added

Next: /run-tasks [task-id] [task-id] ...   ← parallel
  or: /next-task                            ← sequential
```
