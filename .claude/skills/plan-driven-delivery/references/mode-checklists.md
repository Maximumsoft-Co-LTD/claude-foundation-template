# Mode Checklists

Use this reference when the workflow phase is clear and you just need the exact contract.

## requirement

Inputs:
- `[task-id]-requirement.md`
- ACs
- Scope Overview
- Implementation Plan
- TDD/E2E test plans

Must produce:
- `Execution Slices`
- `Plan Drift Guard`
- next-slice recommendation

Hard failures:
- AC without a slice
- slice without proof
- plan file paths not grounded in the codebase

## implement

Inputs:
- `Execution Slices`
- current diff / worktree
- issue log if present

Must produce:
- current slice selection
- updated slice status after proof exists
- drift classification when new work appears

Hard failures:
- code before RED
- changing files outside the slice without a drift decision
- closing a slice without evidence

## review

Inputs:
- current diff
- requirement doc
- `Execution Slices`

Must produce:
- planned vs unplanned change summary
- drift finding or pass
- severity for each contract break

Hard failures:
- diff changes contract but requirement doc stayed stale
- required slice missing from diff
- unplanned risky change with no requirement update

## issue

Inputs:
- issue description
- root cause
- owning AC / slice

Must produce:
- `in-plan bug` or `material drift`
- issue note tied to a slice
- updated proof requirement when needed

Hard failures:
- issue expands scope silently
- new risky work with no drift escalation

## testing

Inputs:
- test results
- requirement doc
- `Execution Slices`
- smoke / journey evidence where applicable

Must produce:
- slice-by-slice readiness
- AC-by-AC readiness
- explicit blocker if proof is missing

Hard failures:
- green tests but unfinished slices
- FE-ready claim without journey evidence
- no decision on new work discovered during testing

## dev

Inputs:
- current stage
- task order
- requirement doc
- `Execution Slices`
- last phase result

Must produce:
- one next action
- batched question only when needed

Hard failures:
- planning from transcript memory instead of docs
- asking the user when the plan already answers the question
- continuing after material drift with no requirement update
