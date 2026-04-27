# /write-plan
Workflow position: **after /requirement → START → /execute-plan or /implement**

Produce a detailed bite-sized implementation plan for a task using the superpowers:writing-plans skill. Use this when you want a standalone plan file that an agent can execute step-by-step, in addition to or instead of the Implementation Plan already embedded in the unified requirement doc.

Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load task context

Parse `[task-id]`, extract `[sprint-id]`.

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — single unified doc with ACs, FE/BE design, Implementation Plan

Validate: missing requirement or empty ACs → stop: "Run `/requirement [task-id]` first."

---

## Step 1b — Confidence Gate

Assess confidence that you can produce a complete, correct implementation plan based on all context loaded so far.

Key dimensions:
- Requirement doc complete — ACs specific and testable?
- Design docs available — architecture, components, API contracts clear?
- Codebase structure understood — file paths for plan steps identifiable?
- TDD approach clear — you know test-first ordering for every step?
- Task scope sized correctly — no 13pt task that should be split?

**>= 90%** → proceed to Step 2.
**< 90%** → **STOP.** State what you know, what you don't, and what you need. Do NOT start planning until confidence reaches 90%. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

---

## Step 2 — Invoke superpowers:writing-plans

Invoke the writing-plans skill with the loaded task context:
```
Skill("superpowers:writing-plans")
```

Pass as context:
- The full unified requirement doc (ACs, problem statement, constraints, FE design sections, BE design sections, architecture, components, API contracts, Implementation Plan)
- The sprint ID and task ID for file naming

**Template overrides to apply during the skill:**
- **Save path** — when the skill says "save to `docs/superpowers/plans/...`", save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-plan.md` instead.
- **TDD** — every implementation step in the plan must follow the testing rules from `.claude/rules/testing.md`: test first, verify RED, real deps at integration layer.
- **Worktree** — plan steps should assume an isolated worktree at `.worktrees/[task-id]` (created by `/implement` Step 0b).

---

## Step 3 — Self-check

Re-read `docs/sprints/[sprint-id]/[task-id]/[task-id]-plan.md` and verify:
- [ ] Every AC from the requirement doc maps to at least one plan step.
- [ ] Every plan step is a single action completable in 2–5 minutes.
- [ ] No plan step writes implementation code before its test.
- [ ] No `TBD`, `TODO`, or empty sections.

Fix any issue before reporting output.

---

## Output

```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-plan.md
  Steps: [N]  |  ACs covered: [N]/[N]

Next:
  Execute with subagents → /execute-plan [task-id]
  Execute manually       → /implement [task-id]
```
