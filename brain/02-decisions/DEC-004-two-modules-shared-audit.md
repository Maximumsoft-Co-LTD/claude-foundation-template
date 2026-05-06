---
type: decision
id: DEC-004
status: accepted
sprint: SP1
source: retro-sprint SP1
date: 2026-05-05
tags: [architecture, audit, vertical-slice, modules]
updated: 2026-05-05
---

# DEC-004 — Two Domain Modules Sharing a Common `audit_log` Table

## Status
Accepted (disc-001 Approach A → SP1 SP1-overview ADR-1 → applied).

## Context
SP1 needed both an Inventory domain (stock items + movements) and a Purchase Order domain (header + lines + state machine + approval) with full audit history across both. Discovery (disc-001) considered two approaches:

- **Option A:** Two domain modules (`inventory/`, `purchase-order/`) — independent tables, sharing only the `audit_log` table.
- **Option B:** Single unified domain with PO as the aggregate root and Inventory as an event-driven projection.

## Decision
Option A. Each module owns its own tables and exposes a service interface; cross-module needs go through that interface (specifically `InventoryService.applyReceipt` for "PO marked received → stock incremented"). The `audit_log` table is the single shared write surface — generic `(entity_type, entity_id, action, payload_json)` columns let any module append rows without coupling to the audit logger's storage choice.

## Rationale
- **Vertical-slice friendly.** SP1 split cleanly into two 5-pt tasks (T001 = Inventory + audit, T002 = PO + approval + receive). Each task could be owned end-to-end by one agent (per `.claude/rules/parallel-work.md`) with a stable cross-module contract locked at design time.
- **Testable in isolation.** Inventory tests don't import the PO module; PO tests inject `InventoryService` via constructor. Both modules' integration tests run against the same in-memory SQLite without test cross-contamination.
- **Cheap audit unification.** A generic schema avoided a per-module audit table, which would have required cross-table joins to reconstruct a PO + stock_movement timeline.
- **Easy graduation path.** When v2 lands real modules-as-services, each module already has its own service boundary; only the audit logger would need an event-bus replacement.

## Alternatives Rejected
- **Option B (unified domain + projection)** — too heavy for a 2-task slice (event bus + projection rebuild infrastructure), and stock changes from non-PO sources (manual adjustments, transfers) become awkward to model when the projection is rebuilt from PO events alone.

## Consequences
- The `audit_log` schema was designed up-front to fit both modules — `entity_type` enumerates `stock_item | stock_movement | purchase_order | po_line | po_approval` so PAT-008 (audit-in-transaction) can be applied uniformly.
- T002's `markReceived` calls `inventoryService.applyReceipt` from inside its outer transaction — this works because both services share the same `Db` instance, so better-sqlite3 transactions compose. **If we ever split modules into separate processes, this composition breaks** — that migration would also force adoption of an outbox pattern.
- One explicit cross-module interface (`applyReceipt`) is easier to evolve than a hidden coupling through a shared table. Future cross-module needs add another method, not another implicit table dependency.

## Links
- Origin: `docs/discovery/disc-001-erp-inventory-and-purchase-order.md` §11
- Sprint ADR: `docs/sprints/SP1/SP1-overview.md` ADR-1
- Companion: [[PAT-008-audit-in-transaction]] (the rule that makes the shared `audit_log` safe under concurrent-writers — currently single-writer, but the txn discipline preserves the invariant)
- Companion: [[DEC-003-vertical-slice-tasks]] (this decision satisfies that rule)
