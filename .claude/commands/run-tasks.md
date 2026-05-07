# /run-tasks
Workflow position: **/new-sprint → START → /git-commit (per task)**

Arguments: `[task-id] [task-id] ...`  — e.g. `SP1-T001 SP1-T002 SP1-T003`

Two gated phases:
- **Phase 1 — Plan**: requirement (unified doc per task — includes FE + BE design + Implementation Plan, written in parallel with cross-task alignment) → consistency check → **user review gate**
- **Phase 2 — Implement**: implement → code-review → testing → retro-task (only after user approves all plans)

**Execution rules that apply to every phase:**
- Before launching each phase: call `TaskList` to confirm unblocked tasks.
- Launch sub-agents **per tier, in order** — Tier 1 all in parallel, wait for all to complete, then Tier 2, etc.
- On DONE → `TaskUpdate(phase_task, status: completed)`. On BLOCKED → mark task blocked in BACKLOG.md, skip all remaining phases for that task.
- Print a checkpoint after each phase (format shown in Step 2).

---

## Step 1 — Parse, validate, register

This step enforces `.claude/rules/parallel-work.md` — one agent owns one task end-to-end. Never split a single task across multiple agents.

1. Parse `[task-id]` list from `$ARGUMENTS`. Extract `[sprint-id]` from each.
2. Read `docs/BACKLOG.md` — collect status, `depends_on`, priority per task. Skip tasks already `done` or `in-progress` (warn).
3. Build tiers: tasks with no unmet `depends_on` = Tier 1; tasks depending on Tier 1 = Tier 2; etc.
4. Set `MAX_PARALLEL = 4`. If total tasks > 8, set `MAX_PARALLEL = 3` to avoid rate limits. Launch agents in rolling batches of MAX_PARALLEL — wait for each batch to complete before starting the next.

---

## Step 1.5 — Sprint Context Snapshot + Codebase Manifest

**Read once — inject everywhere. Never ask agents to re-read these.**

### Sprint Snapshot
Read and store as `SPRINT_SNAPSHOT`:
- `docs/sprints/[sprint-id]/[sprint-id]-overview.md`
- Relevant rows from `docs/BACKLOG.md` (filter to task IDs being run only)
- Latest file in `docs/discovery/` if it exists

If a file is missing, omit that section silently — do not fail.

### Codebase Manifest
Read and store these slices, addressable by name:
- `MANIFEST_TREE` — directory tree (2 levels) of the project source root (`src/`, `app/`, `pkg/`, etc.)
- `MANIFEST_PKG` — package/module config: `package.json`, `go.mod`, `pyproject.toml`, `Cargo.toml` (whichever exists)
- `MANIFEST_FE_TYPES` — shared types: `types.*`, `*.d.ts`, `interfaces.*` under FE source
- `MANIFEST_DB` — DB schema (`schema.*`) or latest file in `migrations/`
- `MANIFEST_TEST_CONFIG` — `jest.config.*`, `pytest.ini`, `vitest.config.*` (whichever exists)

Inject only the slices each agent needs — never the full bundle:

| Agent | Slices to inject |
|-------|------------------|
| Implementer (`fullstack`) | TREE + PKG + FE_TYPES + DB + TEST_CONFIG |
| Implementer (`fe-only`) | TREE + PKG + FE_TYPES + TEST_CONFIG (skip DB) |
| Implementer (`be-only`) | TREE + PKG + DB + TEST_CONFIG (skip FE_TYPES) |
| Implementer (`infra`) | PKG + TEST_CONFIG only |
| Spec Reviewer | PKG + TEST_CONFIG only |
| Quality Reviewer | PKG + TEST_CONFIG only |

Inject as a `--- CODEBASE MANIFEST ---` block. Agents must NOT explore the codebase independently — everything they need is pre-loaded.

### Scrum Hierarchy
Inject `SCRUM_HIERARCHY` into every agent prompt below — verbatim, as a `--- SCRUM HIERARCHY ---` block right after `--- SPRINT CONTEXT ---`. Fresh sub-agents have no memory of the template's vocabulary; without this block, "task" is ambiguous.

```
--- SCRUM HIERARCHY ---
Sprint (SP[N])               = Scrum Epic — business theme, not deployable alone
Task (SP[N]-T[NNN])          = Scrum Story — vertical slice (FE+BE+data), user-facing, deployable
Scope Overview bullet        = feature-area summary inside the story (not a story)
Implementation Plan row      = Scrum engineering task — layer-level work, NOT user-facing
Implementation Plan checkbox = Scrum Subtask — atomic 2–5 min action
You are working on a Story. Never expand scope beyond the ACs. Never treat Implementation Plan rows as stories.
---
```

