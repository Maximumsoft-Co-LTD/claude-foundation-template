# SP1-T002 — Smoke walkthrough

**Skipped per Step 6a-smoke skip rule** — same reason as SP1-T001: this task ships a service layer + presenter view-model functions, with no browser-rendered UI in v1. All 10 ACs are covered by Vitest integration tests against real SQLite. The PO state-machine transitions and the cross-module `markReceived → applyReceipt` chain are exercised end-to-end at the service layer.

When v2 lands a Next.js front-end consuming `POListView` / `ApprovalQueueView` / `PODetailView`, a real `/testing` smoke walkthrough must be added.
