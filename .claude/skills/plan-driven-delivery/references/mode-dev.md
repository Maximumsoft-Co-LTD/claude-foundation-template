# mode-dev

Loaded by `plan-driven-delivery` SKILL.md when the caller is `/dev`.

This mode is the autopilot integration layer. It connects the `/dev` pipeline stages to the plan contract so the orchestrator always has a deterministic next action rather than inferring task state from chat history or phase intuition.

---

## What this mode reads

- Current task ID and the path to its `[task-id]-requirement.md`.
- `## Execution Slices` — current status of every slice.
- Current phase result passed in by the orchestrator (requirement confirmed, slice N complete, review finding, test result, issue resolution).
- Any open `?`-flagged ambiguities from prior stages.

---

## What this mode writes

- The next-action decision: one of the seven pipeline actions listed below.
- Does NOT modify the requirement doc or slices directly — it reads and routes.

---

## Step 1 — Read the plan contract

At each `/dev` stage boundary, read `Execution Slices` fresh (do not rely on memory from the previous stage). The plan contract is the orchestrator's ground truth, not the chat transcript.

---

## Step 2 — Choose exactly one next action

Based on the current phase result and slice status, choose exactly one:

| Condition | Next action |
|---|---|
| `/requirement` just confirmed; `Execution Slices` written | → `/implement` on S1 |
| Current slice `done` with evidence; next `planned` slice exists | → `/implement` on next slice |
| All slices `done`; no open issues | → `/code-review` |
| `/code-review` returned PASS (no Critical findings) | → `/testing` |
| `/code-review` returned FAIL (Critical finding) | → `/issue` for the Critical, or `/requirement` if material drift |
| `/testing` returned PASS | → `/git-commit` |
| `/testing` returned FAIL (missing evidence) | → `/implement` for the blocking slice |
| Material drift detected at any stage | → `/requirement` (not a user question — reroute directly unless the drift itself is ambiguous) |
| Ambiguity not resolved by the plan contract | → batch into `ask-choice` (max 4 questions, most-blocking first) |

Do not choose two actions simultaneously. Do not ask the user before consulting the plan contract — if the contract has an answer, use it.

---

## Step 3 — Apply the three autopilot block reasons

Per `.claude/rules/autonomous-mode.md`, the orchestrator blocks (asks the user) only when:

1. **Ambiguity**: the plan contract does not resolve the next action AND there are two or more viable options.
2. **Destructive op**: the next action would push to `main`/`master`, force-push, drop a collection, run a prod migration, or delete a tracked file.
3. **ui-verify FAIL**: `ui-verify` returned FAIL and `/debug` did not resolve it automatically.

Material plan drift is NOT a block reason — the orchestrator reroutes to `/requirement` directly unless the drift itself is ambiguous (ambiguity block applies).

---

## Step 4 — Emit the autopilot status line

After choosing the next action, emit the status line before handing off to the next stage:

```
> plan-driven-delivery: dev — next: [action] ([reason ≤40 chars])  [✓|?|✗]
```

Examples:
```
> plan-driven-delivery: dev — next: /implement S2 (S1 done, evidence ✓)  ✓
> plan-driven-delivery: dev — next: /requirement (drift: new migration)  ✓
> plan-driven-delivery: dev — next: ask-choice (2 viable slice orders)  ?
> plan-driven-delivery: dev — next: blocked — ui-verify FAIL, /debug running  ✗
```

---

## Pipeline stage ↔ mode mapping

This table documents which `plan-driven-delivery` mode is active at each `/dev` pipeline stage, for observability:

| `/dev` stage | plan-driven-delivery mode |
|---|---|
| After `/requirement` confirmed | `mode-requirement` (produced the contract) |
| Before each `/implement` slice | `mode-implement` (picks + gates the slice) |
| After `/code-review` diff loads | `mode-code-review` (plan compliance check) |
| After `/issue` root cause known | `mode-issue` (in-plan vs /requirement) |
| Before `/testing` declares ready | `mode-testing` (AC + slice evidence gate) |
| At every stage boundary | `mode-dev` (orchestrator routing) |

---

## Drift handling for this mode

If material drift is detected at a stage boundary:
- Do NOT ask the user — reroute to `/requirement` immediately and emit:
  `> plan-driven-delivery: dev — next: /requirement (drift: [1-line reason])  ✓`
- The only exception is when the drift is itself ambiguous (e.g., two plausible ways to update the plan) — then flag `?` and batch into `ask-choice`.

---

## Output handoff

The orchestrator receives:

```
plan-driven-delivery (dev): next action = [action]
Reason: [1-line]
Block: [none | ambiguity — [question] | destructive — [op] | ui-verify FAIL]
```

In autopilot mode, this output is condensed to the single status line format above. No multi-paragraph output during pipeline execution.
