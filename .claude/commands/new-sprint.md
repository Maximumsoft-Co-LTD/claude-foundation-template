# /new-sprint
Workflow position: **/discovery → START → /requirement**

Create a new sprint from an epic description and scaffold all sub-tasks.
Arguments: $ARGUMENTS
Format: `[sprint-id] [epic description]`  — e.g. `SP2 Build user authentication with OAuth and role management`

---

## Step 1 — Validate and resolve next task number

1. Parse `[sprint-id]` and `[epic description]` from `$ARGUMENTS`.
   - Sprint ID format: `SP[N]` — e.g. `SP1`, `SP2`, `SP3`
2. Read `docs/BACKLOG.md`:
   - If `[sprint-id]` already exists → stop and warn the user.
   - Scan ALL task IDs across every sprint to find the highest `T[NNN]` number. The next task starts at that number + 1.
   - If no tasks exist yet → start from `T001`.
3. Check `docs/discovery/` for any discovery doc related to this epic.
   - If **NO discovery doc found** → warn: "⚠️ No discovery doc found for this epic. Running `/discovery` first gives better task coverage and surfaces constraints early. Continue without it? (y/n)" — wait for response before proceeding.
   - If **discovery doc found** → read it for context (Problem Statement, chosen approach, scope estimate, constraints). Then check for unresolved open questions (any item not marked resolved/answered). If any exist → warn: "⚠️ Discovery doc has unresolved open questions:" and list each one. Then ask: "These may affect task scope. Continue anyway? (y/n)" — wait for response before proceeding.

---

## Step 2 — Create the sprint directory and overview

1. Create directory `docs/sprints/[sprint-id]/`.  (e.g. `docs/sprints/SP2/`)
2. Create `docs/sprints/[sprint-id]/[sprint-id]-overview.md` from `docs/templates/SPRINT-OVERVIEW-TEMPLATE.md`.
3. Pre-fill:
   - Sprint ID, epic title (derived from description)
   - Start Date: today
   - Problem Statement: from epic description (or discovery doc if available)
   - Design References: from discovery doc if available
   - Status: `planning`

---

## Step 3 — Propose sub-task breakdown

Analyze the epic and propose a breakdown. Rules:
- Each sub-task is completable by one person in 1–3 days.
- **Each task must be a vertical slice** — it delivers a complete user-visible outcome (FE + BE together). A task that is only "build the API" or only "build the UI" is not a valid task on its own, because it cannot be E2E tested.
  - ✅ "User can log in and see their dashboard" — has FE, BE, and is E2E testable
  - ❌ "Build login API endpoint" — BE only, no user-visible outcome
  - ❌ "Build login form UI" — FE only, cannot run E2E without backend
  - Exception: tasks that are purely infrastructure/setup (e.g. DB migrations, CI pipelines) with no user-facing behavior — mark as `infra` type and note they require integration tests instead of E2E.
- Every non-infra task must have a clear user story that describes the E2E scenario.
- Identify dependencies (which tasks must be done first).
- **No cap on number of tasks** — propose as many tasks as needed to fully cover the epic scope. Each task must still be 1–3 days.
- Order tasks so dependencies are respected.

Task IDs continue from the global sequence found in Step 1.
Example: if the last task across all sprints was `T004`, this sprint starts from `SP2-T005`.

Present the breakdown:

```
Proposed sub-tasks for [sprint-id] — [epic title]:
(Global task counter: last used T[NNN], starting from T[NNN+1])

| Task ID     | Title                               | Type      | E2E Scenario (one sentence)              | Depends On  | Est. |
|-------------|-------------------------------------|-----------|------------------------------------------|-------------|------|
| SP2-T005    | User can register an account        | fullstack | User fills form → sees welcome screen    | —           | 2d   |
| SP2-T006    | User can log in and access dashboard| fullstack | User logs in → lands on dashboard        | SP2-T005    | 2d   |
| SP2-T007    | Admin can manage user roles         | fullstack | Admin changes role → user sees new perms | SP2-T006    | 2d   |
```

---

## Step 3b — Coverage check against discovery

If a discovery doc was found in Step 1, cross-check the proposed tasks against it:

1. **Goals coverage** — for each Goal / Success Metric in the discovery doc, identify which task(s) cover it. Flag any goal with no task.
2. **In-scope coverage** — for each item listed as in-scope in the discovery doc, identify which task covers it. Flag any in-scope item with no task.
3. **User journeys coverage** — for each To-Be user journey in the discovery doc, identify which task delivers it end-to-end. Flag any journey with no task.

Present the coverage summary after the task table:

```
Coverage check vs discovery doc:

✅ Covered
  - [Goal/Scope item] → [Task ID]
  - ...

⚠️ Not covered — adding tasks:
  - [Goal/Scope item] → adding [new Task ID]: [title]
  - ...

➖ Explicitly out of scope:
  - [item] — reason: [why excluded]
```

- For every uncovered item: either add a new task to the breakdown or explicitly mark it as out-of-scope with a reason.
- Do NOT silently drop any in-scope item from discovery.

After showing the coverage summary, ask: "Does this breakdown look right? You can rename tasks, add/remove rows, or say 'confirm' to scaffold all."

---

## Step 4 — Update docs (after user confirms)

1. Fill the Sub-tasks table in `[sprint-id]-overview.md` with the confirmed list.
2. Add a new sprint section to `docs/BACKLOG.md`:

```markdown
## [sprint-id] — [Epic Title]
> `docs/sprints/[sprint-id]/[sprint-id]-overview.md`

| Task | Title | Depends On | Status | Priority | Assigned |
|------|-------|------------|--------|----------|----------|
| SP2-T005 | ... | — | `todo` | — | — |
| SP2-T006 | ... | SP2-T005 | `todo` | — | — |
```

No per-task files are created here. `/fe-design` and `/be-design` create their own docs when the task begins.

---

## Step 5 — Output

```
✓ Sprint created: docs/sprints/[sprint-id]/[sprint-id]-overview.md
✓ BACKLOG.md updated with [N] tasks

Next steps:
  Run /next-task to pick up the first task and begin /fe-design or /be-design
```
