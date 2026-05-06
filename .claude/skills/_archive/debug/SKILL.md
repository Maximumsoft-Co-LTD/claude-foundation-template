---
description: Systematic debugging protocol — reproduce, isolate, hypothesize, verify, fix
allowed-tools: Read, Grep, Bash(git *), Bash(npm *), Bash(go *), Bash(python *), Bash(cat *)
disable-model-invocation: false
---

# /debug
Workflow position: **during /implement or /testing → START → continue or /issue**

Structured debugging session for a failing test, runtime error, or unexpected behavior. Produces a root-cause finding, not just a workaround.
Arguments: `[task-id] [symptom]`  — e.g. `SP1-T003 "user.save() throws 500 when email contains +"`

---

## Step 1 — Reproduce

Parse `[task-id]` and `[symptom]`.

**Goal: produce a minimal, deterministic reproduction.**

1. Run the failing test or trigger the behavior: note exact error message, stack trace, exit code.
2. If the error is non-deterministic → run 3 times. Document whether it's consistent or flaky.
3. Confirm the failure exists on the current branch: `git stash && [reproduce] && git stash pop`
4. If it passes on main → this is a regression introduced in this branch.

Do NOT attempt a fix yet.

---

## Step 2 — Narrow the scope

Binary search the failure:

- Which layer fails first? (HTTP handler → service → repository → DB)
- Which input triggers it? (try removing fields, using known-good values)
- Does it fail with a fresh DB / clean state?
- Does it fail with the minimal possible input?

Write down the **smallest reproducible case** before continuing.

---

## Step 3 — Read relevant code

Read:
- The failing test or error source
- The function/method where the error originates
- Any recently changed files in this task: `git diff main...HEAD --name-only`

Do NOT read the entire codebase — stay within the call chain of the error.

If stuck after reading 5 files → stop. Document what you know and ask the user for guidance. Do not retry the same approach.

---

## Step 4 — Form and rank hypotheses

List 2–4 hypotheses for root cause, ranked by likelihood:

```
H1 (most likely): [hypothesis] — evidence: [what points to this]
H2: [hypothesis] — evidence: [what points to this]
H3: [hypothesis] — evidence: [what points to this]
```

Test H1 first. Add a targeted log or assertion to confirm or disprove it. Do not fix — only verify.

---

## Step 5 — Confirm root cause

Once a hypothesis is confirmed:

```
Root cause: [precise description]
Location:   [file:line]
Trigger:    [exact condition that causes the failure]
Not caused by: [ruled-out hypotheses]
```

---

## Step 6 — Fix (TDD)

1. Write (or update) a test that **fails** for the root cause specifically.
2. Implement the minimal fix.
3. Confirm the new test passes.
4. Run the full test suite — confirm no regressions.

Keep the fix minimal. Do not refactor surrounding code while fixing.

---

## Step 7 — Decide: inline fix or /issue

- **Simple fix (< 30 lines, no design impact)** → fix inline, continue `/implement` or `/testing`.
- **Non-trivial fix (design change, cross-task impact, > 30 lines)** → run `/issue [task-id] [description]`.

---

## Output

```
Root cause: [description]  |  Location: [file:line]
Fix: [1-line summary]  |  Test added: yes/no

Regressions: none / [N] caught and fixed

Next:
  Simple fix → continue /implement or /testing [task-id]
  Non-trivial → /issue [task-id] [description]
  Unresolvable → document and ask user
```
