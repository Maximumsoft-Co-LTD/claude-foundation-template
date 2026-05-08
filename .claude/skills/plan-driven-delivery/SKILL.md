---
name: plan-driven-delivery
description: Keep task execution aligned to the requirement doc's implementation plan, normalize execution slices, detect scope drift, and drive `/requirement`, `/implement`, `/code-review`, `/issue`, `/testing`, and `/dev` from the same plan contract. Use when a task already has a `[task-id]-requirement.md` and the workflow must follow the plan rather than improvising new work.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(ls:*), Bash(cat:*)
---

# plan-driven-delivery

## Overview

Use this skill after `/requirement` has produced a real `[task-id]-requirement.md`.
It turns that doc into a plan-driven execution contract so `/implement`, `/code-review`, `/issue`, `/testing`, and `/dev` all use the same answer to: "what is the next planned piece of work, and when is this task truly done?"

Read [references/workflow-principles.md](references/workflow-principles.md) when you are changing workflow commands or need the rationale behind a workflow decision. Read [references/mode-checklists.md](references/mode-checklists.md) when you need the exact input/output contract for a specific phase.

Workflow position: **after `/requirement` has a real task contract; reused anywhere downstream phases need the same execution slices, proof rules, and drift guard**

## When to invoke

Invoke this skill when any of these are true:
- `/requirement` has drafted ACs, Implementation Plan, and tests, and now needs a compact execution contract.
- `/implement` needs the next planned slice instead of "read the whole doc and guess."
- `/code-review` must check whether the diff matches the agreed plan, not just whether the code compiles.
- `/issue` must decide whether a fix stays inside the current plan or re-opens `/requirement`.
- `/testing` must verify not only AC coverage, but also that every planned slice has evidence.
- `/dev` needs a deterministic task-level source of truth for "continue automatically" vs "ask the user."

Skip this skill when:
- The workflow is still in `/discovery` or `/new-sprint`. There is no task-level requirement doc yet.
- The task is doc-only or trivial enough that no implementation plan exists.
- The user explicitly wants freeform brainstorming instead of plan-following execution.

## Core contract

After `/requirement`, the task has one source of truth:
- `Acceptance Criteria` define user-visible outcomes.
- `Scope Overview` defines the major chunks of work.
- `Implementation Plan` defines the engineering tasks and file paths.
- `TDD Test Plan` and `E2E Test Plan` define the proof.
- `Execution Slices` define the order the work should be closed.
- `Plan Drift Guard` defines when `/issue` is enough and when the task must return to `/requirement`.

Downstream phases must not silently invent work that changes the task contract.

Use this decision rule:
1. If new work preserves the same ACs, user-visible outcome, API contract, and rollout plan, keep it inside `/issue` or the current slice.
2. If new work changes AC text, adds/removes a user-visible outcome, changes a published contract, adds a new risky dependency, or materially changes the estimate/dependency graph, return to `/requirement`.
3. If the next action is still obvious after the fix, `/dev` continues automatically. If not, batch a question.

## Required sections to maintain

This skill expects these sections in `[task-id]-requirement.md` for all non-infra tasks:
- `## Scope Overview`
- `## Implementation Plan`
- `## Execution Slices`
- `## Plan Drift Guard`
- `## TDD Test Plan`
- `## E2E Test Plan` for 3pt+ or any FE-touching task

If `Execution Slices` or `Plan Drift Guard` do not exist yet, create them. Do not create a separate plan file unless the caller explicitly wants `/write-plan`.

Recommended `Execution Slices` shape:

```markdown
## Execution Slices
| Slice | Goal | Covers ACs | Planned files | Test-first proof | Exit evidence | Status |
|-------|------|------------|---------------|------------------|---------------|--------|
| S1 | ... | AC-1, AC-2 | path/a, path/b | test names + command | what proves the slice is done | planned / doing / done |
```

Rules:
- 1-7 slices per task. If you need more, the task is probably too large or the slices are too small.
- One slice is one meaningful checkpoint, not one checkbox.
- Every slice maps to at least one AC.
- Every slice names its proof before implementation starts.
- `Status` changes only when proof exists.

Recommended `Plan Drift Guard` shape:

```markdown
## Plan Drift Guard
- **In-plan fixes stay in `/issue`:** ...
- **Return to `/requirement` when:** ...
- **Permitted follow-ups after ship:** ...
```

## Mode 1 — requirement

Use this after the requirement doc has real ACs, an Implementation Plan, and test plans.

Steps:
1. Read the current `Acceptance Criteria`, `Scope Overview`, `Implementation Plan`, `TDD Test Plan`, and `E2E Test Plan`.
2. Collapse the plan into 1-7 `Execution Slices`.
3. For each slice, record:
   - the slice goal,
   - AC coverage,
   - planned files,
   - the tests that must go red first,
   - the evidence that closes the slice.
