# Testing Rules

- Write the failing test **first**, then implement until it passes — no exceptions.
- Integration tests must use **real dependencies** (real DB, real queue, real HTTP). Never mock at the integration layer.
- A bug fix always starts with a **failing test** that reproduces the bug before touching the implementation.
- Never use `.only`, `.skip`, or comment out a failing test to make the suite pass.
- After fixing a failing test, always run the **full suite** to confirm no regressions.
- Test file naming: `[module].test.ts` / `[module]_test.go` / `test_[module].py` co-located with the source file.
