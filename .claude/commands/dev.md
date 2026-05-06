---
description: Autopilot — single-intent autonomous workflow. Runs discovery → planning → implementation → retro with minimal user blocks.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash, Skill, Agent
---

# /dev — Autopilot

Workflow position: **single entry point — replaces typing `/discovery → /new-sprint → /requirement → /implement → ...` one by one**

User gives one intent. `/dev` runs the entire pipeline. Blocks ONLY on the 4 official conditions per `.claude/rules/autonomous-mode.md`.

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
  ├─ STAGE 3 — Per-task loop
  │    For each task in sprint:
  │      3.1  /requirement (autopilot mode)
  │             └─ scope-check, api-contract (cond), tdd-plan, nfr-plan (cond)
  │      3.2  Skill("local-run")                  # ensure stack up
  │      3.3  /implement (autopilot mode)
  │             └─ for each slice:
  │                  api-contract (cond)
  │                  tdd-plan (slice scope)
  │                  write code (RED → GREEN)
  │                  mongo-review (cond)
  │                  ui-verify        [BLOCK on FAIL]
  │                  /git-commit
  │                  ════ phase boundary (slice) ════
  │      3.4  /retro-task (autopilot mode)
  │             └─ brain-capture
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
  "task_id": null
}
```

This file is updated after every step completion. Single source of truth for `resume`.

---

## Step 3 — Run STAGE 1 (Inception)

Sequence:

1. **prompt-understand** — invoke `Skill("prompt-understand")` with the intent. Capture frame. Status line emitted.

2. **workspace-detect** — invoke `Skill("workspace-detect")`. Read YAML output.
   - If `recommend_re: true` → schedule reverse-engineer next.

3. **reverse-engineer** (conditional) — invoke `Skill("reverse-engineer")` only if recommended above.

4. **/discovery (autopilot)** — invoke as if user typed `/discovery [intent]`. The command itself reads the intent + frame + workspace/RE output and produces `docs/discovery/disc-NNN-[name].md`.

   If `/discovery` flags `?` (ambiguity) at any sub-step → DO NOT continue; collect into the pending-questions list.

5. **Batch ambiguity resolution**: If the pending-questions list is non-empty, invoke `Skill("ask-choice")` ONCE with up to 4 questions. Wait. Apply answers. Re-run any step that needed the answer.

6. **Phase boundary**: Print summary template (per `autonomous-mode.md`). Wait for user `enter` / `pause`.

Update state file: `current_stage = "2"`.

---

## Step 4 — Run STAGE 2 (Sprint plan)

1. **/new-sprint (autopilot)** — auto-invoke. Use the Epic Breakdown from the discovery doc.
2. Same ambiguity-batching protocol as Step 3.
3. **Phase boundary**: print summary + wait.

Update state: `current_stage = "3"`, `sprint_id = "[SP-N]"`.

---

## Step 5 — Run STAGE 3 (Per-task loop)

For each task in the sprint's BACKLOG (in dependency order):

1. **/requirement (autopilot)** — auto-invoke for `[task-id]`. Skills under it (scope-check, api-contract, tdd-plan, nfr-plan) emit status lines.
2. **local-run** — invoke `Skill("local-run")` if stack not already up (check `/tmp/local-run-status.json`).
3. **/implement (autopilot)** — for each slice:
   - api-contract (if FE+BE)
   - tdd-plan (slice-scoped)
   - write code, RED → GREEN
   - mongo-review (if Mongo touched)
   - ui-verify  ← **BLOCK on FAIL**:
     - On FAIL: auto-trigger `/debug` for the failing AC. If `/debug` resolves (test was RED, now GREEN) → continue. Else → BLOCK with the diagnosis.
   - /git-commit (autopilot)
   - **Phase boundary (slice end)**: 5-line summary + wait `enter` / `pause`.
4. **/retro-task (autopilot)** — invoke `Skill("brain-capture")` if a lesson surfaced.

Update state after each task: `task_id`, append completed step ID.

---

## Step 6 — Run STAGE 4 (Sprint close)

1. **/retro-sprint (autopilot)** — runs:
   - `Skill("release-notes")` — CHANGELOG + README + version bump
   - `Skill("brain-capture")` — promote task-level captures to sprint-level
   - `Skill("skill-evolution")` — analyze friction, propose skill changes (asks user via ask-choice)
2. **Phase boundary**: print summary + wait.

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
| Phase boundary | end of stage in this command | 5-line summary + enter/pause |
| ui-verify fail | ui-verify emits `✗` | auto-`/debug`; if unresolved, BLOCK |

Anything else: continue without asking.

---

## Pause / resume

User types `pause` at any phase boundary:
1. Write current step to state file.
2. Print: `paused at [stage].[step]. type "/dev resume" to continue.`
3. Exit cleanly.

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
  2. Sprint plan    /new-sprint
  3. Per-task loop  /requirement → /implement (per slice) → /retro-task
  4. Sprint close   /retro-sprint
  5. PR (if requested in intent)

Blocks ONLY on 4 conditions:
  • Ambiguity        — confidence < 90% on a path with > 1 viable option
  • Destructive op   — push to main, drop collection, force-push, rm -rf
  • Phase boundary   — end of every stage (5-line summary + enter/pause)
  • UI verify fail   — auto-/debug first, block only if unresolved

Pause anytime at a phase boundary by typing: pause
Resume with: /dev resume

Manual commands (/discovery, /requirement, /implement, ...) remain
unchanged for manual control. /dev does NOT replace them.
```

---

## Anti-patterns (orchestrator level)

- ❌ Skipping `workspace-detect` to "save time" — every other step depends on its output
- ❌ Auto-merging `ask-choice` answers without waiting — the whole point is user input
- ❌ Auto-pushing to `main` because intent says "ship it" — destructive op block stands
- ❌ Continuing past a `?` flag silently — orchestrator must batch + ask
- ❌ Multiple `ask-choice` invocations in a row — batch into one (max 4 questions per AskUserQuestion)
- ❌ Skipping phase boundary "to save time" — phase boundaries are the user's checkpoint UX

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
