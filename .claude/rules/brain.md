# Brain (Knowledge Vault) Rules

**Do NOT read the brain at the start of every session.** Read it only when the task requires it.

## When to read the brain

Read `brain/BRAIN-INDEX.md` only when:
- Running a workflow command (`/discovery`, `/requirement`, `/implement`, `/retro-task`)
- About to finalize an architectural decision
- Explicitly asked to check past patterns or lessons

## MOC selection guide (after reading BRAIN-INDEX)

Open only the MOC relevant to your task — never multiple at once:
- FE design or React/UI → `brain/00-MOC/MOC-Frontend.md`
- BE design or API/DB → `brain/00-MOC/MOC-Backend.md`
- Workflow command → `brain/00-MOC/MOC-Workflow.md`
- Writing tests → `brain/00-MOC/MOC-QA.md`
- Architectural decision → `brain/00-MOC/MOC-Decisions.md`
- Past lesson warning → `brain/00-MOC/MOC-Lessons.md`

## Mid-task checks (targeted only)
- Before a design decision → check `02-decisions/` for matching DEC note
- Before implementing a known pattern → check `03-patterns/` for PAT note
- When an AC matches a past lesson → check `04-lessons/`

## When to write to the brain

Capture a note only when it is **durable enough to change future work**:
- It will change a future decision, review checklist, test plan, or search path
- It is reusable beyond the current task or sprint
- It is specific enough that another engineer can apply it without the original chat history

Do **not** promote these into the brain:
- One-off task status, handoff notes, or temporary blockers
- Raw bug chronology without the reusable rule/pattern behind it
- Vague reminders like "be careful" or "check this next time"

Before creating a new note, search for an existing one and prefer **update + cross-link** over near-duplicate notes.

**Never:** read the entire brain vault. Always navigate MOC → targeted notes only.
