---
type: concept
tags: [workflow, code-review, quality, claude-code]
related: [CON-tdd-rules, PAT-005-subagent-driven-development]
updated: 2026-04-29
source: template
---

# Two-Stage Review

## Core idea

Code review has **two distinct concerns**:

1. **Spec compliance** — Does the code do what the requirement says?
2. **Code quality** — Is the code well-written?

Mixing these into one review pass produces messy feedback ("the auth flow is wrong AND your variable names are bad") that's hard to act on. **Run them as two separate stages.**

This is enforced in `/code-review` Steps 2a–2b and corresponds to the superpowers `requesting-code-review` + `receiving-code-review` skills.

## Stage 1: Spec compliance

**Question:** Does this code satisfy every AC in the requirement doc?

Review focus:
- Every AC has a test
- Every test actually exercises the AC behavior (not a tautology)
- Edge cases listed in the requirement are covered
- Out-of-scope items are NOT implemented

What's NOT in scope here:
- Variable naming
- Function length
- Style / formatting

Output: a list of AC gaps (or "all ACs covered").

## Stage 2: Code quality

**Question:** Is the code something we'd be okay maintaining?

Review focus:
- Clarity (naming, structure)
- Correctness (off-by-ones, error handling, race conditions)
- Performance (N+1, redundant work)
- Security (injection, secrets, auth boundaries)
- Maintainability (testability, coupling, abstractions)

What's NOT in scope here:
- Whether the AC is the right AC (that's spec/discovery, not review)
- Whether the architecture should be different (that's an ADR)

Output: a list of issues with severity (blocker / major / minor / nit).

## Why separate them?

**Different reviewers, different mindsets.** A spec compliance reviewer asks "does X happen?" A code quality reviewer asks "should X be implemented this way?" These are different cognitive modes and bundling them produces sloppy work in both.

**Different fix paths.** A spec gap means "write more code/tests." A quality issue means "refactor existing code." Mixing them obscures which is which.

**Subagent-friendly.** Each stage can run as its own subagent with a focused prompt. Fresh context, scoped tools, clean output.

## Order matters: spec first

Always run spec compliance **before** code quality. Reasons:

1. If the code doesn't meet the spec, quality issues are moot — the code is changing anyway.
2. Spec gaps are blockers; quality nits are not. Surface blockers early.
3. Refactoring before spec compliance creates churn — you may rewrite code that's about to be deleted.

## Receiving review feedback

When acting on review output, follow the superpowers "receiving-code-review" pattern:

1. **Verify the finding** — re-read the cited code, confirm the issue exists.
2. **Decide** — agree (fix it) or disagree (push back with reasoning, in writing).
3. **Never silently ignore.** Every finding gets a response, even if the response is "won't fix because X."

Pushback with reasoning is healthy. Silent ignore destroys trust in the review process.

## Anti-pattern: "LGTM"

A review that says only "LGTM" or "looks good" failed both stages. It either:
- Did not check spec compliance (no AC mapping)
- Did not check quality (no concrete observations)

Reviews must show their work. Subagent reviews especially — the output IS the audit trail.

## Related

- `superpowers:requesting-code-review` skill (when installed)
- `superpowers:receiving-code-review` skill (when installed)
- `/code-review` — bridge command
- [[PAT-005-subagent-driven-development]] — review stages run as subagents
