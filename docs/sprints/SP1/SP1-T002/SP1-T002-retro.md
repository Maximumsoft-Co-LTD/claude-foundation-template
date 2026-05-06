# SP1-T002 — Purchase Orders + Approval + Receive — Retrospective

**Sprint:** SP1
**Date:** 2026-05-05
**Status:** done

---

## Estimate vs Actual
- **Estimated:** 2 days
- **Actual:** ~0.4 day equivalent (workflow-test pace, building on T001's foundation)
- **Variance:** −1.6 days; faster than T001 because patterns + tooling were already in place
- **Velocity trend:** **faster** than T001 — PAT-008 was already a brain note, audit-log + DB infrastructure was reusable, and the `applyReceipt` interface had been locked at T001 design time

## What went well
- **PAT-008 (audit-in-transaction) reused proactively** — every transition (`createPO`, `approvePO`, `rejectPO`, `markReceived`) wraps the audit append inside the txn closure from the start. AC-10 had three rollback tests that all went GREEN on first implementation.
- **Cross-module contract held**: `InventoryService.applyReceipt` (introduced in T001) was called from inside the outer `markReceived` transaction, and PAT-008 still held — `applyReceipt`'s own audit write nests into the outer txn cleanly because better-sqlite3 transactions compose by reference to the same `Db` instance.
- **0 regressions on T001's 35 tests** when extending the schema and adding a sibling module.
- **Multi-line PO test (AC-8)** caught a logic question early — should multi-line markReceived be all-or-nothing? Yes, because the outer txn enforces atomicity — proven by the AC-10 markReceived rollback test.
- **Workflow handoff between tasks worked**: `/git-commit` Step 9 auto-loaded T002, the `Origin: SP1-overview.md` reference let `/requirement` reuse the cross-task contracts section, and the audit/error class re-exports (`src/po/errors.ts`) avoided duplication.

## What could be improved
- **`requireNonEmpty` duplicated** between `src/inventory/inventory.service.ts` and `src/po/po.service.ts` — minor. Lift to `src/utils/validate.ts` in a follow-up. Flagged in code review but not blocking.
- The **boundary case for the threshold** (`total_thb === 5000`) wasn't called out in the requirement doc until I wrote the test — discovered while writing AC-2's first test. Should have been explicit in `disc-001` §15. Captured as a minor lesson candidate.

## Issues encountered
- 0 total: 0 critical / 0 major / 0 minor.
- Code review found 1 minor (requireNonEmpty duplication) — non-blocking, deferred.

## TDD effectiveness
- Tests written before implementation: **yes** (test file + service file + presenter file in that order; RED confirmed for the AC-10 rollback tests; tests for the happy path went RED on the stubbed service then GREEN on impl)
- Bugs caught by tests before manual QA: **0** new (PAT-008 was already locked from T001, so no audit-atomicity bug appeared)
- Gaps found in TDD test plan: boundary case at exactly 5000 added during testing (R-2 wording was `>=` but the doc didn't list a boundary test row originally)

## AC Coverage Check
| AC | Test exists? | Test passes? | Notes |
|----|-------------|-------------|-------|
| AC-1 | yes | yes | 2 tests (auto-approve + audit chain) |
| AC-2 | yes | yes | 2 tests (boundary at 5000 + ≥ threshold) |
| AC-3 | yes | yes | 1 test (PENDING → APPROVED) |
| AC-4 | yes | yes | 1 test (cross-module applyReceipt + stock + audit) |
| AC-5 | yes | yes | 4 tests (illegal approve from APPROVED, REJECTED, RECEIVED, missing PO) |
| AC-6 | yes | yes | 2 tests (illegal mark-received from PENDING, RECEIVED) |
| AC-7 | yes | yes | 4 tests (empty lines, qty=0, price=0, missing item) |
| AC-8 | yes | yes | 1 test (multi-line) |
| AC-9 | yes | yes | 2 tests (reject + reject without note) |
| AC-10 | yes | yes | 3 tests (PAT-008 across createPO, approvePO, markReceived) |

- [x] All ACs have at least one passing test
- [x] No AC is "assumed passing" without a test

## Knowledge sharing
- PAT-008 reuse pattern proven across nested transactions (PO outer txn + InventoryService inner audit). Worth strengthening in PAT-008's "Example" section with the cross-module callout.
- Minor lesson: explicit boundary cases should appear as test rows in the TDD plan, not just in the AC text — caught here at test time.

## Brain Entries Written
| ID | Type | Title | Link |
|----|------|-------|------|
| — | — | none — bar not met (this task reused existing patterns; no new lessons or decisions of brain quality) | — |

## Action items for next sprint
- **Lift `requireNonEmpty` to `src/utils/validate.ts`** — small refactor in v2 sprint.
- **Add boundary-case rows** as a checklist item in `docs/templates/REQUIREMENT-TEMPLATE.md`'s TDD Test Plan section (template improvement — capture in workflow-test report).
- Consider extending PAT-008's example to show the nested-txn case via `applyReceipt`.
