# /debug
Workflow position: **standalone — use anytime a bug, test failure, or unexpected behavior occurs**

Systematic debugging — find root cause before attempting fixes.
Arguments: `[task-id?] [description]` — e.g. `SP1-T002 API returns 500 on empty payload` or `test_user_auth flaky`

`[task-id]` is optional. If provided, context is loaded from sprint docs and the bug is logged via `/issue` after fix.

---

## Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.
If 3+ fixes have failed, question the architecture — don't attempt fix #4.

---

## Phase 1 — Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read error messages carefully**
   - Full stack traces, line numbers, error codes — don't skip past them.

2. **Reproduce consistently**
   - Can you trigger it reliably? What are exact steps?
   - If not reproducible → gather more data, don't guess.

3. **Check recent changes**
   - `git diff`, recent commits, new dependencies, config changes.
   - What changed that could cause this?

4. **Gather evidence in multi-component systems**
   - For each component boundary: log what enters and exits.
   - Run once to see WHERE it breaks, THEN investigate that layer.

5. **Trace data flow**
   - Where does the bad value originate?
   - Trace backward through call stack until you find the source.
   - Fix at source, not at symptom.

---

## Phase 2 — Pattern Analysis

1. **Find working examples** — similar working code in same codebase.
2. **Compare** — what's different between working and broken?
3. **List every difference** — however small. Don't assume "that can't matter."
4. **Check dependencies** — what settings, config, env does this need?

---

## Phase 3 — Hypothesis and Testing

1. **Form single hypothesis** — "I think X causes this because Y."
2. **Test minimally** — smallest possible change, one variable at a time.
3. **Verify** — did it work?
   - Yes → Phase 4.
   - No → form NEW hypothesis. Don't add more fixes on top.
4. **When you don't know** — say so. Don't pretend.

---

## Phase 4 — Implementation

1. **Write failing test** that reproduces the bug.
2. **Run it — confirm it FAILS** with an expected error, not a setup crash. Never skip this step.
   - Passes immediately? You are testing existing behavior, not the bug. Fix the test first.
3. **Implement single fix** — address root cause, ONE change. No "while I'm here" improvements.
4. **Verify fix** — test passes? No regressions? Issue resolved?
5. **If fix doesn't work and attempt count ≥ 3 → STOP:**
   - Each fix revealing new problems in different places = architectural issue.
   - Discuss with user before attempting more fixes.

---

## Verification Gate (before claiming fixed)

| Claim | Required evidence |
|-------|------------------|
| Bug fixed | Original symptom test: passes |
| No regressions | Full suite: 0 new failures |
| Regression test works | Red-green cycle verified (test fails without fix, passes with fix) |

**Run the verification NOW. Don't rely on memory.**

---

## Red Flags — STOP and return to Phase 1

- "Quick fix for now, investigate later"
- "Just try changing X and see"
- "I'm confident" (confidence ≠ evidence)
- "One more fix attempt" (after 2+ failures)
- Proposing solutions before tracing data flow
- Each fix reveals new problem in different place

---

## Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Debug: [description]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Root cause: [what and why]
Fix: [what was changed]
Test: [test name] — red ✓ → green ✓
Regression: full suite [N] passing, 0 failing

Attempts: [N] | Resolved: yes/no
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If unresolvable after 3 attempts → report architectural concern and ask user for direction.

After a successful fix: run `/issue [task-id] [description]` to log the bug if this occurred during a sprint task.
