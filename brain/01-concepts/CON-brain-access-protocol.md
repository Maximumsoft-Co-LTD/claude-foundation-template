---
type: concept
tags: [brain, knowledge-vault, workflow, claude-code, context-management]
related: [CON-document-structure, CON-sprint-lifecycle]
updated: 2026-04-29
source: template
---

# Brain Access Protocol

## Core idea

The brain is a **navigable knowledge vault**, not a document to read in full. Claude Code must access it like a developer uses a wiki: **start at the index, follow links to the specific note you need, ignore everything else.**

Reading the entire brain at session start (or even all MOCs) wastes context and trains the agent to dump knowledge instead of finding it.

## The discipline (per `.claude/rules/brain.md`)

**Do NOT read the brain at the start of every session.** Read it only when the task requires it.

### When to open `BRAIN-INDEX.md`

Only when:
- Running a workflow command (`/discovery`, `/requirement`, `/implement`, `/retro-task`)
- About to finalize an architectural decision
- Explicitly asked to check past patterns or lessons

### MOC selection guide (after reading BRAIN-INDEX)

Open **only** the MOC relevant to your task — never multiple at once:

| Task | MOC to open |
|------|-------------|
| FE design or React/UI | `MOC-Frontend.md` |
| BE design or API/DB | `MOC-Backend.md` |
| Workflow command | `MOC-Workflow.md` |
| Writing tests | `MOC-QA.md` |
| Architectural decision | `MOC-Decisions.md` |
| Past lesson warning | `MOC-Lessons.md` |

### Mid-task targeted checks

- Before a design decision → check `02-decisions/` for matching DEC note
- Before implementing a known pattern → check `03-patterns/` for PAT note
- When an AC matches a past lesson → check `04-lessons/`

**Never:** read the entire brain vault. Always navigate MOC → targeted notes only.

## Why this matters

The brain has 100+ notes across 16 domains. Reading them all:
- Pollutes the context with irrelevant material (the agent then "remembers" wrong things)
- Costs tokens that should go to actual work
- Creates the illusion of knowledge without focus

Reading **the right 1–3 notes**:
- Gives precise, applicable guidance
- Leaves room for the actual work
- Reinforces "atomic note" discipline (one concept per note)

## The MOC pattern

A **Map of Content (MOC)** is a topic index. It links to atomic notes within a domain. The shape:

```
MOC-Backend.md
├── Concepts: links to CON-* notes about backend
├── Patterns: links to PAT-* notes for backend
├── Decisions: links to DEC-* about backend
└── Lessons: links to LES-* relating to backend
```

You read the MOC to find the **one concept note** you need. You don't read the MOC's full contents.

## Atomic notes

Each note in the brain covers **one concept**, with explicit `related:` links to neighbors. This is Obsidian's atomic-note philosophy: one idea per note, dense link graph between notes.

A note is atomic when:
- Its title is one concept (not "auth and sessions and JWT")
- It can stand alone (doesn't require reading 3 other notes first)
- It links to related notes for depth

If a note grows past ~300 lines, split it into atomic pieces.

## Brain growth points

The brain grows through specific workflow commands, not freeform writing:

1. **`/retro-task` Step 4** — high-bar capture from one task (most tasks produce zero entries)
2. **`/retro-sprint` Step 6** — consolidates sprint-level entries with dedup against task captures
3. **`/discovery` Step 0** — auto-checks past lessons before fresh discovery
4. **Architectural debate** → log as DEC note in `02-decisions/`
5. **Reusable pattern found** → atomic PAT note in `03-patterns/`

There is **no** `/brain-update` command. Growth is integrated into the workflow itself.

## Source tags

Notes carry a `source:` field:

| Value | Meaning |
|-------|---------|
| `source: template` | Pre-seeded reference knowledge. Generic best practice. Safe to extend. |
| `source: template-example` | Illustrative example showing format/depth. Replace with project content. |
| *(absent)* | Organic — created during a real sprint. Highest value. |

When organizing, prefer keeping organic notes intact and rewriting `template-example` notes as the project matures.

## Anti-pattern: full-brain read

Symptom: agent loads BRAIN-INDEX, then reads every linked MOC, then reads many concept notes "to be thorough."

Result: 30k+ tokens consumed before any work begins; agent's response is less focused (signal lost in noise).

Fix: enforce the MOC-then-targeted-note discipline. If unsure which MOC, pick the most likely one and check there first; expand only if missing.

## Anti-pattern: writing into MOC instead of an atomic note

MOCs are indexes. Don't write content into them — write a new atomic note and add a link to the MOC.

## Related

- `.claude/rules/brain.md` — runtime enforcement of access protocol
- [[CON-document-structure]] — how `docs/` and `brain/` divide responsibility
- `BRAIN-INDEX.md` — entry point
- Obsidian vault philosophy — external reference for the atomic-note + MOC pattern
