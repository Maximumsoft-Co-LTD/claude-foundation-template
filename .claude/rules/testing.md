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

## Prefer the smallest sufficient test

Choose the **lowest test level that can falsify the AC**:

- **Unit** — branching, calculation, formatting, validation, pure state transitions
- **Integration** — DB/repository behavior, auth middleware, queue/HTTP boundaries, contract shape, transactionality
- **E2E / journey** — critical user journeys and cross-system smoke only

Do **not** duplicate the same assertion at all three layers just to feel safer.
Each E2E row must prove something lower-level tests cannot prove as cheaply or as reliably.

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

## Boundary cases must be planned, not improvised

For every AC that contains a comparison operator (`>`, `>=`, `<`, `<=`, `!=`, `before`, `after`, `non-empty`, `exactly`), the TDD Test Plan MUST include at least one row that hits the exact boundary (e.g. `n === threshold`, `n === 0`, `length === 1`).

Without an explicit boundary row, an off-by-one or sign error slips past spec-compliance review (which only checks "is there a test for AC-N?", not "is the boundary covered?").

Source: `brain/04-lessons/LES-005-boundary-cases-need-tdd-rows.md` (SP1, retro-sprint promotion).

## Audit-in-transaction (state change + audit row are atomic)

When a service writes a state change AND records an audit/history row, both writes MUST happen inside the same transaction. The audit append goes inside the transaction closure, not after it. If the audit append throws, the entire mutation must roll back.

Test for this directly: monkey-patch your audit logger to throw, call the state-changing method, assert that the DB state is unchanged.

Source: `brain/03-patterns/PAT-008-audit-in-transaction.md` (SP1, retro-task promotion). Origin lesson: `brain/04-lessons/LES-004-audit-outside-transaction.md` (from-bug).
