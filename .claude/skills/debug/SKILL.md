---
name: debug
description: Root-cause investigation protocol — reproduce, isolate, hypothesize, verify, fix with TDD — never workaround
allowed-tools: Read, Grep, Glob, Edit, Bash(git:*), Bash(go test:*), Bash(npm test:*), Bash(npm run:*), Bash(pytest:*), Bash(curl:*), Bash(mongosh:*), Bash(jq:*), Bash(cat:*)
---

# debug

Workflow position: **invoked from `/issue`, `/debug` command, or mid-`/implement` when a test fails or behavior is wrong**

Produces a root cause, not a workaround. Distinct from "patching until green."

Arguments: `[task-id] [symptom in quotes]` — e.g. `SP3-T012 "POST /things returns 500 when name has emoji"`

---

## When to invoke

- Test fails and the failure isn't an obvious typo
- UI bug that `ui-verify` caught
- 500 / unexpected response from API
- Flaky test (passes sometimes)
- Production / staging incident

Skip:
- Compile error from a typo in the line you just wrote — fix directly
- Lint warning — just fix

---

## Step 1 — Reproduce minimally

Run the failing case. Record exactly:

```
Command:    [the command]
Exit code:  [N]
Stderr:     [first 10 lines]
Stack top:  [file:line]
```

Run 3 times if non-deterministic. Note "consistent" vs "flaky."

Confirm it actually fails on the current branch:

```bash
git stash && [reproduce] ; git stash pop
```

If passes on stash → the failure is from your uncommitted changes (good — small search space).

---

## Step 2 — Shrink the input

Binary-search the trigger:

| Question | Action |
|---|---|
| Does it fail with empty input? | Try with `{}` body or empty form |
| Does it fail with a known-good input? | Compare known-good vs failing |
| Does it fail at boundary? | n=0, n=1, n=max |
| Does it fail with charset weirdness? | emoji, RTL, NUL, very long string |

Goal: a single-line repro:

```
curl -X POST http://localhost:8080/api/things -d '{"name":"🦀"}' --> 500
```

If you can't reduce → step 3 anyway, but flag low confidence.

---

## Step 3 — Trace the path

Read code in this order, stop when you have the suspect:

1. Failing test or error source
2. Function at the top of the stack
3. Functions called by it (one level)
4. Recently changed files in this branch: `git diff main...HEAD --name-only`

Hard cap: **5 files**. If you've read 5 and still don't see it → step 4.

---

## Step 4 — Form 2–3 hypotheses

```
H1 (most likely): [hypothesis] — evidence: [what points here]
H2:               [hypothesis] — evidence: [...]
H3:               [hypothesis] — evidence: [...]
```

Rank by:
1. Recency — code touched in this branch is suspect first
2. Specificity — "that one regex" beats "something with parsing"
3. Prior incidents — `grep -i "[symptom keyword]" brain/04-lessons/`

---

## Step 5 — Verify (do not fix yet)

For H1, add a log or assertion that confirms or denies. Do NOT fix.

Examples:
- "If H1 is right, this `panic` should print before crash" → add log
- "If H1 is right, body should be empty here" → add assertion
- "If H1 is right, query returns 0 rows" → run query manually via mongosh

Result is binary: H1 confirmed or denied. If denied → try H2.

If all 3 denied → step 3 was incomplete; re-read with the new info.

---

## Step 6 — Document the root cause

```
Root cause: [precise — "json.Unmarshal silently drops 4-byte UTF-8 because struct tag uses string not []byte"]
Location:   [file:line]
Trigger:    [exact condition]
Not caused by: [ruled-out hypotheses]
Class:      [logic / state / concurrency / config / dependency]
```

---

## Step 7 — Fix (TDD)

1. Write a test that reproduces this exact root cause. Run it. Confirm it FAILS.
2. Implement minimal fix.
3. Confirm the test PASSES.
4. Run full suite. Confirm no regressions.

The test from step 1 is non-negotiable — without it, the fix can regress next sprint and nobody notices.

---

## Step 8 — Capture lesson

If the bug class might recur (anything except "obvious typo"):

```
Invoke Skill("brain-capture") with type=LES, source=from-bug.
```

The note prevents the same bug from happening to future-you.

---

## Step 9 — Decide scope

| Fix size | Action |
|---|---|
| < 30 lines, no design impact | inline fix; continue current command |
| Touches public API, > 30 lines, or breaks AC | invoke `/issue [task-id] [description]` to spin up a sub-task |
| Cross-cutting (affects 3+ tasks) | STOP. This is its own task. Run `/new-sprint` add-task flow. |

---

## Output

```
debug: [task-id] — RESOLVED  /  ESCALATED
Root cause: [1 line]
Fix:        [1 line, file:line]
Test added: yes (path/to/test) — was RED, now GREEN
Regressions: 0 / [N caught and fixed]
Brain note: LES-NNN  /  skipped (not recurring class)

Next:
  RESOLVED → continue caller command (/implement, /testing, etc.)
  ESCALATED → /issue [task-id] [description]
```

---

## Anti-patterns

- ❌ Try-fix-try-fix loop without forming a hypothesis
- ❌ Workaround that hides the symptom (`try / catch` around the bug)
- ❌ Skipping the failing test — the regression test is the whole value
- ❌ "Probably the framework, let me upgrade" without verification
- ❌ Reading 20 files looking for inspiration

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: full root-cause + fix flow.
- **Autopilot mode** (typically auto-invoked from `ui-verify` FAIL): same flow. If RESOLVED with regression test GREEN → emit `✓` and orchestrator continues. If unresolvable → BLOCK with diagnosis.

## Output (autopilot status line — required)

`> debug: ROOT [class] @ [file:line], fix [size]  [✓]` or `> debug: UNRESOLVED [hyp count] tested  [✗]`

Examples:
- `> debug: ROOT logic @ handlers/things.go:42, fix 5 lines  ✓`
- `> debug: UNRESOLVED 3 hyps tested, escalating  ✗`

---

## Why this exists

Debugging without protocol is gambling. The reproduce → narrow → hypothesize → verify cycle is dull but converges; "let me try things" diverges. The TDD requirement at step 7 turns each bug into a test that enforces the fix forever.
