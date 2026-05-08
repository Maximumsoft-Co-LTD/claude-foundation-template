---
description: Autopilot — single-intent autonomous workflow. Runs discovery → planning → implementation → retro with minimal user blocks.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash, Skill, Agent
---

# /dev — Autopilot

Workflow position: **single entry point — replaces typing `/discovery → /new-sprint → /requirement → /implement → /code-review → /git-commit → /retro-task → ...` one by one**

User gives one intent. `/dev` runs the entire pipeline. Blocks ONLY on the 3 official conditions per `.claude/rules/autonomous-mode.md` (ambiguity, destructive op, ui-verify fail). Phase boundaries emit a summary and continue automatically unless one of those 3 conditions applies.

After `/requirement` exists for a task, `/dev` treats `Execution Slices` maintained by `plan-driven-delivery` as the task-level source of truth. The orchestrator should not infer slice progress from chat memory when the requirement doc already contains the plan contract.

**Sequential pipeline mode (default for sequential path, N ≥ 2 tasks, no risk flags):**
After `/implement T_N` finishes, the orchestrator immediately starts `/requirement T_{N+1}` while a separate fork runs `/code-review T_N` in the background. Commits stay in dependency order — `T_{N+1}` cannot commit until `T_N`'s review passes. Net: implement and review of consecutive tasks overlap in wall-clock time without breaking commit ordering.

**Sprint budget hint (soft, never blocks):**
30-min sprint target. At each phase boundary the orchestrator emits a 1-line budget marker (`> dev: budget 18/30 min`). At 21 min (70%) and 27 min (90%) the marker carries `⚠️`. Past 30 min it just keeps reporting elapsed time — the user watches and decides whether to keep running, pause, or scope-down. **The budget never auto-pauses.** When scope feels too large for one sprint, prefer "coming soon" placeholders for non-critical pages — `solution-options` / `vertical-slice` skills surface this option explicitly when called from `/new-sprint` and `/requirement`.

## Execution model — orchestrator delegates to spawned workers

The main `/dev` session is a **lightweight orchestrator**. It does NOT run heavy stages inline. Every stage that reads many files, writes long docs, or runs tests is **spawned as a fork** (`Agent` without `subagent_type` so the worker inherits context but its tool output stays out of the main transcript).

Why: heavy work in the main session bloats context until `/dev` itself runs out of headroom. With spawning, the main session stays small — just intent, sprint state, fork summaries, and routing decisions.

What the main session does:
1. Decide which stage runs next (read state file + last fork's summary + the task's current plan contract when it exists).
2. Spawn one fork per stage with a self-contained prompt.
3. Receive the fork's structured result (status, summary ≤10 lines, artifact paths, optional `?` flags).
4. Answer the user's questions directly when it has the answer.
5. If a fork returns `?` flags or hits a block condition → batch via `ask-choice` or block per `autonomous-mode.md`.
6. Update state file. Spawn the next fork.

What the main session does NOT do:
- Read the codebase exploratively. (Forks do that.)
- Write or edit project files. (Forks do that — except `.autopilot-state.json` which is orchestrator-owned.)
- Run tests, linters, or dev servers. (Forks do that.)
- Hold raw tool output. The fork notification arrives as a single result; main session reads only that.
- Guess task-level progress from the transcript once `Execution Slices` exists. Read the requirement doc instead.

### Fork return contract

Every spawned fork ends its run with a single JSON-shaped message:

```
=== FORK RESULT ===
status: ok | blocked | ambig
summary: <≤ 10 lines, what changed, key counts, artifact paths>
artifacts: [<file paths produced or modified>]
flags: [<? items the orchestrator must batch into ask-choice>]
next_recommendation: <1 line — what stage the orchestrator should run next>
=== END ===
```

Anything verbose belongs in the audit log (handled by `audit-log.py` hook), never in the fork's return message.

### When to spawn (decision table)

