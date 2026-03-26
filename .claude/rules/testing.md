# Testing Rules

## Core rules
- Write the failing test **first**, then implement until it passes — no exceptions.
- Integration tests must use **real dependencies** (real DB, real queue, real HTTP). Never mock at the integration layer.
- A bug fix always starts with a **failing test** that reproduces the bug before touching the implementation.
- Never use `.only`, `.skip`, or comment out a failing test to make the suite pass.
- After fixing a failing test, always run the **full suite** to confirm no regressions.
- Test file naming: `[module].test.ts` / `[module]_test.go` / `test_[module].py` co-located with the source file.

## Iron Law: code before test = delete it

If implementation code was written before its test — **delete the code**. Not "keep as reference." Not "adapt it while writing tests." Delete it and implement fresh from tests.

Why: code kept as reference biases the test toward testing what was built, not what should be built. That's testing-after with extra steps.

## Verify RED is mandatory

After writing a failing test, **run it and watch it fail** before writing any implementation code.

- Test must fail (not error from typos or missing imports — those are setup bugs, not RED).
- Failure message must match what you expect (e.g., "expected X, got undefined" — not a random crash).
- **Test passes immediately?** You're testing existing behavior, not new behavior. Fix the test.

Never skip this step. If you didn't see it fail, you don't know if it tests the right thing.

## Rationalization red flags

If you catch yourself thinking any of these — STOP. You are about to skip TDD:

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll write tests after" | Tests passing immediately prove nothing. |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "Deleting X hours of work is wasteful" | Sunk cost. Keeping unverified code is tech debt. |
| "Need to explore first" | Fine. Throw away exploration, then start with TDD. |
| "Test is hard to write" | Listen to it — hard to test = hard to use. Simplify the design. |
| "Just this once" | No exceptions. |