4. Write `Plan Drift Guard` with concrete rules for this task.
5. Verify:
   - every AC appears in at least one slice,
   - every slice has at least one planned test,
   - no planned file is invented outside Existing Code Context,
   - no risky change lacks an explicit drift rule.

Output:
- updated requirement doc sections,
- a one-line next-slice recommendation for `/implement`,
- any blocking ambiguity that still needs a user answer.

## Mode 2 — implement

Use this before writing code and again after each slice closes.

Steps:
1. Read `Execution Slices`.
2. Pick the first non-`done` slice whose dependencies are already closed.
3. Restrict work to:
   - the slice's ACs,
   - the slice's planned files,
   - the slice's planned tests.
4. Write tests first. Confirm RED before production code.
5. After GREEN, update the slice status only if the promised exit evidence exists.
6. If you find new work:
   - same AC, same contract, same outcome -> keep it in the current slice or `/issue`,
   - anything else -> stop and return to `/requirement`.

Do not advance to the next slice while the current one still lacks proof.

## Mode 3 — review

Use this during `/code-review` after the diff is loaded.

Steps:
1. Compare the diff against `Execution Slices`, `Implementation Plan`, and ACs.
2. Flag:
   - changed files not covered by any slice,
   - slices still `planned` even though the diff depends on them,
   - ACs with no matching slice evidence,
   - fixes that should have re-opened `/requirement` but did not.
3. Classify findings:
   - `Critical` when the diff breaks the task contract or hides material plan drift,
   - `Minor` when the code stays in-plan but the implementation is incomplete or weak,
   - `Suggestion` for polish inside an otherwise valid slice.

## Mode 4 — issue

Use this after root cause is known.

Steps:
1. Map the issue to the owning AC and slice.
2. Decide:
   - `in-plan bug` -> fix inside `/issue`,
   - `material drift` -> update issue log, send the task back to `/requirement`.
3. Keep the issue note explicit about which slice was affected and whether the exit evidence changed.
4. If the fix adds new proof requirements, update the slice before the code fix is considered complete.

## Mode 5 — testing

Use this during `/testing` after test execution and before declaring readiness.

Steps:
1. Check every slice:
   - status is `done`,
   - promised tests actually passed,
   - promised exit evidence exists.
2. Cross-check slices against ACs:
   - every AC has a passing proof path,
   - every slice corresponds to a real user-visible or contract-visible outcome,
   - FE-touching slices have journey evidence, not only unit tests.
3. If tests pass but a slice still lacks its promised proof, the task is not ready.
4. If testing reveals new work outside the plan, route through the drift rule instead of silently patching.

## Mode 6 — dev

Use this in `/dev` after each stage boundary once a task has a requirement doc.

The orchestrator should read:
- current task,
- current phase result,
- `Execution Slices`,
- any open issues or blocked proof.

Then choose exactly one next action:
- next requirement task,
- next implementation slice,
- `/issue`,
- `/code-review`,
- `/testing`,
- `/git-commit`,
- or a batched user question.

Ask the user only when one of these is true:
- ambiguity remains after checking the plan,
- the next action is destructive,
- `ui-verify` failed.

If material plan drift is clear, reroute to `/requirement` without turning it into a fourth blocker. Ask only when the drift itself is ambiguous.

## Material drift checklist

Treat it as material drift if any of these become true:
- The user-visible workflow changes.
- An AC must be added, removed, or rewritten.
- A public API or shared contract changes.
- A new migration, permission change, payment rule, or external dependency appears.
- The task estimate or dependency graph changes enough to alter sprint planning.
- The diff needs files or modules that were not in the task's intended surface and are not a trivial call-site update.

Material drift means: update the requirement doc first, then continue.

## Output

Use concise outputs.

Requirement mode:
```text
plan-driven-delivery: contract written
Slices: S1, S2, S3
Next slice: S1 — [goal]
```

Implement mode:
```text
plan-driven-delivery: implement S2
Files: [paths]
Proof: [tests / evidence]
```

Review/testing mode:
```text
plan-driven-delivery: [PASS | FAIL]
Unplanned work: [none | list]
Drift: [none | return to /requirement]
```

## Anti-patterns

- ❌ Treating every unchecked checkbox as its own execution slice.
- ❌ Marking a slice `done` because code exists, without the proof promised in the slice.
- ❌ Letting `/issue` quietly expand scope.
- ❌ Letting `/code-review` approve a diff that changed the task contract without updating `/requirement`.
- ❌ Letting `/testing` declare success when the tests pass but the planned journey or rollout proof is missing.
- ❌ Making `/dev` infer task state from chat memory when the requirement doc already contains a better plan contract.