### Section Extraction Rule (size guard)
Before injecting any task doc into an agent prompt:
- ≤ 6000 chars → inject full doc
- > 6000 chars → extract only the sections that agent type needs (see table)

Extract from the heading `## Section Name` to the next heading at the same level.

| Agent | Sections to extract from `[task-id]-requirement.md` |
|-------|---------------------------------------------------|
| Requirement writer | — (writes the doc from scratch) |
| Implementer | `## Acceptance Criteria` + `## Scope Overview` + `## Implementation Plan` + `# 3 · Frontend Design` (if FE) + `# 4 · Backend Design` (if BE) |
| Spec Reviewer | `## Acceptance Criteria` + `## API Contracts Consumed` + `## API Endpoints` |
| Quality Reviewer | `## Acceptance Criteria` |

**Register all phase tasks:**
```
For each [task-id]:
  p_req   = TaskCreate("[task-id] — requirement (unified)")
  p_impl  = TaskCreate("[task-id] — implement")
  p_rev   = TaskCreate("[task-id] — code-review")
  p_test  = TaskCreate("[task-id] — testing")
  p_retro = TaskCreate("[task-id] — retro-task")

  TaskUpdate(p_impl,  addBlockedBy: [p_req])
  TaskUpdate(p_rev,   addBlockedBy: [p_impl])
  TaskUpdate(p_test,  addBlockedBy: [p_rev])
  TaskUpdate(p_retro, addBlockedBy: [p_test])

For each Tier 2 [task-id] depending on Tier 1 [dep-id]:
  TaskUpdate(p_req[task-id], addBlockedBy: [p_retro[dep-id]])
```

**Print plan:**
```
Tasks: [N] | Tier 1 (parallel): T001, T002 | Tier 2: T003 (depends: T001)
Phase 1 — Plan:      requirement (unified: story + FE design + BE design + Implementation Plan) → ⏸ review gate
Phase 2 — Implement: implement → code-review → testing → retro-task
```

---

# ━━━ PHASE 1: PLAN ━━━━━━━━━━━━━━━━━━━━━━━

## Step 2 — Requirement (parallel per tier)

Launch agents in batches of MAX_PARALLEL. For each task, launch `Agent [task-id] — Requirement` (run_in_background: true):
> --- SCRUM HIERARCHY ---
> [inject SCRUM_HIERARCHY]
> ---
> --- SPRINT CONTEXT (pre-loaded — do NOT re-read these files) ---
> [inject SPRINT_SNAPSHOT]
> ---
> Read `.claude/commands/requirement.md`, follow every step for `[task-id]`.
> The command produces ONE unified doc that contains: story, ACs, FE design (if applicable), BE design (if applicable), Scope Overview, Implementation Plan with subtask checkboxes, TDD + E2E test plans.
> Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`.
> Return: DONE or BLOCKED (reason).

**Checkpoint format (print after each phase):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Phase name] — complete
  ✓ SP1-T001 — [User Story]
  ✓ SP1-T002 — [User Story]
  ✗ SP1-T003 — BLOCKED: [reason]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 2b — Cross-task alignment

Read all completed requirement docs. Write `docs/sprints/[sprint-id]/cross-task-context.md` with:
- **Shared Terminology** — agreed names for shared entities/roles
- **Shared Components / Screens** — which task owns each
- **API Contracts** — every endpoint either FE consumes or BE exposes. Which task owns each shared endpoint (method, path, request/response shape, errors).
- **Shared Data Models** — entity field names agreed across tasks
- **Auth Requirements** — which endpoints require auth and what roles
- **Scope Boundaries** — explicit lines between tasks to prevent overlap
- **Conflicts resolved** — any contradictions found and their resolution

Rules: be specific (vague notes are useless to sub-agents). If tasks are fully independent, write that and proceed. If two tasks define conflicting shapes for the same endpoint → resolve now by editing the relevant requirement doc(s). Print one alignment note per task.

---

## Step 2c — Final Cross-Plan Consistency Check

Read all completed requirement docs + `cross-task-context.md`. Check:

| Check | Pass condition |
|-------|----------------|
| **API contract match (intra-task)** | Every FE `## API Contracts Consumed` row has a matching endpoint in the same doc's `## API Endpoints` (method, path, shape) |
| **API contract match (cross-task)** | Shared endpoints across tasks are defined by exactly one owner, matched by consumers |
| **No component duplication** | Each shared component owned by exactly one task |
| **No scope overlap** | No two tasks implement the same functionality |
| **No scope gap** | Every AC in every requirement is addressed in the doc's FE or BE design and Implementation Plan |
| **Naming consistency** | Same entity uses the same name across all docs |
| **Story point depth** | Each requirement doc contains the sections required for its point level (per /requirement Step 1 table) |

