# /issue
Workflow position: **implement (loop) → START → /code-review**

Log and resolve a bug found during implementation using TDD.
Arguments: `[task-id] [issue description]`  — e.g. `SP1-T002 API returns 500 when email is null`

---

## Step 1 — Parse, classify, load context

Parse `[task-id]` and `[issue description]`, extract `[sprint-id]`.

Classify severity:
- **critical** — blocks the task or breaks existing functionality
- **major** — AC not met but workaround exists
- **minor** — cosmetic, performance, or edge case not in ACs

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — which AC does this violate?
- Relevant design doc (`[task-id]-frontend.md` or `[task-id]-backend.md`) — expected behavior?


---

## Step 1b — Confidence Gate

Assess confidence that you can investigate and resolve this issue based on context loaded so far.

Key dimensions:
- Bug classified correctly (severity)?
- Relevant AC identified — you know what behavior should be?
- Codebase area locatable — you know where to look?
- Design doc available for expected behavior reference?
- Root cause investigatable — enough information to start `/debug` phases?

**>= 90%** → proceed to Step 2.
**< 90%** → **STOP.** State what you know, what you don't, and what you need. Do NOT start investigating until confidence reaches 90%. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

---

## Step 2 — Investigate

Follow `/debug` Phases 1–3 (root cause investigation → pattern analysis → hypothesis testing).
Do NOT implement the fix yet — that's Step 3.

> context7 library doc lookup is included in `/debug` Phase 2 — it fires automatically during pattern analysis if the bug involves a library API.

If stuck after 3 hypotheses → document the blocker and ask the user.

---

## Step 3 — Fix using TDD

Follow `rules/testing.md` — Verify RED is mandatory before implementing:

1. Write a **failing test** that reproduces the bug.
2. **Run it — confirm it fails** (expected failure, not a setup error). Never skip this.
3. Implement the minimal fix — ONE change, address root cause only.
4. Run the full test suite — confirm all pass, 0 regressions.
5. Keep the fix minimal. No "while I'm here" improvements.


---

## Step 4 — Assess impact

Does this bug affect other tasks in the sprint?
- If yes → update their status to `blocked` in `docs/BACKLOG.md` and note the dependency.


---

## Step 5 — Append to issues file

Append one issue entry to `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (create from `docs/templates/ISSUE-TEMPLATE.md` if it doesn't exist).

---

## Output

```
✓ Issue logged: docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md
  Severity: [level]  |  Test added: yes/no  |  Blocks: [list or none]

Next:
  Called during /implement → continue implementation
  Called after /code-review  → /testing [task-id]
```

If unresolvable → document as `status: blocked`, list what information is needed, ask the user.
