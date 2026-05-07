# /new-sprint
Workflow position: **/discovery → START → /requirement**

Create a new sprint from an epic description and scaffold all stories.
Arguments: `[sprint-id] [epic description]`  — e.g. `SP2 Build user authentication with OAuth`

---

> **See worked example:** `.claude/examples/example-sprint-overview.md` — the sprint that follows from `example-discovery.md`, with three vertical-slice stories.

## Step 1 — Validate

This step enforces `.claude/rules/discovery-epic-mapping.md` — every sprint must trace back to a discovery doc and an explicit epic row.

1. Parse `[sprint-id]` and `[epic description]` from `$ARGUMENTS`.
2. Read `docs/BACKLOG.md`:
   - If `[sprint-id]` already exists → stop and warn.
   - Scan ALL task IDs to find the highest `T[NNN]`. Next task starts at +1. If none → start from `T001`.
3. Check `docs/discovery/` for a discovery doc related to this epic:
   - **Not found** → warn: "⚠️ No discovery doc found. Running `/discovery` first is recommended. Continue? (y/n)"
   - **Found** → read it (Problem Statement, chosen approach, scope, constraints). Record the discovery file path — it will be written to the sprint overview as `Origin:` in Step 2. Check for unresolved open questions. If any → warn and list them: "These may affect task scope. Continue? (y/n)"
   - **Epic Breakdown present** (multi-epic discovery) → find the row matching `[epic description]` (match by title or scope — fuzzy match is fine; ask user to confirm if ambiguous). If that row has `Depends On = Ek`:
     - Look up Ek's title in the Epic Breakdown.
     - Scan `docs/BACKLOG.md` for a sprint whose epic title matches Ek's title and status is `done`.
     - If no such sprint exists or it is not `done` → warn: "⚠️ This epic depends on [Ek: epic title], which has no completed sprint yet. Continue? (y/n)"
   - Also read **Shared entities / cross-epic concerns** from Epic Breakdown — carry forward to the Stories step so shared components are owned by the first epic that needs them.

---

## Step 2 — Create sprint directory and overview

1. Create `docs/sprints/[sprint-id]/`.
2. Create `docs/sprints/[sprint-id]/[sprint-id]-overview.md` from `docs/templates/SPRINT-OVERVIEW-TEMPLATE.md`.
3. Pre-fill: Sprint ID, epic title, Start Date (today), Problem Statement (from discovery or description), Status: `planning`. If a discovery doc was found in Step 1, also pre-fill `Origin: docs/discovery/[disc-id]-[name].md` per `.claude/rules/discovery-epic-mapping.md`.

---

## Step 2b — Confidence Gate

Assess confidence that you can break this epic into well-scoped, vertical-slice tasks based on all context loaded so far.

Key dimensions:
- Epic scope clear — problem, users, and goals understood?
- Discovery doc available — constraints and chosen approach known?
- Task sizing feasible — enough detail to estimate points?
- Vertical slice principle applicable — you can identify user-visible outcomes?
- Global task counter found — no ID collision risk?

**>= 90%** → proceed to Step 3.
**< 90%** → **STOP.** State what you know, what you don't, and what you need. Do NOT propose tasks until confidence reaches 90%. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

---

## Step 3 — Propose story breakdown

Rules:
- Each task is completable by one person in 1–3 days.
- **Each task title MUST be a user story** — phrased as `"As a [role], I want [action], so that [outcome]."` The user story IS the task identifier.
- **Each task must be a vertical slice** — delivers a complete user-visible outcome (FE + BE + data, E2E testable from UI to persistence and back).
  - ✅ "As a user, I want to log in with OAuth, so that I can access my dashboard"
  - ❌ "Build login API" (BE-only layer, not a story)
  - ❌ "Create login form component" (FE-only layer, not a story)
  - Exception: pure infrastructure tasks (DB migrations, CI pipeline, env setup) — mark type `infra`, require integration tests, title format: `"[Infra] [what it enables]"` instead of a user story.
- **Valid types:** `feat` (user-facing feature) · `fix` (user-facing bug fix) · `chore` (refactor/cleanup with observable validation) · `infra` (infra — only type exempt from user story format).
- No cap on task count — propose as many as needed to cover full epic scope.
- Order by dependencies. Task IDs continue from the global counter found in Step 1.

Present the breakdown:
```
Proposed stories for [sprint-id] — [epic title]:
(Last used: T[NNN] → starting from T[NNN+1])

| Task ID  | User Story | Type | Depends On | Points |
|----------|-----------|------|------------|--------|
| SP2-T005 | As a [role], I want [X], so that [Y] | feat | — | 3 |
```

Then, below the table, write the E2E Validation Scenarios as rendered markdown (NOT inside a code block):

### E2E Validation Scenarios

**SP2-T005 — [short name]**
1. GIVEN [precondition / setup state]
   WHEN [user action at the UI level]
   THEN [visible system response — what the user sees/gets]
2. GIVEN [error or edge condition]
   WHEN [user action]
   THEN [expected failure/edge behavior]

Minimum 2 scenarios per `feat` task (happy path + at least one error/edge).
Points: 1 trivial · 2 small · 3 medium-small · 5 medium · 8 large · **13 = too big, split first**.

<HARD-GATE>
**Before proceeding to Step 3b, verify the entire table passes both checks:**

**Check A — Points:** If ANY task is 13 points → break it into tasks ≤ 8pt each.

**Check B — Vertical Slice:** For each non-`infra` task, verify all three:
1. **User-facing input** — story starts with a user/role performing an action (not "system does X")
2. **User-visible outcome** — E2E validation ends with something the user can observe (UI change, notification, download, etc.)
3. **Crosses layers** — completing the story requires changes in more than one layer (UI + API, or API + DB + response)

Common violations to catch: "Set up DB schema" → merge into the first feature using it · "Create API endpoint" → merge into the story calling it · "Build X component" → merge into the story displaying it.

If ANY check fails → STOP. Fix the table, re-present, wait for confirmation before Step 3b.
</HARD-GATE>

---

## Step 3b — Coverage check vs discovery

If a discovery doc was found, cross-check proposed tasks against it:
- **Goals** — which task covers each Goal / Success Metric? Flag uncovered goals.
- **In-scope items** — which task covers each? Flag uncovered items.
- **User journeys** — which task delivers each To-Be journey end-to-end? Flag uncovered journeys.

**Metric-instrumentation gate** (per `.claude/rules/metric-instrumentation.md` Gate 1): every Success Metric in the sprint overview MUST have a Measurement cell that names a concrete data source (audit row / structured log line / DB column / counter) AND identifies which task produces the artifact. Block the table if any Measurement is "TBD" or vague. **One-shot manual count is allowed** for v1 metrics only when the cell explicitly names the artifact/condition AND records ownership + a debt note for replacing it with an instrumented source next sprint (e.g. `manual count: rows in X collection where Y, owner: @name, debt: instrument in SP[N+1]`).

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

1. Fill the Stories table in `[sprint-id]-overview.md` with the confirmed list.
2. Add sprint section to `docs/BACKLOG.md`:

```markdown
## [sprint-id] — [Epic Title]
> `docs/sprints/[sprint-id]/[sprint-id]-overview.md`

| Task | User Story | Depends On | Points | Status | Priority | Assigned |
|------|-----------|------------|--------|--------|----------|----------|
| SP2-T005 | As a [role], I want ... | — | 3 | `todo` | — | — |
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
