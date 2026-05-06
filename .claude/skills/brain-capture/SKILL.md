---
description: Write atomic notes (LES/PAT/DEC/GLO) to brain/ vault with proper frontmatter, IDs, and MOC linkage — the only sanctioned writer for brain
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(ls:*), Bash(grep:*)
disable-model-invocation: false
---

# brain-capture

Workflow position: **invoke when a novel insight, decision, pattern, or term emerges that future work should remember**

The only place that writes to `brain/`. Enforces atomic-note discipline so the vault doesn't decay into a dump.

Arguments: `[content summary]` or context from caller (`/retro-task`, `/retro-sprint`, etc.)

---

## When to invoke

- `/retro-task` step 4 — captured friction is high-bar enough
- `/retro-sprint` step 6 — promoting task captures to sprint level
- Mid-task — `solution-options` produced an architectural DEC
- Mid-task — discovered a reusable pattern (PAT)
- Glossary term used 2nd time without definition

Skip:
- Insight is task-specific only — it goes in the retro doc, not brain
- Already exists — `grep` first, don't duplicate

---

## Step 1 — Pick the note type

| Type | Prefix | When |
|---|---|---|
| Lesson | LES | Mistake → fix; "next time, do X not Y" |
| Pattern | PAT | Reusable implementation (≥ 2 use cases foreseen) |
| Decision | DEC | Architectural choice with rationale, hard to reverse |
| Glossary | GLO | Project-specific term reused 2+ times |
| Concept | CON | Mental model that explains a class of decisions |

Pick exactly one. If torn between LES and PAT → it's a LES; PAT is for things you'd implement again.

---

## Step 2 — Check for duplicates

```bash
grep -rli "[main keyword]" brain/0[1-6]-*/ 2>/dev/null
```

If a note exists:
- **Same insight, just confirms** → append a "## See also" link to the existing note's source list. Don't write new.
- **Refines / corrects** → edit the existing note. Add a "## Updated [date]" section.
- **Truly different** → write new with explicit cross-link.

---

## Step 3 — Get next ID

```bash
ls brain/0[1-6]-*/ | grep -oE '(LES|PAT|DEC|GLO|CON)-[0-9]+' | sort -V | tail -5
```

Find the highest existing number for the chosen type, +1. Pad to 3 digits (e.g. `LES-007`).

---

## Step 4 — Write the note

Path by type:
- LES → `brain/04-lessons/LES-NNN-kebab-title.md`
- PAT → `brain/03-patterns/PAT-NNN-kebab-title.md`
- DEC → `brain/02-decisions/DEC-NNN-kebab-title.md`
- GLO → `brain/06-glossary/GLO-NNN-kebab-title.md`
- CON → `brain/01-concepts/CON-NNN-kebab-title.md`

Frontmatter (required):

```yaml
---
id: LES-NNN
title: [≤ 60 char title]
type: lesson  # or pattern / decision / glossary / concept
tags: [stack-tag, domain-tag]
created: YYYY-MM-DD
sprint: SP[N]  # or null if cross-sprint
source: from-bug / from-retro / from-design / from-research
related: [LES-XXX, PAT-YYY]   # links to other notes
---
```

Body shape varies by type — see templates below.

### LES (lesson) body
```markdown
## What happened
[1 paragraph — concrete situation, no euphemism]

## What we should have done
[the rule that would have prevented it]

## How to detect next time
[symptom, file path, or test that catches recurrence]

## Source
[task-id, file:line, or PR link]
```

### PAT (pattern) body
```markdown
## Problem
[when do we hit this]

## Solution
[the pattern in ≤ 5 lines, code snippet OK]

## When to use
- [...]

## When NOT to use
- [...]

## Example
[file path or snippet from real code]
```

### DEC (decision) body
```markdown
## Context
[what forced the decision]

## Options considered
- A: [...]
- B: [...]

## Decision
[chosen option]

## Why
[deciding factor]

## Consequences
- Positive: [...]
- Negative / accepted cost: [...]

## Reversal cost
[easy / medium / hard, why]
```

### GLO (glossary) body
```markdown
**Definition:** [≤ 30 words]

**Used in:** [where it appears]

**NOT to be confused with:** [related but different terms]
```

---

## Step 5 — Update MOC index

The MOC for the type lives in `brain/00-MOC/`:
- LES → `MOC-Lessons.md`
- PAT → patterns by area (`MOC-Frontend.md`, `MOC-Backend.md`, `MOC-QA.md`)
- DEC → `MOC-Decisions.md`
- GLO → glossary itself acts as MOC (or `MOC-Glossary.md` if exists)

Add a single line under the right section:

```markdown
- [[LES-007-audit-outside-transaction]] — single-sentence summary
```

If no MOC exists for the area, create one with a basic header.

---

## Step 6 — Self-check

Before declaring done:

| Check | Pass condition |
|---|---|
| Frontmatter complete? | all required fields filled |
| ID unique? | grep returns no other note with this ID |
| Cross-link in MOC? | yes |
| Body matches type template? | yes |
| Title ≤ 60 chars? | yes |
| Atomic? | one idea per note — if 2 → split |

---

## Output

```
brain-capture: [type] [ID]
File: brain/0X-folder/[ID]-title.md
MOC updated: [path]
Cross-links: [N]
```

---

## Anti-patterns

- ❌ Writing notes that say "remember to be careful" — too vague to act on
- ❌ One note covering 3 lessons — split into 3 atomic notes
- ❌ Skipping MOC update — orphaned notes can't be found later
- ❌ Re-writing existing note instead of updating — duplicates poison search

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: write note + update MOC + emit summary.
- **Autopilot mode**: same — never blocks. If a duplicate note exists and the new content materially differs, flag `?` so user can confirm the edit (don't silently overwrite a DEC).

## Output (autopilot status line — required)

`> brain-capture: [TYPE]-[NNN] [title]  [✓]`

Example: `> brain-capture: LES-008 audit-outside-tx  ✓`

---

## Why this exists

The brain is only useful if (a) notes are findable and (b) notes say something specific enough to apply. Free-form note-taking fails both. This skill enforces the discipline that makes the vault searchable in 6 months when nobody remembers the original context.
