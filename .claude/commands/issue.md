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
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — unified doc: which AC does this violate? Expected behavior from the relevant FE / BE Design section?


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

**Impact assessment** — once the root cause is located (what file/function/contract), invoke the `impact-map` skill scoped to that surface. The Tier-1/Tier-2/Tier-3 table tells you what else the fix might break. Skip only for purely local bugs (single function, no callers outside its own file/test).

If stuck after 3 hypotheses → document the blocker and ask the user.

---

## Step 3 — Fix using TDD

Follow `rules/testing.md` — Verify RED is mandatory before implementing.

**Use the `bug-repro` skill** to produce the failing test artifact (steps 1–2 below) — it captures Trigger / Observed / Expected / Contract, finds the minimal repro, picks the right layer, verifies RED with the exact bug signature, and appends a regression row to the requirement doc. Do NOT improvise the test inline when the skill exists for this purpose.

1. Run `bug-repro` → emits a **failing test** that reproduces the bug at the lowest viable layer.
2. **RED verified** by the skill (test fails with the bug's exact signature, not a setup error).
3. Implement the minimal fix — ONE change, address root cause only.
4. Run the full test suite — confirm all pass, 0 regressions.
5. Keep the fix minimal. No "while I'm here" improvements.

If the impact-map from Step 2 had any 🔴 row → before merging the fix, also run `risk-register` to plan mitigation/rollback for the affected surfaces.


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
