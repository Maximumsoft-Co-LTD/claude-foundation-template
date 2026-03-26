# /run-tasks
Workflow position: **/new-sprint → START → /git-commit (per task)**

Arguments: `[task-id] [task-id] ...`  — e.g. `SP1-T001 SP1-T002 SP1-T003`

Two gated phases:
- **Phase 1 — Plan**: requirement → fe-design → be-design (all tasks in parallel, with cross-task alignment between steps) → consistency check → **user review gate**
- **Phase 2 — Implement**: implement → code-review → testing → retro-task (only after user approves all plans)

**Execution rules that apply to every phase:**
- Before launching each phase: call `TaskList` to confirm unblocked tasks.
- Launch sub-agents **per tier, in order** — Tier 1 all in parallel, wait for all to complete, then Tier 2, etc.
- On DONE → `TaskUpdate(phase_task, status: completed)`. On BLOCKED → mark task blocked in BACKLOG.md, skip all remaining phases for that task.
- Print a checkpoint after each phase (format shown in Step 2).

---

## Step 1 — Parse, validate, register

1. Parse `[task-id]` list from `$ARGUMENTS`. Extract `[sprint-id]` from each.
2. Read `docs/BACKLOG.md` — collect status, `depends_on`, priority per task. Skip tasks already `done` or `in-progress` (warn).
3. Build tiers: tasks with no unmet `depends_on` = Tier 1; tasks depending on Tier 1 = Tier 2; etc.

**Register all phase tasks:**
```
For each [task-id]:
  p_req   = TaskCreate("[task-id] — requirement")
  p_fe    = TaskCreate("[task-id] — fe-design")
  p_be    = TaskCreate("[task-id] — be-design")
  p_impl  = TaskCreate("[task-id] — implement")
  p_rev   = TaskCreate("[task-id] — code-review")
  p_test  = TaskCreate("[task-id] — testing")
  p_retro = TaskCreate("[task-id] — retro-task")

  TaskUpdate(p_fe,    addBlockedBy: [p_req])
  TaskUpdate(p_be,    addBlockedBy: [p_fe])
  TaskUpdate(p_impl,  addBlockedBy: [p_be])
  TaskUpdate(p_rev,   addBlockedBy: [p_impl])
  TaskUpdate(p_test,  addBlockedBy: [p_rev])
  TaskUpdate(p_retro, addBlockedBy: [p_test])

For each Tier 2 [task-id] depending on Tier 1 [dep-id]:
  TaskUpdate(p_req[task-id], addBlockedBy: [p_retro[dep-id]])
```

**Print plan:**
```
Tasks: [N] | Tier 1 (parallel): T001, T002 | Tier 2: T003 (depends: T001)
Phase 1 — Plan:      requirement → fe-design → be-design → ⏸ review gate
Phase 2 — Implement: implement → code-review → testing → retro-task
```

---

# ━━━ PHASE 1: PLAN ━━━━━━━━━━━━━━━━━━━━━━━

## Step 2 — Requirement (parallel per tier)

For each task, launch `Agent [task-id] — Requirement` (run_in_background: true):
> Read `.claude/commands/requirement.md`, follow every step for `[task-id]`.
> Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`.
> Return: DONE or BLOCKED (reason).

**Checkpoint format (print after each phase):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Phase name] — complete
  ✓ SP1-T001 — [Title]
  ✓ SP1-T002 — [Title]
  ✗ SP1-T003 — BLOCKED: [reason]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 2b — Alignment: After Requirement

Read all completed requirement docs. Write `docs/sprints/[sprint-id]/cross-task-context.md` with:
- **Shared Terminology** — agreed names for shared entities/roles
- **Shared Components / Screens** — which task owns each
- **Scope Boundaries** — explicit lines between tasks to prevent overlap
- **Conflicts resolved** — any contradictions found and their resolution

Rules: be specific (vague notes are useless to sub-agents). If tasks are fully independent, write that and proceed. Print one alignment note per task.

---

## Step 3 — FE Design (parallel per tier)

For each task, launch `Agent [task-id] — FE Design` (run_in_background: true):
> Read `.claude/commands/fe-design.md`, follow every step for `[task-id]`.
> **Read `docs/sprints/[sprint-id]/cross-task-context.md` first** — use exact names/structure for any shared component listed there.
> Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`.
> Return: DONE or BLOCKED (reason).

Print checkpoint.

---

## Step 3b — Alignment: After FE Design

Read all completed FE design docs. Update `cross-task-context.md` with:
- **API Contracts** — every endpoint the FE expects (method, path, request/response shape, errors). If two tasks call the same endpoint, one task owns it — note which.
- **Shared Data Models** — entity field names as FE defined (BE must match exactly)
- **Auth Requirements** — which endpoints require auth and what roles

If two tasks define conflicting shapes for the same endpoint → resolve now. Print one-line summary per task (e.g. "T001 — 3 endpoints, 1 shared with T002: GET /users").

---

## Step 4 — BE Design (parallel per tier)

