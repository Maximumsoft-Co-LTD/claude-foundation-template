# SP1-T001 — Smoke walkthrough

**Skipped per Step 6a-smoke skip rule.** This task ships a service layer + presenter view-model functions, with no browser-rendered UI in v1 (sandbox / workflow-test scope per `SP1-overview.md` Technical Constraints). All ACs are covered by Vitest integration tests against real SQLite, which run end-to-end from caller → service → DB and back through the presenter.

When the v2 Next.js front-end lands, it will render the existing `StockListView` / `StockDetailView` view-models — at that point a real `/testing` smoke walkthrough must be added.