| Stage / step | Spawn? | Reason |
|---|---|---|
| 1.1 prompt-understand | inline | tiny, no file I/O |
| 1.2 workspace-detect | inline | small YAML output |
| 1.3 reverse-engineer | **spawn fork** | reads dozens of files |
| 1.4 /discovery | **spawn fork** | reads codebase + writes long doc |
| 2.1 /new-sprint | **spawn fork** | writes overview + BACKLOG mutations |
| 3.0 dispatch decision | inline | reads BACKLOG only, ≤ 100 lines |
| 3.A /run-tasks (parallel) | inline call — `/run-tasks` itself spawns its own agent fleet | already delegated |
| 3.B.1 /requirement (per task) | **spawn fork** | writes the unified doc (heaviest writer); first stage that reads real source code |
| 3.B.2 local-run | inline | starts processes, no transcript noise worth keeping |
| 3.B.3 /implement (per slice) | **spawn fork per slice** | writes code, runs tests (no ui-verify, no commit inside) |
| 3.B.4 /code-review (per task) | **spawn fork** (background in pipeline mode) | reads diff + design docs, two-stage review; in pipeline mode runs concurrently with next task's /requirement+/implement |
| 3.B.5 /testing (per task) | **spawn fork** (background in pipeline mode) | full suite + AC coverage + ui-verify + may invoke /issue once; in pipeline mode runs concurrently with next task |
| 3.B.6 /retro-task | inline | short summary writer (optional in autopilot) |
| 3.B.7 /git-commit (per task) | inline | small writer, block on destructive op (push/merge); orchestrator gates commit on review + testing pass and dependency order |
| 4.1 /retro-sprint | **spawn fork** | reads all task retros + writes consolidation |
| 5.1 pr-create | inline | small, but block on destructive op |

If a stage is `inline` but its tool output exceeds ~3K tokens, upgrade it to `spawn fork` ad-hoc — context preservation always wins over the convenience of running inline.

### How the main session uses fork results

After every fork:
1. Read the `=== FORK RESULT ===` block.
2. If `status: blocked` → fork hit a destructive-op or ui-verify-fail block; surface to user per `autonomous-mode.md`.
3. If `status: ambig` → push fork's `flags` into `pending_questions`. If next stage needs an answer, batch into `ask-choice` now; else carry forward.
4. If `status: ok` → emit the phase-boundary 1-liner + the fork's summary, update state, spawn next stage.

