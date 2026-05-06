---
type: lesson
id: LES-004
sprint: SP1
source: retro-task SP1-T001
from_bug: true
tags: [database, transactions, audit, atomicity, integration-tests]
updated: 2026-05-05
---

# LES-004 — Audit Row Outside the State-Change Transaction Allows Silent Divergence

## What Happened

In SP1-T001 (Inventory + Audit Log), `InventoryService.appendMovement` wrapped the SELECT (current row), INSERT (movement), and UPDATE (on_hand) inside a `db.transaction(...)`, but called `auditLogger.append(...)` AFTER the transaction had already committed. The original test suite did not exercise the failure path of `audit.append`, so 34 tests passed despite the gap.

`/code-review` flagged the issue (C1, critical). A failure-injection test was then written: monkey-patch `audit.append` to throw on `STOCK_RECEIVED`, call `recordReceipt`, then assert `on_hand_qty` is unchanged and no movement row exists. The test went RED — confirming that `on_hand_qty` was committed even though no audit row was ever written. Fix: move `audit.append` INSIDE the transaction closure (better-sqlite3 transactions auto-rollback on any throw, including from nested `INSERT` statements).

## Root Cause

Mental model treated the audit append as "post-write logging" instead of "part of the same atomic state change." The Rule R-2 in the requirement doc said *"every state change writes exactly one audit_log row; failed calls write zero"* — that wording covers logical failures (validation, business rules) but the implementation only enforced the inverse direction (no audit on rejection). The forward direction (audit-failure → state-change-rollback) was not enforced by the code structure.

## What Changed

- `appendMovement` now wraps SELECT + INSERT-movement + UPDATE-on_hand + `audit.append` in one `db.transaction(() => { ... })()` closure.
- `createStockItem` got the same treatment for symmetry (audit append moved inside the txn).
- A failure-injection test was added to the integration suite, formalising the audit-atomicity contract as testable behavior.

## Rule Going Forward

Whenever a service writes a state change AND an audit row, both writes MUST live inside the same transaction. See companion pattern PAT-008-audit-in-transaction.

## Links

- Source issue: `docs/sprints/SP1/SP1-T001/SP1-T001-issues.md` — C1
- Related: [[LES-002-mock-vs-real-db-divergence]] (real DB caught the gap; a mocked DB would have masked it just as easily as the missing test originally did)
- Related pattern: [[PAT-008-audit-in-transaction]]
