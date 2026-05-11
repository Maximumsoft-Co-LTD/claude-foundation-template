---
name: plan-driven-delivery
description: Keep task execution aligned to the requirement doc's plan contract. Detects scope drift and routes each phase (/requirement, /implement, /code-review, /issue, /testing, /dev) from the same four control surfaces. Trigger whenever a task has a confirmed [task-id]-requirement.md and a downstream phase is about to act on it.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(ls:*)
---

# plan-driven-delivery

Workflow position: **any command that operates on a task with a `[task-id]-requirement.md` — invoked AFTER `/requirement` is confirmed; before any downstream phase improvises new work.**

Stack-aware: Go / Vue / Nuxt / Next / MongoDB / Socket.io / Python — but the plan-contract rules are stack-agnostic.

---

## When to invoke

Trigger when:
- `/requirement` has drafted ACs, Implementation Plan, and tests and now needs a compact execution contract.
- `/implement` needs the next planned slice instead of guessing from the whole doc.
- `/code-review` must check whether the diff matches the agreed plan.
- `/issue` must decide whether a fix stays inside the current plan or re-opens `/requirement`.
- `/testing` must verify AC coverage AND that every planned slice has evidence.
- `/dev` needs a deterministic next-action from the plan contract.

Skip when:
- The workflow is still in `/discovery` or `/new-sprint` — no task-level requirement doc exists yet.
- The task is doc-only or trivial enough that no implementation plan exists.
- The user explicitly wants freeform brainstorming instead of plan-following execution.
- **Skip if the requirement doc does not yet exist — caller should run `/requirement` first.**

---

## The plan contract

After `/requirement` is confirmed, the requirement doc is the single source of truth. Every downstream phase reads from or writes to these four control surfaces:

**Implementation Plan** — rows of engineering work, each mapped to a file path and AC. No file may be changed in implementation that does not appear here. Missing rows are plan drift, not progress.

**Execution Slices** — 1–7 ordered checkpoints that collapse the Implementation Plan into meaningful units. Each slice names its AC coverage, planned files, required tests (test-first), and exit evidence. A slice is `done` only when its promised proof exists — not when its code compiles.

**Plan Drift Guard** — explicit rules for this task that decide: in-plan fix (stay in `/issue` or current slice) vs material drift (return to `/requirement`). Every task's drift guard is different; generic "if ACs change, go back" is not enough.

**TDD Test Plan** — one row per AC / boundary case / integration surface, stating the test name, level (unit/integration/e2e), and which slice it belongs to. Instructs `/implement` on which tests must be RED before any production code.

---

## Mode router

| Caller | Read |
|---|---|
| `/requirement` | `references/mode-requirement.md` |
| `/implement` | `references/mode-implement.md` |
| `/code-review` | `references/mode-code-review.md` |
| `/issue` | `references/mode-issue.md` |
| `/testing` | `references/mode-testing.md` |
| `/dev` | `references/mode-dev.md` |

Read the relevant reference BEFORE acting; the router itself only defines the contract.

---

## Common drift signals

These apply across all modes. If any of the following become true, treat it as material drift and route through the Plan Drift Guard before continuing:

- AC count in the diff or discussion diverges from the ACs listed in the requirement doc.
- A slice is marked `done` but its promised exit evidence does not exist.
- New files appear in a PR diff that are not listed in any Implementation Plan row.
- A fix in `/issue` would change user-visible workflow, API shape, or rollout plan.
- A new migration, permission change, payment rule, or external dependency appears mid-slice.
- The task estimate or dependency graph changes enough to affect sprint planning.
- `/implement` discovers it cannot complete a slice without inventing work outside the planned surface.

Material drift rule: update the requirement doc first (`/requirement`), then continue. Do not silently patch.

---

## Output (manual mode)

After running any mode, emit the mode-specific output block (defined in each reference file), then end with the standard 2-option completion message per `.claude/rules/completion-format.md`:

```
Next: choose one
A) Request changes — describe what to revise
B) Continue to [next-step-name]
```

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- Emit one status line and return.
- Flag `?` (ambiguity) when: drift is detected but the Plan Drift Guard does not give a clear in-plan vs return-to-`/requirement` verdict, OR when two viable next slices exist and the order is unclear.
- Flag `✗` when a slice lacks proof and execution cannot continue without user input.
- Otherwise `✓`.

Skills in autopilot mode do NOT call `ask-choice` directly — flag `?` and let the orchestrator batch.

### Output (autopilot status line — required)

`> plan-driven-delivery: [mode] [status]  [✓|?|✗]`

Examples:
```
> plan-driven-delivery: requirement — 3 slices written  ✓
> plan-driven-delivery: implement — executing S2 (auth handler)  ✓
> plan-driven-delivery: review — 1 unplanned file flagged  ?
> plan-driven-delivery: testing — S3 missing exit evidence  ✗
```

---

## Why this exists

Without a plan contract, each downstream phase reinvents its own definition of "what's next" and "when am I done." The requirement doc becomes a narrative spec that agents interpret differently — leading to silent scope creep, slices that are "done" by convention rather than proof, and reviews that approve diffs without checking the plan. This skill makes the contract explicit once (at `/requirement` time) and forces every phase to read from the same four surfaces. Past context (Thai project): "งานเพิ่มมาเรื่อยๆ ไม่รู้ว่าเสร็จเมื่อไหร่" — work kept growing and no one knew when it was done. The Execution Slices and Plan Drift Guard are the direct fix.
