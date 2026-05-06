---
type: sprint-summary
sprint: SP1
status: done
date: 2026-05-05
tags: [sprint, erp, inventory, purchase-order, audit, workflow-test]
---

# SP1 — ERP Inventory + Purchase Order Slice (v1) (Brain Summary)

> Knowledge summary for SP1. Full output docs are in `docs/sprints/SP1/`.

## Sprint at a Glance

| Field | Value |
|-------|-------|
| Sprint ID | SP1 |
| Epic | ERP Inventory + Purchase Order Slice (v1) |
| Status | done |
| Tasks | 2 — SP1-T001 (Inventory + Audit), SP1-T002 (Purchase Orders + Approval + Receive) |
| Decisions Made | 1 — DEC-004 (two modules + shared `audit_log`) |
| Lessons Learned | 2 — LES-004 (audit-outside-transaction, from-bug), LES-005 (boundary-cases need TDD rows) |
| Patterns Discovered | 1 — PAT-008 (audit-in-transaction) |
| Tests | 67 passing, 0 failing (35 from T001, 32 from T002) |
| Issues | 1 critical (C1 in T001 — fixed via TDD, motivated PAT-008) |

## What Was Built

A small ERP slice under `tmp/erp-test/` exercising the workflow template end-to-end:

- `stock_item` + `stock_movement` + `audit_log` schemas + indexes (T001).
- `purchase_order` + `po_line` + `po_approval` schemas + indexes (T002).
- `AuditLogger` (append/list, JSON payloads, filterable). Reused unchanged across both tasks.
- `InventoryService` with `createStockItem`, `recordReceipt`, `recordAdjustment`, `applyReceipt` (cross-module entry point), `listStock`, `getStockItem`, `listMovements`. 5 typed `DomainError` subclasses.
- `PurchaseOrderService` with `createPO` (auto-approve under threshold), `approvePO`, `rejectPO`, `markReceived` (calls `applyReceipt` per line inside one outer transaction). 2 additional error classes (`IllegalTransitionError`, `PONotFoundError`).
- Inventory + PO presenter view-models with role gating (warehouse / purchasing / finance).
- 67 Vitest tests using real in-memory SQLite — including 4 PAT-008 rollback tests (1 in T001, 3 in T002).

## Key Decisions Made This Sprint

- [[../02-decisions/DEC-004-two-modules-shared-audit]] — Two domain modules sharing a common `audit_log` table. Approach A from disc-001. Sourced: `retro-sprint SP1`.

## Lessons Learned

- [[../04-lessons/LES-004-audit-outside-transaction]] (from-bug, retro-task SP1-T001) — Audit row outside the state-change transaction allows silent divergence. Found by `/code-review`, fixed via failure-injection TDD test.
- [[../04-lessons/LES-005-boundary-cases-need-tdd-rows]] (retro-sprint SP1) — Boundary cases must appear as explicit TDD plan rows; AC text alone is not enough.

## Patterns Discovered

- [[../03-patterns/PAT-008-audit-in-transaction]] (retro-task SP1-T001 → reused in SP1-T002) — Wrap state-change writes AND `audit.append` in one transaction. The pattern was born during T001's review and consumed proactively in T002 — three rollback tests (createPO, approvePO, markReceived) went GREEN on first implementation.

## Cross-Task Contract Locked

- `InventoryService.applyReceipt({stockItemId, qty, sourceId, actorId})` was designed and tested in T001 specifically to be consumed by T002's `markReceived`. The contract was stable enough that T002 made zero changes to T001 code.

## Open Questions Resolved

- Threshold boundary at exactly ฿5,000: **PENDING_APPROVAL** (`>=`, not `>`) — locked by AC-2 boundary test in T002.
- Auto-approval audit-trail symmetry: **write a `po_approval` row with `approver_id='SYSTEM'`** so the metric SQL can stay simple.

## Open Questions Carried Forward

- Configurable approval threshold — deferred to v2.
- Real auth / RBAC — deferred to v2 (currently `actorId` is free-form string, role from query param).
- Multi-warehouse, supplier catalog, GL posting — deferred per disc-001 §15 v2 scope.

## Links

- Sprint overview: `docs/sprints/SP1/SP1-overview.md`
- Sprint retro: `docs/sprints/SP1/SP1-retro.md`
- Discovery: `docs/discovery/disc-001-erp-inventory-and-purchase-order.md`
- Backlog entry: `docs/BACKLOG.md` → SP1 section
- T001 retro: `docs/sprints/SP1/SP1-T001/SP1-T001-retro.md`
- T002 retro: `docs/sprints/SP1/SP1-T002/SP1-T002-retro.md`
