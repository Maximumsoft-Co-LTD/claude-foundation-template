# /brain-update
Workflow position: **/retro-sprint → START (optional, but recommended)**

Extract knowledge from a completed sprint's retros and write atomic notes into the project brain (`brain/`).
Arguments: `[sprint-id]`  — e.g. `SP1`

---

## Step 1 — Load sprint retro data

Parse `[sprint-id]`. Read **in parallel**:
- `docs/sprints/[sprint-id]/[sprint-id]-retro.md` — sprint retrospective
- All `[task-id]-retro.md` files in the sprint folder
- All `[task-id]-issues.md` files in the sprint folder (if they exist)

Also read `brain/BRAIN-INDEX.md` to understand current brain state.

---

## Step 2 — Extract knowledge candidates

Scan all retro and issue documents for:

**Decisions made** (new architectural or process choices):
- Any "we decided to..." statements
- Any trade-off resolved
- Any approach chosen over alternatives

**Patterns discovered** (reusable solutions):
- Any "we'll always..." statements
- Any recurring solution to a problem
- Any code structure that worked well

**Lessons learned** (things to do differently):
- "What could be improved" sections
- Bugs that revealed a process gap
- Estimates that were significantly off

**New concepts** (terms or abstractions that emerged):
- New project-specific vocabulary
- New mental models established

**Sprint summary** (high-level what happened):
- Goals achieved / partially / not achieved
- Key metrics vs targets

---

## Step 3 — Present candidates for review

Show the extracted items grouped by category:

```
Found [N] knowledge items from [sprint-id]:

DECISIONS ([N]):
  [1] [title] — [one-line description]
  [2] ...

PATTERNS ([N]):
  [3] [title] — [one-line description]

LESSONS ([N]):
  [4] [title] — [one-line description]

CONCEPTS ([N]):
  [5] [title] — [one-line description]

Write all / pick numbers / skip:
```

Wait for user response.

---

## Step 4 — Write atomic notes

For each confirmed item, create the appropriate note:

**Decision** → `brain/02-decisions/DEC-[NNN]-[slug].md`
```markdown
---
type: decision
id: DEC-[NNN]
status: active
date: [today]
sprint: [sprint-id]
tags: [...]
---
# DEC-[NNN] — [Title]
## Status / Context / Decision / Rationale / Consequences
```

**Pattern** → `brain/03-patterns/PAT-[NNN]-[slug].md`
```markdown
---
type: pattern
id: PAT-[NNN]
sprint: [sprint-id]
tags: [...]
---
# PAT-[NNN] — [Title]
## Problem / Solution / When to Use / When NOT to Use / Example
```

**Lesson** → `brain/04-lessons/LES-[NNN]-[slug].md`
```markdown
---
type: lesson
id: LES-[NNN]
sprint: [sprint-id]
tags: [...]
---
# LES-[NNN] — [Title]
## What Happened / Root Cause / What Changed / Links
```

**Concept** → `brain/01-concepts/CON-[slug].md`

IDs are sequential within each prefix — read existing files to find the next number.

---

## Step 5 — Update MOCs and Sprint Brain

1. Add new decisions to the table in `brain/00-MOC/MOC-Decisions.md`
2. Add new patterns to the table in `brain/00-MOC/MOC-Patterns.md`
3. Add new lessons to the table in `brain/00-MOC/MOC-Lessons.md`
4. Fill in `brain/05-sprints/[sprint-id]-brain.md` with:
   - Summary of what was built
   - Key decisions made this sprint (link to DEC notes)
   - Lessons learned (link to LES notes)
   - Patterns discovered (link to PAT notes)

If the sprint brain file doesn't exist yet, create it.

---

## Step 6 — Update BRAIN-INDEX.md

Add any new sprint to the Sprint Knowledge table in `brain/BRAIN-INDEX.md`.
Add quick links to any important new concept, decision, or pattern.

---

## Step 7 — Prompt for CLAUDE.md update

Ask:
```
[N] brain notes written. Any of these should become a permanent team rule in CLAUDE.md?

  [title] → "Team Conventions" / "Key Constraints" / "Architecture"

Add to CLAUDE.md? (y/n per item)
```

If yes → append to the relevant CLAUDE.md section.

---

## Output

```
✓ brain/02-decisions/DEC-[NNN]-*.md   ([N] new)
✓ brain/03-patterns/PAT-[NNN]-*.md   ([N] new)
✓ brain/04-lessons/LES-[NNN]-*.md    ([N] new)
✓ brain/05-sprints/[sprint-id]-brain.md (updated)
✓ MOC indexes updated

Brain now has: [N] decisions · [N] patterns · [N] lessons · [N] concepts

Next: /discovery [disc-id] [name]  ← start next epic
```
