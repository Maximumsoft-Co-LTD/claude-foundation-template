# SP1-T001 — Inventory + Audit Log — Retrospective

**Sprint:** SP1
**Date:** 2026-05-05
**Status:** done

---

## Estimate vs Actual
- **Estimated:** 2 days (workflow-test pace)
- **Actual:** ~0.5 day equivalent (continuous workflow-test session, no calendar gap)
- **Variance:** −1.5 days (faster than estimate; expected — meta-test pace, single contributor, no infra setup beyond minimal Node deps)
- **Velocity trend:** baseline — no prior task

## What went well
- The **TDD discipline** held throughout: every assertion was preceded by a confirmed-RED test run. Audit logger, inventory service, presenter, and the rollback-test loop all followed the cycle.
- **Real-DB integration tests** (in-memory SQLite via `freshDb`) caught the C1 transaction-boundary bug that mocks would have masked. Concrete evidence of LES-002 (mocked-vs-real-db) being correct.
- **Code review caught a real bug** (C1 — audit append outside the txn). The two-stage review (spec compliance, then code quality) put the spec pass first, then the quality scan surfaced C1 — which spec-only review would have missed.
- **Vertical-slice ownership** (per `.claude/rules/parallel-work.md`) — one owner end-to-end produced a coherent service ↔ presenter ↔ test suite. No FE/BE contract drift.
- **Cross-task contract locked early**: `InventoryService.applyReceipt` is documented in §4 and verified by a dedicated test, so SP1-T002 has a stable target.

## What could be improved
- Audit append + state mutation should live in the **same transaction by default** — a project-level pattern note would have prevented C1. Capturing as PAT.
- The requirement template forces a **lot of N/A entries** for a service-only slice (Routing, Responsive, Analytics, Caching, Event Publishing). Some structural friction with no clear adjustment.
- The PostToolUse hook is **misaligned with subprojects** — auto-installs jest/tsc at repo root and errors on missing config. Capturing as friction note for the workflow-test report.

## Issues encountered
- 1 total: 1 critical / 0 major / 0 minor
- **C1 (critical):** Audit append outside the movement transaction (R-2 violation). Found by `/code-review`, fixed via TDD with a rollback test. See [`SP1-T001-issues.md`](./SP1-T001-issues.md).

## TDD effectiveness
- Tests written before implementation: **yes** (session evidence: stub-then-test-then-impl pattern, RED confirmed for every block; commit log not yet produced because `/git-commit` runs after retro per workflow)
- Bugs caught by tests before manual QA: 1 (C1 — caught by the rollback test added in `/issue` step)
- Gaps found in TDD test plan: **none in plan**, but C1 surfaced a class of test (atomicity / failure-injection) that wasn't in the original plan — added retroactively

## AC Coverage Check
| AC | Test exists? | Test passes? | Notes |
|----|-------------|-------------|-------|
| AC-1 | yes | yes | 4 BE + 2 presenter (createStockItem returns row, audit row, recordReceipt sets on_hand, audit row, list view, detail view) |
| AC-2 | yes | yes | 2 BE + 1 presenter (adjustment on_hand math, audit payload, detail view shows STOCK_ADJUSTED) |
| AC-3 | yes | yes | 3 BE (throws NegativeStockError, no audit row, on_hand unchanged) |
| AC-4 | yes | yes | 2 BE (throws DuplicateSkuError, no extra audit) |
| AC-5 | yes | yes | 2 BE (qty=0 and qty=-1 both throw InvalidQtyError) |
| R-2 atomicity (post-C1) | yes | yes | rollback test: audit failure → on_hand+movement+audit all roll back |

- [x] All ACs have at least one passing test
- [x] No AC is "assumed passing" without a test

## Knowledge sharing
- **PAT candidate:** "Audit append must live inside the same DB transaction as the state change it records." Generalisable to any audit-logged service. Will capture in Step 4.
- **CLAUDE.md rule candidate:** the retro-task step that depends on commit log is awkward when retro runs before git-commit. Flag for `/retro-sprint` rule-promotion review.
- **Workflow-test friction batch:** captured separately in the workflow-test report (final task in the todo list).

## Brain Entries Written
| ID | Type | Title | Link |
|----|------|-------|------|
| LES-004 | Lesson | Audit row outside the state-change transaction allows divergence | brain/04-lessons/LES-004-audit-outside-transaction.md |
| PAT-008 | Pattern | Audit-in-transaction (state change + audit row in single atomic txn) | brain/03-patterns/PAT-008-audit-in-transaction.md |

## Action items for next sprint
- SP1-T002 must call `audit.append` from inside its PO state-machine transactions — explicitly verify in code review.
- Add an integration-test pattern (failure injection on a dependency) to the project test toolbox; reuse the `originalAppend` swap technique used here.
