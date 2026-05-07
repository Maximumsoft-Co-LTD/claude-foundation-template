# Workflow Rules

Top-level orchestrator rule. Governs the order of commands, what each phase must produce before advancing, and how the per-step rules in this directory compose. When in doubt about *which command runs next* or *whether a step can be skipped*, this rule wins.

For the user-facing reference (command list, args, status lifecycle, story-points table), see `.claude/commands/_WORKFLOW-REF.md`. This file defines the **contract**; that file documents the **API**.

## Vocabulary (authoritative)

| Template term | Scrum equivalent | Deployable | User value |
|---|---|---|---|
| **Sprint** (`SP[N]`) | Epic — business theme | no | no |
| **Task** (`SP[N]-T[NNN]`) | Story — vertical slice (FE+BE+data) | **yes** | **yes** |
| Scope Overview bullet | Feature-area summary inside a story | no | no |
| Implementation Plan row | Engineering task — layer-level work | no | no |
| Implementation Plan checkbox | Subtask — atomic 2–5 min action | no | no |

"Task" in this repo ALWAYS means a Scrum Story unless the surrounding text explicitly says "engineering task." Agents inherit this vocabulary.

## The one-doc-per-task rule

**1 task = 1 user story = 1 unified `[task-id]-requirement.md`.** That single doc contains: story · FE design · BE design · Implementation Plan · TDD test plan · NFR/rollout. There is no separate `/design fe`, `/design be`, `-frontend.md`, or `-backend.md`. `/requirement` is the only command that writes this doc; everything else reads from it.

## Canonical sequence

### Single task (sequential)
```
/discovery → /new-sprint → /requirement → /implement
  → /issue (loop, optional) → /code-review → /testing
  → /retro-task → /git-commit → /next-task (repeat per task)
  → /retro-sprint   (only after ALL tasks in sprint are done)
```

### Multiple tasks in parallel
- `/run-tasks [task-id]...` — Agent tool, full subagent pipeline
- `/run-tasks-p [task-id]...` — `claude -p` headless, leaner parent context

Both follow `/discovery → /new-sprint → /run-tasks{,-p} → /git-commit (per task) → /retro-sprint`.

### Autopilot
`/dev` runs the full pipeline with minimal blocks. Behavior of every block point is governed by `.claude/rules/autonomous-mode.md` (3 official block reasons — ambiguity, destructive op, ui-verify fail; status-line format; phase-boundary continue-by-default template). Skills MUST honor that rule when autopilot is active.

## Phase gates (cannot be skipped)

Each row is a contract: the phase produces a named artifact, and the next phase MUST NOT begin without it. If the artifact is missing or incomplete, return to the producing phase.

| Phase | Artifact required to advance | Enforced by |
|---|---|---|
| Discovery | `docs/discovery/disc-NNN-[name].md` with explicit Epic Breakdown + Next Steps | `.claude/rules/discovery.md`, `.claude/rules/discovery-epic-mapping.md` |
| Sprint planning | Sprint overview with filled Stories table + Success Metrics (Gate 1) + BACKLOG.md updated | `.claude/rules/new-sprint.md`, `.claude/rules/metric-instrumentation.md` |
| Requirement | `[task-id]-requirement.md` confirmed by user (HARD-GATE) — story + design + Impl Plan + TDD plan, every AC mapped to ≥1 test row, Success Metric ACs propagated (Gate 2) | `.claude/rules/testing.md`, `.claude/rules/metric-instrumentation.md`, `.claude/rules/clarification.md` |
| Implementation | All tests written and verified RED before any production code; tests GREEN; build exit 0 | `.claude/rules/testing.md` |
| Code review | Two-stage review (spec compliance → code quality), missing impact-map / risk-register coverage = automatic Critical | `.claude/rules/superpowers.md` |
| Testing | Full suite green; every AC has at least one passing test; **ui-verify PASS for FE-touching tasks** | `.claude/rules/testing.md` |
| Retro-task | Task retro written; BACKLOG.md status = `done` | — |
| Git commit | File list confirmed (HARD-GATE — no silent `git add -A`); commit message matches `[task-id] type: ...` ≤72 chars | — |
| Retro-sprint | Every Success Metric has Actual + Source artifact + Verdict (Gate 3) | `.claude/rules/metric-instrumentation.md` |

If a phase gate cannot be satisfied → STOP. Returning to the prior phase to fix the artifact is always cheaper than carrying the gap forward.

