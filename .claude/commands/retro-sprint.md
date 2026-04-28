# /retro-sprint
Workflow position: **(all tasks done + /git-commit) → START → next sprint**

Write a sprint-level retrospective. Run ONCE after ALL tasks are done and committed.
Arguments: `[sprint-id]`  — e.g. `SP1`

---

## Step 1 — Validate sprint is complete

Parse `[sprint-id]`. Read `docs/BACKLOG.md`:
- Any task NOT `done` → stop: "Tasks still open: [list]. Complete all before running /retro-sprint."

Read `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — Goals, Success Metrics, Stories, Definition of Done.

---

## Step 2 — Aggregate all task retros

For every task in the sprint, read `[task-id]-retro.md` and `[task-id]-issues.md` (if exists).

Compute:
- Total estimated vs actual days across all tasks
- Total issues: X critical / Y major / Z minor
- TDD score: how many tasks had tests written before implementation?
- Recurring themes in "what went well" and "what could be improved"
- All knowledge sharing items combined
- All action items combined (deduplicated)


---

## Step 3 — Evaluate sprint goals and success metrics

From `[sprint-id]-overview.md`:
- Each **Goal** → achieved / partially / no
- Each **Success Metric** → actual result vs target
- **Definition of Done (Sprint Level)** → check each checkbox, mark passed/failed


---

## Step 4 — Write the sprint retrospective

Fill `docs/templates/RETRO-SPRINT-TEMPLATE.md` with the data from Steps 2–3. Save to `docs/sprints/[sprint-id]/[sprint-id]-retro.md`.


---

## Step 5 — Update BACKLOG.md

Mark sprint header as done:
```markdown
## [sprint-id] — [Epic Title] ✓ done
```

---

## Step 6 — Extract brain knowledge (required)

**Dedup first.** `/retro-task` Step 4 may have already captured items. Before scanning, build a dedup set:
1. List existing notes with frontmatter `source: retro-task <task-id>` for any `[task-id]` in this sprint (grep the brain folders).
2. Read the *Brain Entries Written* table in each `[task-id]-retro.md`.
3. Skip candidates that match an already-captured entry. Include those entries in the sprint summary (Step below) but do NOT re-write them.

Then scan all retro and issue files for **new** knowledge worth preserving:
- **Decisions**: "we decided to...", trade-offs resolved, approaches chosen over alternatives
- **Patterns**: "we'll always...", recurring solutions, code structures that worked well
- **Lessons**: "what could be improved" items, bugs that revealed a process gap, estimates significantly off
- **Concepts**: new project-specific vocabulary or mental models established this sprint

Present candidates grouped by category:
```
Found [N] knowledge items from [sprint-id]:

DECISIONS ([N]): [1] [title] — [one-line description] ...
PATTERNS ([N]): [2] [title] — [one-line description] ...
LESSONS ([N]):  [3] [title] — [one-line description] ...
CONCEPTS ([N]): [4] [title] — [one-line description] ...

Write all / pick numbers:
```

For each confirmed item, write an atomic note to the matching folder. Always set `source: retro-sprint [sprint-id]` in frontmatter (distinguishes from task-level captures):
- Decision → `brain/02-decisions/DEC-[NNN]-[slug].md` — frontmatter: type/id/status/date/sprint/source/tags + sections: Status / Context / Decision / Rationale / Consequences
- Pattern → `brain/03-patterns/PAT-[NNN]-[slug].md` — frontmatter: type/id/sprint/source/tags + sections: Problem / Solution / When to Use / When NOT to Use / Example
- Lesson → `brain/04-lessons/LES-[NNN]-[slug].md` — frontmatter: type/id/sprint/source/tags + sections: What Happened / Root Cause / What Changed / Links
- Concept → `brain/01-concepts/CON-[slug].md`

IDs are sequential within each prefix — read existing files to find the next number.

After writing notes:
1. Add new entries to `brain/00-MOC/MOC-Decisions.md`, `MOC-Patterns.md`, and `MOC-Lessons.md` tables.
2. Create or update `brain/05-sprints/[sprint-id]-brain.md` — summary of what was built, key decisions, lessons, and patterns (link to notes). Include both **task-captured** and **sprint-captured** entries here for a complete picture.
3. Add sprint row to Sprint Knowledge table in `brain/BRAIN-INDEX.md` — totals reflect ALL entries from this sprint (task + sprint sources combined).
4. Ask: "Any of these should become a permanent team rule in CLAUDE.md? (y/n per item)" → append confirmed items to the relevant CLAUDE.md section. Review BOTH new sprint-level entries AND task-level entries from this sprint that have not yet been promoted.

---

## Output

```
✓ docs/sprints/[sprint-id]/[sprint-id]-retro.md
✓ BACKLOG.md — [sprint-id] marked done
✓ brain/ — [N] decisions · [N] patterns · [N] lessons written

Summary: [N/N] goals achieved  |  [X] → [Y] days  |  [N] issues  |  [N] action items

Next: /discovery [disc-id] [name]  ← start next epic
  or: /new-sprint [sprint-id] [description]  ← if already discovered
```
