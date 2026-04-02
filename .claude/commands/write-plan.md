# /write-plan
Workflow position: **after /design be → START → /execute-plan or /implement**

Produce a detailed bite-sized implementation plan for a task using the superpowers:writing-plans skill. Use this when you want a standalone plan file that an agent can execute step-by-step, in addition to or instead of the implementation plan embedded in the design docs.

Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load task context

Parse `[task-id]`, extract `[sprint-id]`.

Read **in parallel**:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs and problem statement
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — FE design and implementation plan (if exists)
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — BE design and implementation plan (if exists)

Validate: missing requirement or empty ACs → stop: "Run `/requirement [task-id]` first."

---

## Step 2 — Invoke superpowers:writing-plans

Invoke the writing-plans skill with the loaded task context:
```
Skill("superpowers:writing-plans")
```

Pass as context:
- The full requirement doc (ACs, problem statement, constraints)
- The FE and BE design docs (architecture, components, API contracts, implementation plan sections)
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
