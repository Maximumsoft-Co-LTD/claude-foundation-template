# /retro-task
Workflow position: **/testing → START → /git-commit**

Write a retrospective for a completed task, mark it done, and capture brain-worthy learnings while context is fresh.

Run after every task. Run `/retro-sprint` only after ALL tasks in a sprint are done.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read in parallel:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — unified doc with `Estimate`, ACs, TDD test plans (FE and BE), and the Task Type field
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (if exists) — bugs encountered
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-smoke.md` (if exists) — FE smoke walkthrough evidence
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-debug.md` (if exists) — debug record from `/debug`

Run `git log --oneline --grep="[task-id]"` and capture commit messages — TDD signal lives here (test commits before impl commits).

### FE smoke evidence — HARD GATE

<HARD-GATE>
If the requirement doc's `Task Type` is `fullstack` or `fe-only`, `[task-id]-smoke.md` MUST exist before this command may proceed.

If missing, STOP and print:
```
✗ FE smoke walkthrough required — re-run /testing [task-id] (Step 6a-smoke)
```
Do NOT mark the task done, do NOT write the retro, do NOT capture brain entries.

If Task Type is `be-only` or `infra`, no smoke file is required — continue silently.
</HARD-GATE>

---

## Step 1b — Confidence Gate

Assess confidence that you can write a complete, accurate retro from context loaded so far.

Key dimensions:
- Requirement doc has explicit ACs and `Estimate`?
- Commits clearly attributable to this task?
- Issues file scanned (or confirmed absent)?
- Test files exist for the AC coverage check?

**>= 90%** → proceed.
**< 90%** → **STOP.** State what's missing. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

---

## Step 2 — Compute metrics

Compute these directly — do not leave the template fields blank or as `X days` placeholders.

| Metric | How |
|--------|-----|
| Estimated days | `Estimate` field in requirement doc metadata |
| Actual days | Calendar days from first to last task commit |
| Variance | `actual − estimated`. Flag if `|variance| > 50%` of estimate — likely lesson candidate |
| Issue count | From issues file: `X critical / Y major / Z minor` (`0/0/0` if no file) |
| TDD adherence | Scan commit log: did test commits precede implementation commits? `yes / partially / no` |
| AC coverage | For each AC, locate the matching test file. Confirm the test exists AND passes. Build the table for the template. |

---

## Step 3 — Write the retrospective

Fill `docs/templates/RETRO-TASK-TEMPLATE.md` with the data from Step 2. Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`.

**Self-check** (per `.claude/rules/self-check.md`) — re-read the file and confirm:
- [ ] All numeric metrics filled (no `X days` / `Y days` / `[N]` placeholders left).
- [ ] AC Coverage table has one row per AC; no row left with the literal `yes / no` default.
- [ ] *What went well* / *What could be improved* / *Knowledge sharing* each have a concrete bullet (or explicit `none`).
- [ ] No `TBD`, `TODO`, or empty required fields.

Fix any gap before continuing.

---

## Step 4 — Capture brain knowledge (high-bar, optional)

Skip this step if `brain/` doesn't exist (template not initialized for brain).

Scan the retro + issues + commit messages for items that would help **future** work. **The bar is high — most tasks produce zero entries; that is the expected outcome.**

Capture only if:
- **Decision** — a non-obvious choice with rationale that would inform future similar choices (not "we used the existing framework").
- **Pattern** — a solution worth reusing across tasks (not "this one specific function").
- **Lesson** — a mistake or surprise that should change how we approach similar work.
- **Concept** — new project-specific vocabulary worth defining once.

If nothing meets the bar → skip silently. Do not invent items to fill quotas.

If candidates exist, present them grouped:

```
Brain candidates from [task-id]:

DECISIONS ([N]): [1] [title] — [one-line description]
PATTERNS  ([N]): [2] [title] — [one-line description]
LESSONS   ([N]): [3] [title] — [one-line description]
CONCEPTS  ([N]): [4] [title] — [one-line description]

Write all / pick numbers / skip:
```

For each confirmed item, write an atomic note. **Always include `source: retro-task [task-id]`** in frontmatter so `/retro-sprint` Step 6 dedupes against it.

If the item originates from `[task-id]-issues.md` and any sourced issue has `Severity: critical` or `Severity: major`, also set `from_bug: true` in the frontmatter — this lets `/brain-meter` and future audits filter "lessons from bugs" vs. "lessons from features." Once written, fill the `Brain entry` field in the source issue block with the new note's path.

- Decision → `brain/02-decisions/DEC-[NNN]-[slug].md` — frontmatter: `type/id/status/date/sprint/source/from_bug?/tags` + sections: Status / Context / Decision / Rationale / Consequences
- Pattern → `brain/03-patterns/PAT-[NNN]-[slug].md` — frontmatter: `type/id/sprint/source/from_bug?/tags` + sections: Problem / Solution / When to Use / When NOT to Use / Example
- Lesson → `brain/04-lessons/LES-[NNN]-[slug].md` — frontmatter: `type/id/sprint/source/from_bug?/tags` + sections: What Happened / Root Cause / What Changed / Links
- Concept → `brain/01-concepts/CON-[slug].md`

IDs are sequential within each prefix — read existing files to find the next number.

After writing notes:
1. Append rows to the matching MOCs only — `brain/00-MOC/MOC-Decisions.md`, `MOC-Patterns.md`, `MOC-Lessons.md`.
2. Append a row to the *Brain Entries Written* table in `[task-id]-retro.md` (one row per note, with ID and link).
3. **Do NOT** update `brain/05-sprints/[sprint-id]-brain.md` or `BRAIN-INDEX.md` — `/retro-sprint` consolidates these at sprint end.
4. **Do NOT** prompt for CLAUDE.md rule promotion — `/retro-sprint` reviews promotions once per sprint with full context.

---

## Step 5 — Update BACKLOG.md

1. Change task status to `done` in its sprint table.
2. Add to the **Done** table at the bottom with today's date and sprint.

---

## Step 6 — Check sprint completion

Read `docs/BACKLOG.md` — any tasks in `[sprint-id]` not yet `done`?
- Tasks remain → next step is `/git-commit`.
- ALL tasks done → note: "All tasks in [sprint-id] done. After committing, run `/retro-sprint [sprint-id]`."

---

## Output

```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md
✓ BACKLOG.md — [task-id] marked done
[if brain entries written]:
✓ brain/ — [N] decisions · [N] patterns · [N] lessons · [N] concepts written

Metrics: estimated [X]d → actual [Y]d  ·  AC coverage [N/N]  ·  TDD [yes/partial/no]  ·  issues [crit/maj/min]

Next: /git-commit [task-id]
[If sprint complete]: Then → /retro-sprint [sprint-id]
```