## Decision matrix

### Sequential vs parallel
- One task in flight, or tasks share files → sequential (`/implement`)
- Multiple independent tasks (no shared files, no contract dependencies) → `/run-tasks` or `/run-tasks-p`
- Parallel split unit is **the whole user story per agent** — never split a single task across agents by layer (per `.claude/rules/parallel-work.md`).

### `/issue` vs `/debug`
| Situation | Command |
|---|---|
| Bug found during active implementation, root cause known or guessable | `/issue [task-id] [desc]` |
| Critical issue surfaced by `/code-review`, specific failing check | `/issue [task-id] [desc]` |
| Symptom without clear origin, flaky test, intermittent regression | `/debug [task-id] [desc]` |
| Production incident, no sprint context | `/debug [desc]` |

Rule of thumb: if you can name the likely root cause, use `/issue`. If you're guessing, use `/debug` first.

### `/discovery` vs `/brainstorm`
- Default to `/discovery` (template-native, sprint-aware).
- Use `/brainstorm` only when the user explicitly asks for conversational exploration. Both produce a discovery doc at the same path; `/brainstorm` is the superpowers-backed alternative.

## Pre-flight gates that apply to every command

These run before the command's first artifact-producing step, in this order:

1. **Confidence Gate (≥ 90%)** — `.claude/rules/confidence-gate.md`. Below the bar → output the structured "not enough to proceed" block, do not write files.
2. **Brain access** — `.claude/rules/brain.md`. Read `BRAIN-INDEX.md` only if the task requires it; never read the full vault.
3. **Workspace detect** (greenfield vs brownfield, paused autopilot session) — first call in any `/dev` pipeline.
4. **Context7 cache check** — `.claude/rules/context7-cache.md`. Reuse sprint-scoped cache before any `resolve-library-id` / `query-docs` call.

## Post-write self-check (every artifact)

After every Write or Edit on a workflow file (`docs/sprints/**`, `docs/discovery/**`, `docs/BACKLOG.md`, `.claude/commands/**`), re-read the file and verify per `.claude/rules/self-check.md` (structural integrity, no unresolved placeholders, AC coverage, cross-file consistency). Do NOT report completion until the re-read passes.

## Completion exit format

Every artifact-producing step ends with the 2-option message defined in `.claude/rules/completion-format.md` (A = Request changes, B = Continue to [next-step-name]). No 3+ option menus. No "looks good?".

## Three skill gates wired into the core flow

| Skill | Trigger | Hooked at |
|---|---|---|
| `bug-repro` | Any bug fix → produce verified-RED failing test before any fix code | `/issue` Step 3, `/debug` Phase 4 |
| `impact-map` | Change touches existing code → enumerate Tier-1/2/3 dependents | `/issue` Step 2, `/implement` Step 1e, `/code-review` Step 2a |
| `risk-register` | Migration · auth · payment · public API · removed cron → mitigation + rollback evidence | `/implement` Step 1e, `/code-review` Step 2b |

`/code-review` treats missing `impact-map` coverage or missing `risk-register` evidence as automatic Critical findings.

## Hard rules — never violate

- ❌ No direct commits to `main` — always branch per task (`[sprint-id]/[task-id]-[short]`).
- ❌ No skipping `/requirement` to "save time" — implementation without the unified doc has no AC contract.
- ❌ No code before test (Iron Law) — code written before its test must be **deleted**, not "kept as reference."
- ❌ No silent `git add -A` — file list must be confirmed before commit.
- ❌ No `--no-verify`, no `--no-gpg-sign` unless the user explicitly asks.
- ❌ No 13-point tasks ship without breakdown — block at `/new-sprint` Step 3.
- ❌ No Success Metric without instrumentation artifact — block at `/new-sprint` Step 1 (Gate 1) and `/retro-sprint` (Gate 3).
- ❌ No splitting a single task across multiple agents by layer — split the task instead.

## Why this rule exists

The other rules in this directory each enforce one local invariant (testing, brain access, completion format, etc.). Without a single orchestrator rule, the question "can I skip from `/new-sprint` straight to `/implement`?" has no canonical answer — each local rule looks correct, but the overall sequence breaks. This file is that canonical answer: every command's place in the sequence, every artifact required to advance, and every cross-rule that fires at the boundary.

When a per-step rule and this file disagree on ordering or artifact requirements, this file is wrong — fix it. Per-step rules own the *details* of their step; this file owns the *sequence*.
