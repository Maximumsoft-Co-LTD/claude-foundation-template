# SP1-T001 — As a warehouse staffer, I want to register stock items and record receipts/adjustments — Issues

## Summary
- **Total:** 1 issue (1 critical / 0 major / 0 minor)

---

## Issue: Audit append outside the movement transaction (R-2 violation)

**Date:** 2026-05-05
**Severity:** critical

### Description
`InventoryService.appendMovement` ran the SELECT (current row), INSERT (movement), UPDATE (on_hand) inside one `db.transaction(...)`, but called `auditLogger.append(...)` AFTER the transaction had already committed. If `audit.append` had thrown — or the process had been killed between the COMMIT and the audit INSERT — the stock change would have been persisted without the corresponding audit row, violating Rule R-2 of the requirement doc ("every state change writes exactly one audit_log row; failed calls write zero").

The same risk existed in `createStockItem`: the `stock_item` INSERT happened, then `audit.append` was called separately.

### Steps to Reproduce
1. Create stock item.
2. Replace `auditLogger.append` with a function that throws when `action === 'STOCK_RECEIVED'`.
3. Call `recordReceipt({ qty: 50 })`.
4. Observe: `getStockItem(id).on_hand_qty === 50` (committed!) but no `STOCK_RECEIVED` audit row.

### Expected
On failure of `audit.append`, the stock_movement INSERT and on_hand UPDATE must roll back. Final state: `on_hand_qty` unchanged, no movement row, no audit row beyond the original CREATE.

### Actual
`on_hand_qty` was committed to 50 before the audit append even ran; the throw left the DB in an inconsistent state.

### Root Cause
`db.transaction(() => { ... })()` was committed synchronously the moment its closure returned. The audit append was placed AFTER the closure, outside the transaction's atomicity boundary.

### Fix
Moved the SELECT, INSERTs, UPDATE, and `audit.append` ALL inside a single `db.transaction(() => { ... })()` closure for both `appendMovement` and `createStockItem`. better-sqlite3 transactions auto-rollback on any throw, so an audit failure now reverts the entire mutation.

Also addressed two minor follow-ups in the same diff:
- M1: removed redundant `sourceType === 'PO_RECEIPT' ? 'STOCK_RECEIVED' : 'STOCK_RECEIVED'` ternary.
- M2: moved the existence/balance SELECT inside the transaction, eliminating a tiny single-writer race window.

### Test Added
`src/inventory/inventory.service.test.ts` — `"rolls back movement + on_hand if audit.append throws (R-2: every state change → audit row)"` — confirmed RED before fix, GREEN after.

### Blocks
none — discovered during `/code-review` of SP1-T001 itself. SP1-T002 will benefit because it consumes `applyReceipt`, which now also has the atomicity guarantee.

### Lesson candidate?
- [x] yes  /  [ ] no — "audit append must live inside the same transaction as the state change it records" is a generalisable lesson worth a brain LES note.

### Brain entry
- `brain/04-lessons/LES-004-audit-outside-transaction.md`
- `brain/03-patterns/PAT-008-audit-in-transaction.md`

---
