# /execute-plan
Workflow position: **after /write-plan → START → /code-review**

Execute a task plan using subagent-driven development (superpowers:subagent-driven-development). Each plan step is dispatched to a fresh subagent, followed by two-stage review (spec compliance → code quality).

Use this as a more structured alternative to `/implement` when a `/write-plan` plan file exists for the task.

Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 0 — Validate plan exists

Parse `[task-id]`, extract `[sprint-id]`.

Check `docs/sprints/[sprint-id]/[task-id]/[task-id]-plan.md` exists.
- Missing → stop: "No plan found. Run `/write-plan [task-id]` first."

Read the plan file. Confirm it has at least one task step and no `TBD` sections.

---

## Step 1 — Load context

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — single unified doc (ACs + FE/BE design + Implementation Plan)

---

## Step 1b — Confidence Gate

Assess confidence that you can execute this plan successfully based on all context loaded so far.

Key dimensions:
- Plan file valid — all steps concrete, no TBD sections?
- Requirement and design docs loaded — ACs clear?
- Codebase understood — plan file paths reference real files?
- Dependencies between plan steps understood?
- Test strategy clear — you know how to verify each step?

**>= 90%** → proceed to Step 2.
**< 90%** → **STOP.** State what you know, what you don't, and what you need. Do NOT start execution until confidence reaches 90%. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

---

## Step 2 — Set up isolated worktree

If the superpowers plugin is available, invoke:
```
Skill("superpowers:using-git-worktrees")
```
This sets up an isolated workspace with smart directory selection and safety verification.

Otherwise, follow the inline worktree steps from `/implement` Step 0b:
1. Verify `.worktrees` is gitignored
2. `git worktree add .worktrees/[task-id] -b [sprint-id]/[task-id]-[short-desc]`
3. Install deps + run baseline tests (must be GREEN before any new code)

Print: `Worktree ready: .worktrees/[task-id] on branch [branch-name]`

---

## Step 3 — Execute plan via subagent-driven development

Update BACKLOG.md status to `in-progress`.

Invoke:
```
Skill("superpowers:subagent-driven-development")
```

Pass as context:
- The plan file path: `docs/sprints/[sprint-id]/[task-id]/[task-id]-plan.md`
- The worktree absolute path (all subagents must work inside this worktree)
- The unified requirement doc `[task-id]-requirement.md` — contains ACs (spec compliance), FE + BE design sections, Implementation Plan

**Template overrides during execution:**
- After each task step completes, the spec reviewer must cross-check against `[task-id]-requirement.md` ACs — not a generic spec review.
- If any critical issue is found → run `/issue [task-id] [description]` (not the superpowers escalation pattern).
- Update BACKLOG.md on completion — do not leave status as `in-progress`.

If the superpowers plugin is NOT available, fall back to `/implement [task-id]`.

---

## Step 4 — Verification before completion

**No completion claims without fresh verification evidence.**

Run full test suite + build in the worktree:
- All tests green: exit 0
- For each AC in requirement: trace to specific passing test name

If any test fails → run `/issue [task-id] [description]` per failing test.

---

## Output

```
✓ Execution complete: [task-id]
  Tests: [N] passing, 0 failing
  Build: exit 0
  Verified: [timestamp of fresh test run]

ACs covered:
  ✓ AC-1 → [test name]
  ✓ AC-2 → [test name]

Next: /code-review [task-id]
```