The user can interrupt mid-pipeline; the main session is small enough to respond instantly without waiting for the in-flight fork. (If the user's question can't be answered without the fork's output, tell them the fork is still running and give status.)

Arguments:
- `[intent]` — freeform, e.g. `/dev เพิ่มระบบ login oauth google`
- `resume` — continue paused autopilot session
- `help` — print autopilot UX overview, list block conditions, list pipeline stages

---

## Setup (every run)

1. Set environment marker: `AUTOPILOT=1` (export for the session — downstream skills read this).
2. Confirm `autonomous-mode.md` and `completion-format.md` rules loaded.
3. Resolve audit destination via the `audit-log.py` hook chain (already wired via settings.json).

---

## Pipeline (the canonical sequence)

```
[start]
  │
  ├─ STAGE 1 — Inception
  │    1.1  Skill("prompt-understand")            # frame intent
  │    1.2  Skill("workspace-detect")             # green/brownfield + stack
  │    1.3  Skill("reverse-engineer")  COND        # if brownfield, no fresh RE
  │    1.4  /discovery (autopilot mode)           # produces disc-doc; may invoke ask-choice
  │           └─ may invoke: solution-options, brain-capture
  │  ════ phase boundary ════
  │
  ├─ STAGE 2 — Sprint plan
  │    2.1  /new-sprint (autopilot mode)          # tasks + BACKLOG entries
  │           └─ may invoke: vertical-slice, solution-options
  │  ════ phase boundary ════
  │
  ├─ STAGE 3 — Per-task execution
  │    3.0  Dispatch decision (parallel vs sequential)
  │           │
  │           ├─ Parallel path (≥ 2 tasks share a tier, no risk flags):
  │           │    3.A  /run-tasks [all task-ids]
  │           │           └─ tier batching, plan-review gate, 3-agent pipeline
  │           │              per task, retro-task — all delegated
  │           │
  │           └─ Sequential path (N=1, all-chained, risk-tagged, or user-paced):
  │                For each task in dep order — runs the canonical 8-command spec:
  │                  3.B.1  /requirement (autopilot)            ← reads real code
  │                           └─ scope-check, api-contract (cond), tdd-plan, nfr-plan (cond)
  │                  3.B.2  Skill("local-run")
  │                  3.B.3  /implement (autopilot)              ← write code RED→GREEN
  │                           └─ for each slice:
  │                                api-contract (cond)
  │                                tdd-plan (slice scope)
  │                                write code (RED → GREEN)
  │                                mongo-review (cond)
  │                                ════ phase boundary (slice) ════
  │                  3.B.4  /code-review (autopilot)            ← review git diff
  │                           └─ Stage 1 spec compliance → Stage 2 quality
  │                              critical findings auto-handoff to /issue
  │                  3.B.5  /testing (autopilot)                ← full suite + AC coverage + ui-verify
  │                           └─ ui-verify (FE-touching tasks)  [BLOCK on FAIL]
  │                              on bug: /issue (single round-trip) → /testing re-runs once
  │                              persistent failure → /debug, do NOT loop /issue
  │                  3.B.6  /retro-task (autopilot)             ← optional but recommended
  │                           └─ brain-capture
  │                  3.B.7  /git-commit (autopilot)             ← stage + commit + branch finish
  │                           └─ retro-task missing = warn-not-block per /git-commit Step 2
  │
  ├─ STAGE 4 — Sprint close
  │    4.1  /retro-sprint (autopilot mode)
  │           └─ release-notes, brain-capture, skill-evolution
  │  ════ phase boundary ════
  │
  └─ STAGE 5 — PR (only if intent contains "open PR" / "create pr" / "ทำ pr")
       5.1  Skill("pr-create")                    [BLOCK destructive]
[end]
```

---

## Step 1 — Dispatch on argument

| Argument | Action |
|---|---|
| `help` | Print § "Autopilot UX overview" below, exit |
| `resume` | Read `docs/sprints/[active]/.autopilot-state.json`, resume from last completed step. If state missing or > 7 days old → "no resumable session", exit |
| `[intent]` (any other text) | Treat as freeform intent, start fresh from STAGE 1 |
| (empty) | Print autopilot UX overview + ask user for intent via `ask-choice` |

---

## Step 2 — Initialize state

Create `docs/sprints/[active-or-new]/.autopilot-state.json`:

```json
{
  "intent": "[raw user intent]",
  "started_at": "[ISO]",
  "current_stage": "1",
  "current_step": "1.1",
  "completed_steps": [],
  "pending_questions": [],
  "branch": "[current branch]",
  "sprint_id": null,
  "task_id": null,
  "dispatch_mode": null,
  "pipeline_mode": false,
  "review_forks": {},
  "ready_to_commit": [],
  "task_contracts": {}
}
```

Field semantics:
- `dispatch_mode` — `"parallel"` | `"sequential"` (set after Step 5.0)
- `pipeline_mode` — true when sequential path runs implement/review overlap (set after Step 5.0 — sequential + N ≥ 2 + no risk flags)
- `review_forks` — `{ task_id: { fork_id, status: "pending"|"pass"|"fail", started_at } }`. Tracks background review forks. Cleared per task as commits land
- `ready_to_commit` — task IDs whose implement is done but commit is held pending review (in pipeline mode). Drained in dependency order
- `task_contracts` — `{ task_id: { next_slice, slices_done, slices_total, drift } }`. Lightweight summary mirrored from the task's requirement doc so `/dev` can route without rereading the entire task history

This file is updated after every step completion. Single source of truth for `resume`.

---

## Step 3 — Run STAGE 1 (Inception)

Sequence:

1. **prompt-understand** — inline. Invoke `Skill("prompt-understand")` with the intent. Capture frame. Status line emitted.

2. **workspace-detect** — inline. Invoke `Skill("workspace-detect")`. Read YAML output.
   - If `recommend_re: true` → schedule reverse-engineer next.

3. **reverse-engineer** (conditional) — **spawn fork** only if recommended above. Fork prompt: "Run `Skill('reverse-engineer')` for this brownfield project. Inherit the workspace-detect output already in context. Return the standard `=== FORK RESULT ===` block when done."

4. **/discovery** — **spawn fork**. Fork prompt: "Run `/discovery [intent]` in autopilot mode. The intent and frame are already in your context. Produce `docs/discovery/disc-NNN-[name].md`. If you flag `?` at any sub-step, do NOT continue — return early with `status: ambig` and the questions in `flags`. Otherwise return `status: ok` with artifact path."

   When fork returns: read its result. If `flags` non-empty → push to `pending_questions`.

5. **Batch ambiguity resolution**: If the pending-questions list is non-empty, invoke `Skill("ask-choice")` ONCE with up to 4 questions. Wait. Apply answers. Re-spawn the discovery fork with the answers in the prompt.

6. **Phase boundary**: Print summary template (per `autonomous-mode.md`). Do NOT wait — continue immediately unless an autopilot block condition (ambiguity / destructive op / ui-verify fail) applies.

Update state file: `current_stage = "2"`.

---

## Step 4 — Run STAGE 2 (Sprint plan)

1. **/new-sprint** — **spawn fork**. Fork prompt: "Run `/new-sprint` in autopilot mode using the Epic Breakdown from `docs/discovery/disc-NNN-[name].md` (already produced). Write the sprint overview and update `docs/BACKLOG.md`. Return `=== FORK RESULT ===` with `sprint_id` and the task list in `summary`. If you flag `?` → return early with `status: ambig`."
2. Same ambiguity-batching protocol as Step 3 — re-spawn the fork with answers if needed.
3. **Phase boundary**: print summary + continue automatically (no wait) unless an autopilot block condition applies.

Update state: `current_stage = "3"`, `sprint_id = "[SP-N]"`.

---

## Step 5 — Run STAGE 3 (Per-task execution)

Once a task has passed `/requirement`, all later task-level routing decisions should honor `plan-driven-delivery`:
- `Execution Slices` decide the next implementation unit.
- `Plan Drift Guard` decides whether a failure stays in `/issue` or re-opens `/requirement`.
- `/git-commit` is not allowed while slices remain open.

### Step 5.0 — Dispatch decision (parallel vs sequential)

Read `docs/BACKLOG.md` + sprint overview. Compute:

- `N` = number of non-done tasks in this sprint
- `MAX_TIER_WIDTH` = largest count of independent tasks at any tier (from `depends_on` graph)
- `RISK_FLAGS` = true if any non-done task is tagged auth / payment / migration / removed cron / public-API change (per `risk-register` taxonomy; check task title/tags in BACKLOG)
- `USER_HINT` = original intent contains an explicit pacing word: `ทีละ task` / `step by step` / `one by one` / `ดู phase boundary`

Choose mode (first match wins):

| Condition | Mode | Pipeline? | Why |
|---|---|---|---|
| `N == 1` | sequential | no | nothing to overlap |
| `MAX_TIER_WIDTH == 1` AND `N == 1` | sequential | no | only one task |
| `USER_HINT == true` | sequential | no | honor explicit user pacing — don't overlap |
| `RISK_FLAGS == true` | sequential | no | review + testing must be sync; per-task ui-verify (in `/testing`) + risk-register evidence are the safety net for risk-tagged work |
| sequential AND `N ≥ 2` AND no risk flags | sequential | **yes — pipeline mode** | implement T_{N+1} overlaps with review+testing T_N; commit order preserved |
| else (≥ 2 tasks share a tier, no risk flags) | **parallel** | n/a | real speedup via /run-tasks |

Set `dispatch_mode` and `pipeline_mode` in state file. Emit one status line:

```
> dev: dispatch=parallel via /run-tasks (3 tasks, 2 tiers)  ✓
> dev: dispatch=sequential+pipeline (4 tasks, no risk flags)  ✓
> dev: dispatch=sequential (auth task present, per-slice gates needed)  ✓
> dev: dispatch=sequential (1 task)  ✓
```

Then branch to 5.A or 5.B.

### Step 5.A — Parallel path (delegate to /run-tasks)

1. Invoke `/run-tasks [task-id-1] [task-id-2] ...` with every non-done task in the sprint.
2. `/run-tasks` owns: tier batching, Phase 1 plan-review gate, 3-agent pipeline per task (Implementer → Spec Reviewer → Quality Reviewer), per-task retro.
3. `/dev` keeps `AUTOPILOT=1` exported so downstream skills inside `/run-tasks` agents emit status lines per `autonomous-mode.md`.
4. **Single Stage 3 phase boundary** at end of `/run-tasks` — per-slice boundaries collapse into per-task checkpoints printed inside `/run-tasks`. Print summary + continue automatically (no wait) unless an autopilot block condition applies.

Surface the tradeoff in the boundary summary:

```
parallel mode: per-task ui-verify (in /testing) replaces per-slice manual gates;
/run-tasks adds plan-review gate (after Phase 1) + per-task checkpoints (after Phase 2 per task).
```

Update state: append completed step IDs as `/run-tasks` checkpoints arrive (parse from its output). Then proceed to Stage 4.

### Step 5.B — Sequential path (per-task for-loop)

The orchestrator stays lean by spawning a fork per heavy step. The for-loop body for each task `[task-id]` (in dependency order) follows the **canonical 8-command spec** — `/requirement → /implement → /code-review → /testing (with /issue loop) → /git-commit`. `/retro-task` is optional but recommended for brain-capture.

Two sub-modes: **plain sequential** (`pipeline_mode = false`) and **pipelined sequential** (`pipeline_mode = true`). The per-task building blocks are identical; only the ordering of `/code-review`+`/testing` (run as background forks in pipeline mode) and the next task's `/requirement` differs.

#### Per-task building blocks (used by both sub-modes)

1. **/requirement** — **spawn fork**. Fork prompt: "Run `/requirement [task-id]` in autopilot mode. Sprint context: `[sprint_id]`. Discovery doc: `docs/discovery/disc-NNN-[name].md`. If a draft requirement doc already exists from a prior partial pass, read and refine it; otherwise draft from the sprint plan. This is the first command that reads real source code. Skills under it (scope-check, api-contract, tdd-plan, nfr-plan, plan-driven-delivery) emit status lines. Produce `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` with `Execution Slices` + `Plan Drift Guard`. Return `=== FORK RESULT ===` with artifact path plus slice count / next slice. If any sub-skill flags `?` → return early with `status: ambig`."

2. **local-run** — inline. Invoke `Skill("local-run")` if stack not already up (check `/tmp/local-run-status.json`).

3. **/implement (per slice)** — **spawn one fork per slice**, not one fork for the whole task.

   For each slice in the plan contract:
   - **Spawn fork** with prompt: "Run the next slice of `/implement [task-id]` in autopilot mode. Use `plan-driven-delivery` in implement mode to select the next slice from `Execution Slices`; do not improvise your own slice boundaries. Slice scope: `[slice description from Execution Slices / Implementation Plan]`. Run api-contract (if FE+BE), tdd-plan (slice-scoped), write code RED→GREEN, mongo-review (if Mongo touched). Do NOT run ui-verify — that runs once per task during the `/testing` stage. Return `=== FORK RESULT ===` with tests RED→GREEN counts, build status, updated slice status, and any drift flag. **Do NOT commit inside this fork — the orchestrator runs `/code-review` → `/testing` → `/git-commit` after all slices complete, in dependency order per Step 5.B's commit-order rule.**"
   - When fork returns: orchestrator reads the result. On `blocked` (build failure or test that won't go GREEN) → surface to user. On `ok` → emit slice phase-boundary 1-liner and continue immediately.
   - Update state file with the slice's progress before spawning the next slice.

   **Why fork-per-slice and not fork-per-task:** a single task can have 4–8 slices, each heavy (RED tests + code + GREEN tests + build). One mega-fork would bloat its own context near task end. Per-slice forks keep each fork small enough that the slice's context is fully evicted from main session by the time it returns. ui-verify runs once per task at `/testing` time — not per slice — because partial UI from an in-progress task is rarely click-through ready, and a single browser walk after all slices land is cheaper and more accurate than N partial walks. Commit happens once per task (Step 7) after `/code-review` + `/testing` confirm the task as a whole is shippable — not per-slice.

4. **/code-review** — **spawn fork** (background in pipeline mode, foreground in plain sequential). Fork prompt: "Run `/code-review [task-id]` in autopilot mode. All slices for this task are complete and tests are GREEN per the implement forks. Run Stage 1 spec compliance against `[task-id]-requirement.md` ACs, then Stage 2 code quality on `git diff main...HEAD`. Auto-handoff Critical findings to `/issue` per the command's Step 3d. Return `=== FORK RESULT ===` with `result: APPROVED | REQUEST CHANGES`, count of Critical/Minor/Suggestion findings, and which ACs flipped to ✓ vs ✗."

   On `REQUEST CHANGES` with Critical findings → `/code-review` already triggered `/issue` for each Critical; orchestrator reads those `/issue` results from the fork's summary, treats them as part of this stage, then re-spawns `/code-review` once. Two consecutive REQUEST CHANGES → block per autopilot rule (ambiguity → escalate via `ask-choice`).

5. **/testing** — **spawn fork** (background in pipeline mode, foreground in plain sequential). Fork prompt: "Run `/testing [task-id]` in autopilot mode. Cross-check every AC against the test plan in `[task-id]-requirement.md`, run unit + integration + E2E, then invoke `Skill('ui-verify')` for any FE-touching task (mandatory — this is where ui-verify lives in the workflow), then full regression. ui-verify FAIL is a block condition — auto-trigger `/debug` inside the fork; if `/debug` resolves to GREEN, continue. On a failing test, invoke `/issue [task-id] [description]` exactly once per distinct bug — `/issue` will TDD-fix and then auto-re-run `/testing` per its Step 6. If a re-run still fails on the same symptom, escalate to `/debug` instead of looping `/issue` a second time. Return `=== FORK RESULT ===` with `production_readiness: PASS | FAIL`, AC coverage table, ui-verify verdict + evidence path, and `issue_count` (number of `/issue` round-trips this run)."

   On `FAIL` after one `/issue` cycle, OR ui-verify FAIL unresolved by `/debug` → block per autopilot rule (block condition #3).

6. **/retro-task** — inline. Short summary writer; invoke `Skill("brain-capture")` only if a lesson surfaced from any slice or issue. Optional — skip if no notable lesson and the user's intent was speed-focused.

7. **/git-commit** — inline (small writer, but block on destructive ops per autopilot rule). Orchestrator-owned: stage by explicit file list (no `git add -A`), draft commit message `[task-id] type: ...` ≤ 72 chars, commit, run finishing-branch flow. Retro-doc absence at this point only warns; does not block. The final commit SHA is the task's deliverable. **Commit ordering** is gated by Step 5.B's commit-order rule — in pipeline mode, the commit runs only when `/code-review` + `/testing` for this task have both returned PASS *and* every earlier task is already committed.

   **Why commits move out of the slice fork:** in pipeline mode, commit order depends on review + testing of the *previous* task. Letting the slice fork commit immediately would break that ordering. Commits are now collected by the orchestrator and applied via Step 7 (`/git-commit`) once both `/code-review` and `/testing` for the task return PASS.

#### Sub-mode A — Plain sequential (no pipeline)

Used when `pipeline_mode = false` (N=1, user hint, or risk-tagged). For each task in dependency order, the seven per-task steps above run strictly serially:

```
1. /requirement (fork)
2. local-run (inline)
3. /implement per slice (forks, in order)
4. /code-review (fork)         ← if REQUEST CHANGES → /issue, retry once
5. /testing (fork)             ← if FAIL → /issue once, retry; second FAIL → block
6. /retro-task (inline, optional)
7. /git-commit (inline)
8. phase boundary → next task
```

No background work.

#### Sub-mode B — Pipelined sequential (`pipeline_mode = true`)

After T_N's slices finish, the orchestrator does TWO things in the same turn:

1. **Spawn `/code-review T_N` AND `/testing T_N`** as background forks. Record `review_forks[T_N] = { fork_id, status: "pending", started_at: now }` and `testing_forks[T_N]` likewise in state. Append `T_N` to `ready_to_commit` (commit is held).
2. **Continue main flow**: `/requirement T_{N+1}` (fork) → `local-run` → `/implement T_{N+1}` per slice (forks).

Notifications for review and testing forks arrive in later turns as user-role messages. Whenever the orchestrator gets a notification, it updates the corresponding `*_forks[T_N].status` to `pass` / `fail` (`fail` = `status: blocked` from the fork) and records the result.

**Commit-order rule (the load-bearing invariant of pipeline mode):**

- `T_K` may commit only when `review_forks[T_K].status == "pass"` AND `testing_forks[T_K].status == "pass"` AND every earlier `T_J` (J < K) is already committed.
- After T_{N+1}'s slices finish, **before** spawning review/testing T_{N+1}, the orchestrator drains `ready_to_commit` greedily in dependency order:
  - For each `T_K` at the head of `ready_to_commit`:
    - If both `review` and `testing` forks for T_K are `pass` → run Step 7 (`/git-commit`) + Step 6 (`/retro-task`) for T_K, remove from `ready_to_commit`.
    - If either is `pending` → wait for the next notification turn (the orchestrator does NOT busy-loop; it returns to user with a status line and resumes when the notification lands).
    - If either is `fail` → BLOCK pipeline. Surface diagnosis. Open `/issue T_K` with the failed AC / failing test. T_{N+1} (and any later tasks that already finished implementing) stay in `ready_to_commit` until T_K is fixed and re-reviewed/re-tested pass.
- Then spawn review/testing T_{N+1} and continue with T_{N+2}'s `/requirement`.

**End-of-sprint drain:** after the last task's slices finish, the orchestrator stops starting new requirements and drains `ready_to_commit` to empty (waiting on each remaining notification, blocking on any fail).

**Pipeline status lines (additive to the standard ✓/⏳/✗/?):**

```
> dev: pipeline T002 implement done; T001 review+testing pending  ⏳
> dev: pipeline T001 review PASS testing PASS; commit + retro     ✓
> dev: pipeline T001 testing FAIL on AC3; opening /issue, T002 hold  ✗
```

**Risk handling at runtime:** if a task carrying a risk flag is encountered mid-sprint (e.g. user added one after dispatch), the orchestrator does NOT continue in pipeline mode for that task — it drains `ready_to_commit` first, runs the risk-tagged task in plain sequential, then resumes pipeline for subsequent non-risk tasks.

Update state after every transition (slice done, requirement done, review/testing notification received, commit landed): `task_id`, `completed_steps`, `review_forks`, `testing_forks`, `ready_to_commit`.

---

## Step 6 — Run STAGE 4 (Sprint close)

1. **/retro-sprint** — **spawn fork**. Fork prompt: "Run `/retro-sprint` in autopilot mode for `[sprint_id]`. Read all `[task-id]-retro.md` files for the sprint. Produce sprint-level retro doc + verify Success Metrics (Gate 3: every metric needs Actual + Source artifact + Verdict per `.claude/rules/metric-instrumentation.md`). Run `Skill('release-notes')` (CHANGELOG + README + version bump), `Skill('brain-capture')` (promote task-level captures to sprint-level), `Skill('skill-evolution')` (analyze friction). Return `=== FORK RESULT ===` with all artifact paths. If `skill-evolution` produces user-facing proposals → return as `flags` for the orchestrator to surface via `ask-choice`."
2. **Phase boundary**: print summary + continue automatically (no wait) unless an autopilot block condition applies.

---

## Step 7 — Run STAGE 5 (PR — conditional)

Trigger only if the original intent contains `open PR` / `create pr` / `ทำ pr` / `pull request`.

Otherwise skip — user can run `/dev pr` later or `Skill("pr-create")` manually.

If triggered:
- `Skill("pr-create")` — produces structured PR. Block on destructive-op confirmation before push.

---

## Block conditions (recap from autonomous-mode.md)

| Condition | Source | Resolution |
|---|---|---|
| Ambiguity (`?` flag) | any skill emits `?` | batch + `ask-choice` |
| Destructive op | hook detects (audit-log PreToolUse) OR pr-create | explicit yes/no |
| ui-verify fail | ui-verify emits `✗` | auto-`/debug`; if unresolved, BLOCK |

Phase boundaries are NOT a block condition — they emit a 1-line marker + brief summary and continue. Anything else: continue without asking.

## Sprint budget hint (soft, never blocks)

Track `elapsed = now - state.started_at`. At every phase boundary AND after every fork return, emit ONE budget line **before** the next stage's first status line:

| Elapsed | Marker format | Behavior |
|---|---|---|
| 0 – 21 min | `> dev: budget [N]/30 min` | silent fact; no decoration |
| 21 – 27 min | `> dev: budget [N]/30 min ⚠️ 70%` | reminder; nothing else changes |
| 27 – 30 min | `> dev: budget [N]/30 min ⚠️ 90%` | reminder; suggest scope-down on next /requirement |
| 30+ min | `> dev: budget [N]/30 min — over` | keeps reporting; **never auto-pauses** |

The user explicitly chose "no auto-pause" — `/dev` reports elapsed time and lets the user decide. To stop, the user types `pause` (the standard pause flow); to scope-down, the user can interrupt with a freeform message such as "ทำเฉพาะหน้า A หน้าอื่น coming soon" and the orchestrator routes through `ask-choice` to confirm the scope cut.

When budget exceeds 27 min, the orchestrator nudges scope-down at the next `/requirement` boundary by passing `--budget-pressure` to the requirement fork prompt, which signals `solution-options` / `vertical-slice` to surface "coming soon placeholder" as the recommended option for non-critical tasks.

---

## Pause / resume

The user can interrupt at any time by sending a message — `/dev` does not stop on its own. To pause cleanly, the user types `pause`:
1. At the next status emission (or block point), the orchestrator writes current step to state file.
2. Prints: `paused at [stage].[step]. type "/dev resume" to continue.`
3. Exits cleanly.

`/dev resume`:
1. Read state file.
2. Re-establish: re-read discovery doc, requirement doc, current branch, git status.
3. Continue from `current_step` + 1.

If state missing → "no resumable session, please start fresh with /dev [intent]".

---

## Status messages (the only output during execution)

Per `autonomous-mode.md`, every skill emits ONE line:
```
> [skill-name]: [≤ 60 char status]  [✓ | ⏳ | ✗ | ?]
```

`/dev` itself emits stage-boundary lines:
```
> [phase boundary] STAGE [N] — [name]
```

No multi-paragraph progress. All detail goes to `audit.md` (via hook).

---

## Autopilot UX overview (printed on `/dev help`)

```
/dev — autonomous workflow command

Usage:
  /dev [intent]      Run full pipeline from intent to retro
  /dev resume        Continue a paused session
  /dev help          This message

Pipeline (5 stages):
  1. Inception      workspace-detect → reverse-engineer (if brownfield)
                    → /discovery
  2. Sprint plan    /new-sprint  (planning only — no code reading, no task docs yet)
  3. Per-task work  Dispatch decision → one of:
                    • parallel: /run-tasks [all task-ids]
                    • sequential+pipeline (8-command spec, per task):
                        /requirement → /implement → spawn /code-review +
                        /testing forks (background) → start next task's
                        /requirement + /implement while they run → drain
                        commits in dep order once review+testing PASS
                    • plain sequential (8-command spec, strictly serial):
                        /requirement → /implement → /code-review →
                        /testing (with /issue loop) → /retro-task → /git-commit
                    Picks parallel when ≥ 2 tasks share a tier and no
                    risk flags (auth/payment/migration).
                    Picks pipeline when sequential, N ≥ 2, no risk flags.
                    Picks plain sequential when N=1, user-paced, or
                    risk-tagged.
  4. Sprint close   /retro-sprint
  5. PR (if requested in intent)

Blocks ONLY on 3 conditions:
  • Ambiguity        — confidence < 90% on a path with > 1 viable option
  • Destructive op   — push to main, drop collection, force-push, rm -rf
  • UI verify fail   — auto-/debug first, block only if unresolved

Pipeline mode adds one effective block: a code-review or testing FAIL on
T_N holds T_{N+1}'s commit (and any later finished task) until /issue
closes T_N. Implement of later tasks keeps going; only commits are gated.

Phase boundaries emit a brief summary and continue automatically. The
pipeline does not pause for "looks good?" prompts — if there is nothing
to decide and the work is correct, /dev moves on.

Sprint budget hint (soft, never blocks):
  The orchestrator targets 30 min per sprint and reports elapsed time
  at every phase boundary (`> dev: budget 18/30 min`). At 21 / 27 min
  the marker carries ⚠️ as a reminder. Past 30 it just keeps reporting
  — you watch and decide. To scope down mid-run, send a freeform
  message like "หน้า A ทำเต็ม, หน้าอื่น coming soon" — the orchestrator
  routes it through ask-choice and replans accordingly. To stop, type
  "pause".

Pause anytime by typing "pause" — the orchestrator stops at the next
safe checkpoint and writes resume state.
Resume with: /dev resume

Manual commands (/discovery, /requirement, /implement, /code-review,
/git-commit, ...) remain unchanged for manual control. /dev does NOT
replace them.
```

---

## Anti-patterns (orchestrator level)

- ❌ **Running heavy stages inline in the orchestrator** — `/discovery`, `/requirement`, `/implement` (per slice), `/retro-sprint`, `reverse-engineer` MUST spawn forks. Inline execution is the #1 cause of `/dev` running out of context mid-pipeline.
- ❌ **Reading the fork's transcript file mid-flight** — `Agent` returns one notification with the result. Don't tail the output_file; trust the notification.
- ❌ **Predicting fork results before they arrive** — never write summary, status, or "Fork found X" before the notification. If user asks while fork is running, give status, not a guess.
- ❌ Skipping `workspace-detect` to "save time" — every other step depends on its output
- ❌ Auto-merging `ask-choice` answers without waiting — the whole point is user input
- ❌ Auto-pushing to `main` because intent says "ship it" — destructive op block stands
- ❌ Continuing past a `?` flag silently — orchestrator must batch + ask
- ❌ Multiple `ask-choice` invocations in a row — batch into one (max 4 questions per AskUserQuestion)
- ❌ Adding an A/B prompt at every phase boundary "to be safe" — autopilot phase boundaries continue automatically when none of the 3 block conditions apply (the A/B prompt only appears at the final end-of-`/dev` summary)
- ❌ Re-announcing the pause option at phase boundaries — strings like `Press enter to continue, or type pause to stop`, `type pause if you want to stop`, or any other "you can pause / interrupt / continue" reminder turn the soft boundary into a hard block. The pause mechanism is documented once in `/dev help`; the user already knows. See `autonomous-mode.md` § Forbidden phase-boundary outputs.
- ❌ Forcing parallel mode when a task is risk-tagged (auth/payment/migration) — per-task ui-verify (in /testing) + risk-register evidence are the safety net; parallel collapses the per-task checkpoints
- ❌ Forcing sequential mode "to be safe" when 4 independent CRUD tasks share a tier — wastes the speedup that parallel was designed for
- ❌ **Pipeline mode: committing T_{N+1} before T_N's review passes** — breaks commit ordering and lets a broken T_N ship inside T_{N+1}'s commit history. Always drain `ready_to_commit` in dependency order
- ❌ **Pipeline mode: spawning a review fork for a risk-tagged task** — risk tasks (auth/payment/migration/public-API) must be reviewed synchronously; pipeline must drain to empty and switch to plain sequential before that task starts
- ❌ **Pipeline mode: busy-looping on review fork notification** — the orchestrator does not poll. It returns to the user with a status line, and resumes when the notification arrives in a later turn
- ❌ **Pipeline mode: predicting a fork's review outcome** before its notification — never write "review will pass" or pre-fill commit text. Status only
- ❌ **Auto-pausing at the 30-min budget** — the user explicitly chose soft hint. Past 30 min, keep reporting elapsed time; do not pause unless the user types `pause`
- ❌ **Hiding the budget marker after 30 min "to avoid noise"** — the marker is the one signal the user opted into. Keep emitting at every phase boundary
- ❌ **Letting the slice fork run `/git-commit`** — in pipeline mode, commits move to the orchestrator (Step 7 `/git-commit`) so commit order can match review + testing order. The slice fork only writes code + runs tests (ui-verify is per-task in `/testing`, not per-slice)

---

## Output (final, end of run)

Standardized 2-option per `completion-format.md`:

```
/dev complete: [intent]

Sprint: [SP-N]   Tasks: [N done]   Slices: [N done]
Tests: [N RED → N GREEN]   ui-verify: PASS [N]   Commits: [N]
PR: [URL or "skipped"]

Next: choose one
A) Request changes — describe what to revise
B) Continue to /next-task or close session
```

---

## Why this command exists

User asked for autonomous workflow UX: "ไม่อยากให้มาคอยสั่ง command ทีละ step ux ไม่ดี"

Manual slash commands stay for users who want fine-grained control. `/dev` is the answer for users who want to give one intent and watch the agent execute end-to-end, blocking only when human judgment is genuinely required.