For each task, launch `Agent [task-id] — BE Design` (run_in_background: true):
> Read `.claude/commands/be-design.md`, follow every step for `[task-id]`.
> **Read `docs/sprints/[sprint-id]/cross-task-context.md` first** — implement API contracts exactly as FE expects. If an endpoint is owned by another task, reference it instead of re-implementing.
> Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`.
> Return: DONE or BLOCKED (reason).

Print checkpoint.

---

## Step 4b — Final Cross-Plan Consistency Check

Read all completed docs for all tasks + `cross-task-context.md`. Check:

| Check | Pass condition |
|-------|---------------|
| **API contract match** | Every FE-called endpoint exists in BE with matching method, path, shape |
| **No component duplication** | Each shared component owned by exactly one task |
| **No scope overlap** | No two tasks implement the same functionality |
| **No scope gap** | Every AC in every requirement is addressed by FE or BE design |
| **Naming consistency** | Same entity uses the same name across all docs |
| **Story point depth** | Each design doc contains the sections required for its point level |

Print results as `✅` (pass) or `⚠️ CONFLICT — [detail] → Resolved: [action]`. Resolve every conflict now by updating the relevant docs + `cross-task-context.md`. Re-check until all ✅.

---

## ⏸ Step 5 — PLAN REVIEW GATE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 COMPLETE — Review before implementing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ SP1-T001 — [Title] ([N]pt)
    docs/sprints/SP1/SP1-T001/{requirement,frontend,backend}.md
✓ SP1-T002 — [Title] ([N]pt)  ...
✗ SP1-T003 — BLOCKED at [phase]: [reason]

Cross-task alignment : docs/sprints/SP1/cross-task-context.md
Consistency check    : all clear / [N] conflicts resolved

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply:
  "go"                          → implement all tasks
  "edit [task-id] [instruction]" → revise a plan, then re-show gate
  "skip [task-id]"              → drop from Phase 2, mark blocked
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Do not start Phase 2 until user says "go".** Combinations are valid (e.g. "skip T003, edit T001 — change button label to Save").

---

# ━━━ PHASE 2: IMPLEMENT ━━━━━━━━━━━━━━━━━━

> **Note:** Phase 2 uses a 3-agent pipeline that replaces the standalone commands:
> - Spec Reviewer ≈ `/code-review` Stage 1 (spec compliance)
> - Quality Reviewer ≈ `/code-review` Stage 2 + `/testing`
>
> Do NOT also run `/code-review` or `/testing` manually for tasks processed by `/run-tasks`.

## Step 6 — Subagent-driven implementation (parallel per tier)

For each task, use a **3-agent pipeline** per task:

### Agent 1: Implementer
Launch `Agent [task-id] — Implement` (run_in_background: true):
> Read `.claude/commands/implement.md` — follow every step for `[task-id]`.
> **Read `cross-task-context.md`** — reuse shared components. No duplicate implementations.
> For any issues found → follow `/debug` process inline — this includes writing a failing test BEFORE implementing the fix. The Iron Law applies inside agents.
> Self-review before completing: re-read requirements, verify all ACs covered.
> Return: DONE, ISSUES_FIXED (list), or BLOCKED (reason).

### Agent 2: Spec Reviewer
After implementer completes, launch `Agent [task-id] — Spec Review` (foreground — wait for result):
> Review all changes against `[task-id]-requirement.md` and design docs.
> Check: every AC has working code? Design contracts matched exactly? No extras, no gaps?
> Return: PASS or FAIL (list specific spec gaps).

If FAIL → send gaps back to Implementer agent to fix → re-review (foreground).

### Agent 3: Quality Reviewer
After spec review passes, launch `Agent [task-id] — Quality Review` (foreground — wait for result):
> Review all changes for performance, security, code quality, edge cases.
> Run `.claude/commands/testing.md` — follow every step for `[task-id]`.
> Return: APPROVED or REQUEST_CHANGES (list issues by severity).

If REQUEST_CHANGES with Critical issues → send back to Implementer → re-review (foreground).

**Print checkpoint after all 3 agents complete per task.**

---

### Dispatching rules (from Superpowers)
- Each agent gets **isolated context** — construct exactly what they need, never inherit session history.
- Agent prompt must include: specific scope, clear goal, constraints, expected output format.
- After all agents return: verify fixes don't conflict across tasks, run full test suite.
- If agents edited same files → resolve conflicts before proceeding.
- **Parallel worktrees:** when Tier 1 has multiple tasks, each Implementer agent creates its own worktree via `/implement` Step 0b. Worktree paths: `.worktrees/[task-id]`. Agents work in separate branches — no conflicts unless they edit shared files outside their worktree.

---

## Step 7 — Retro Task (parallel per tier)

For each task, launch `Agent [task-id] — Retro` (run_in_background: true):
> Read `.claude/commands/retro-task.md`, follow every step for `[task-id]`.
> Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`. Update BACKLOG.md to `done`.
> Return: DONE.

---

## Step 8 — Final summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/run-tasks complete
  ✓ SP1-T001 — done
  ✓ SP1-T002 — done
  ~ SP1-T003 — done (1 issue filed)
  ✗ SP1-T004 — blocked at [phase]: [reason]

Issues filed: [N] | Next: /git-commit per task → /retro-sprint [sprint-id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
