# Product Backlog

## Status Legend
| Status | Meaning |
|--------|---------|
| `discovery` | Active discovery session in progress |
| `backlog` | Discovery done, ready for sprint planning |
| `todo` | Planned into a sprint, not started |
| `in-progress` | Currently being worked on |
| `blocked` | Blocked by issue or dependency |
| `review` | In code review |
| `testing` | In QA/testing phase |
| `done` | Complete |

---

## Discovery Backlog

| ID | Title | Status | Date | Open Questions | Doc |
|----|-------|--------|------|----------------|-----|
| disc-001 | ERP: Inventory + Purchase Order Slice | backlog | 2026-05-05 | 2 | [disc-001](discovery/disc-001-erp-inventory-and-purchase-order.md) |

---

## SP1 — ERP Inventory + Purchase Order Slice (v1)
> `docs/sprints/SP1/SP1-overview.md`

| Task | User Story | Depends On | Points | Status | Priority | Assigned |
|------|-----------|------------|--------|--------|----------|----------|
| SP1-T001 | As a warehouse staffer, I want to register stock items and record receipts/adjustments so that the system holds a single source of truth for stock levels with a full audit trail. | — | 5 | `done` | high | Simulated dev |
| SP1-T002 | As a purchasing officer, I want to raise purchase orders that route to finance for approval when total ≥ ฿5,000 and that auto-increment stock when warehouse marks them received, so that approvals are auditable and stock stays in sync with PO activity. | SP1-T001 | 5 | `done` | high | Simulated dev |

---

## Done

| Task | Sprint | User Story | Completed |
|------|--------|-------|-----------|
| SP1-T001 | SP1 | As a warehouse staffer, I want to register stock items and record receipts/adjustments so that the system holds a single source of truth for stock levels with a full audit trail. | 2026-05-05 |
| SP1-T002 | SP1 | As a purchasing officer, I want to raise purchase orders that route to finance for approval when total ≥ ฿5,000 and that auto-increment stock when warehouse marks them received, so that approvals are auditable and stock stays in sync with PO activity. | 2026-05-05 |
