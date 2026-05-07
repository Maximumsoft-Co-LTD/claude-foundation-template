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
| disc-002 | Kiosk Ticket Booking (self-service, no login) | backlog | 2026-05-07 | 0 | [disc-002](discovery/disc-002-kiosk-ticket-booking.md) |

---

## SP2 — Kiosk Customer Booking Flow (v1) — `planning`
> `docs/sprints/SP2/SP2-overview.md` · origin: `docs/discovery/disc-002-kiosk-ticket-booking.md`

| Task | User Story | Depends On | Points | Status | Priority | Assigned |
|------|-----------|------------|--------|--------|----------|----------|
| SP2-T003 | As a walk-in customer, I want to see today's available showtimes on a touch-friendly list so that I can pick the show I want without staff help. | — | 3 | `todo` | high | — |
| SP2-T004 | As a walk-in customer, I want to see the seat layout for my chosen showtime with available/held/booked seats clearly distinguished so that I can pick a free seat. | SP2-T003 | 5 | `todo` | high | — |
| SP2-T005 | As a walk-in customer, I want to enter my name and confirm my held seat so that the system creates a booking and atomically transitions the seat from held to booked with no double-bookings. | SP2-T004 | 5 | `todo` | high | — |
| SP2-T006 | As a walk-in customer, I want to see my ticket with a scannable QR code on the kiosk screen after confirming so that I can show it at entry. | SP2-T005 | 3 | `todo` | high | — |

---

## SP1 — ERP Inventory + Purchase Order Slice (v1) ✓ done
> `docs/sprints/SP1/SP1-overview.md` · retro: `docs/sprints/SP1/SP1-retro.md`

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
