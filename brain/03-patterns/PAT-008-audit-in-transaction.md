---
type: pattern
id: PAT-008
sprint: SP1
source: retro-task SP1-T001
from_bug: true
tags: [database, transactions, audit, atomicity]
updated: 2026-05-05
---

# PAT-008 — Audit-in-Transaction

## Problem

A service performs a state change (INSERT / UPDATE) and is required to record an audit row for it. If the audit-row write happens *after* the state-change transaction commits, three failure modes appear:

1. **Process death** between commit and audit insert — state change persisted, audit row missing.
2. **Audit storage failure** (transient I/O error, constraint violation in audit table) — same outcome.
3. **Inconsistent rollback semantics** — when validation throws inside the audit append (e.g. malformed payload), the state change is already committed and cannot be undone.

This silently violates the "every state change → exactly one audit row" invariant that almost every audit-logging design relies on for forensics and reconciliation.

## Solution

Wrap the SELECT / INSERT / UPDATE for the state change AND the `audit.append(...)` call inside a single transaction closure. With better-sqlite3 (and most ORMs that surface transactions), a throw inside the closure rolls the entire batch back — including the audit insert.

```ts
const txn = db.transaction(() => {
  const item = selectById.get(id) as Item;
  if (!item) throw new NotFoundError(id);
  if (item.balance + delta < 0) throw new BusinessRuleViolation();

  insertMovement.run({ ...movementRow });
  updateBalance.run({ delta, id });

  auditLogger.append({
    entity_type: 'item',
    entity_id: String(id),
    action: 'BALANCE_ADJUSTED',
    payload: { delta, after: item.balance + delta },
    actor_id: actorId,
  });
});
txn();
```

## When to Use

- The service writes a state change AND must record an audit/history row.
- Atomicity matters: the audit row is the source of truth for "what happened" (forensics, reconciliation, replay).
- The DB layer supports transactions that nest cleanly with the audit logger's writer.

## When NOT to Use

- Writing an audit row to a different store (Kafka, S3, separate DB) — those need an outbox pattern, not a local transaction.
- The "audit" is purely for ops dashboards (best-effort) and you're OK with occasional drift — but be honest about that trade-off in code comments.
- Read-only operations (no state change to atomically pair with).

## Example

See `tmp/erp-test/src/inventory/inventory.service.ts` — `InventoryService.appendMovement` and `InventoryService.createStockItem` both follow this pattern. The companion failure-injection test in `inventory.service.test.ts` ("rolls back movement + on_hand if audit.append throws") locks the atomicity contract in.

## Links

- Origin lesson: [[LES-004-audit-outside-transaction]]
- Related: [[CON-distributed-transactions]] — for cross-service variants where this pattern doesn't apply
- Related: [[CON-error-handling]] — typed error classes that interact cleanly with transaction rollback