Print results as `✅` (pass) or `⚠️ CONFLICT — [detail] → Resolved: [action]`. Resolve every conflict now by updating the relevant requirement docs + `cross-task-context.md`. Re-check until all ✅.

---

## ⏸ Step 3 — PLAN REVIEW GATE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 COMPLETE — Review before implementing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ SP1-T001 — [User Story] ([N]pt, [fullstack/fe-only/be-only/infra])
    docs/sprints/SP1/SP1-T001/SP1-T001-requirement.md
✓ SP1-T002 — [User Story] ([N]pt)  ...
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
>
> **FE ui-verify gate caveat:** `/retro-task` Step 1 hard-gates on `[task-id]-smoke.md` for `fullstack` / `fe-only` tasks. The Quality Reviewer agent runs `/testing` and is responsible for executing Step 6a-uiverify (`Skill("ui-verify")`) when the task touches the UI — it must produce `[task-id]-smoke.md` (the summary file) plus the `docs/sprints/[sprint-id]/[task-id]/ui-verify/` evidence directory before the retro agent fires. If the smoke file is missing when retro-task runs, the agent will return BLOCKED for that task and the user must run `/testing [task-id]` manually before re-invoking retro. (ui-verify no longer runs inside `/implement` — it lives in `/testing` only.)

## Step 4 — Subagent-driven implementation (parallel per tier)

For each task, use a **3-agent pipeline** per task:

### Agent 1: Implementer
Launch `Agent [task-id] — Implement` (run_in_background: true):
> --- SCRUM HIERARCHY ---
> [inject SCRUM_HIERARCHY]
> ---
> --- SPRINT CONTEXT ---
> [inject SPRINT_SNAPSHOT]
> ---
> --- CODEBASE MANIFEST ---
> [inject CODEBASE_MANIFEST]
> ---
> --- REQUIREMENT DOC: IMPLEMENTATION SECTIONS (apply section extraction rule) ---
> [inject from `[task-id]-requirement.md`: `## Acceptance Criteria` + `## Scope Overview` + `## Implementation Plan` + `# 3 · Frontend Design` (if Task Type includes FE) + `# 4 · Backend Design` (if Task Type includes BE)]
> ---
> --- CROSS-TASK CONTEXT ---
> [inject cross-task-context.md content]
> ---
> Read `.claude/commands/implement.md` — follow every step for `[task-id]`.
> All context is pre-loaded above — do NOT read the requirement doc again or explore codebase independently.
> Reuse shared components listed in cross-task context. No duplicate implementations.
> For any issues found → follow `/debug` process inline — Iron Law applies inside agents.
> Self-review before completing: verify all ACs above are covered.
> Return: DONE, ISSUES_FIXED (list), or BLOCKED (reason).

### Agent 2: Spec Reviewer
After implementer completes, launch `Agent [task-id] — Spec Review` (foreground — wait for result):
> --- SCRUM HIERARCHY ---
> [inject SCRUM_HIERARCHY]
> ---
> --- REQUIREMENT DOC: CONTRACT SECTIONS (apply section extraction rule) ---
> [inject from `[task-id]-requirement.md`: `## Acceptance Criteria` + `## API Contracts Consumed` (FE) + `## API Endpoints` (BE)]
> ---
> Review all git changes against the ACs and API contracts above.
> Check: every AC has working code? Contracts matched exactly? No extras, no gaps?
> Return: PASS or FAIL (list specific spec gaps).

If FAIL → send gaps back to Implementer agent to fix → re-review (foreground).

### Agent 3: Quality Reviewer
After spec review passes, launch `Agent [task-id] — Quality Review` (foreground — wait for result):
> --- SCRUM HIERARCHY ---
> [inject SCRUM_HIERARCHY]
> ---
> --- REQUIREMENT DOC: ACCEPTANCE CRITERIA ---
> [inject `## Acceptance Criteria` section from `[task-id]-requirement.md`]
> ---
> Read `.claude/commands/testing.md` — follow every step for `[task-id]`.
> Review all changes for performance, security, code quality, edge cases.
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

## Step 5 — Retro Task (parallel per tier)

For each task, launch `Agent [task-id] — Retro` (run_in_background: true):
> Read `.claude/commands/retro-task.md`, follow every step for `[task-id]`.
> Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`. Update BACKLOG.md to `done`.
> Return: DONE.

---

## Step 6 — Final summary

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
