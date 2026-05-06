# SP1 — Sprint Retrospective

**Epic:** ERP Inventory + Purchase Order Slice (v1)
**Date:** 2026-05-05
**Duration:** 2026-05-05 → 2026-05-05 (workflow-test single session)
**Team:** Workflow-template smoke-test (single contributor, simulated)

---

## Sprint Goals Review
| Goal | Result | Status |
|------|--------|--------|
| Single source of truth for stock levels | `stock_item.on_hand_qty` is the canonical value, updated atomically with each `stock_movement`; spreadsheet replaced by SQLite source. | ✓ achieved |
| Enforce PO approval workflow with ฿5,000 threshold | createPO routes ≥ ฿5K to PENDING_APPROVAL; AC-2 + AC-3 + AC-5 cover the state machine; metric SQL query lands 0 violators. | ✓ achieved |
| Append-only audit log for stock movements + PO state changes | `audit_log` covers both entity types; PAT-008 (audit-in-transaction) ensures atomicity verified by 4 rollback tests across the two tasks. | ✓ achieved |

## Success Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Stock-count discrepancy | < 2 % / month | Deferred — measured post-deploy in real use | ~ deferred (accepted at sprint planning) |
| PO approval enforcement | 100 % of POs ≥ ฿5K require approval | Verified by AC-2 + AC-5 + boundary test at exactly ฿5,000 | ✓ achieved |
| Audit completeness | 100 % stock + PO state changes audited | Verified by AC-1, AC-2 (T001), AC-1..4 + AC-9 + AC-10 (T002) | ✓ achieved |
| Counter — PO creation time | ≤ 90 s | N/A — no UI in v1; service-level operation < 50 ms in tests | ~ deferred (no UI) |

## Velocity
| | Estimated | Actual | Variance |
|-|-----------|--------|----------|
| Total days | 4 | ~0.9 (workflow-test pace) | −3.1 |
| Tasks completed | 2 | 2 | — |
| Issues encountered | — | 1 critical / 0 major / 1 minor | — |
| Tests | 0 (greenfield) | **67 passing** (35 from T001, 32 from T002), 0 failing | — |

## What went well (across all tasks)
- **TDD discipline held** for both tasks: 67 tests written before / alongside implementation; every assertion preceded by a confirmed-RED run. Iron-law "verify RED" was honored even for the rollback-injection tests in `/issue` and AC-10.
- **PAT-008 (audit-in-transaction) born and reused in the same sprint.** Captured at T001 retro after C1 was found; immediately applied as the binding rule for T002. Three AC-10 rollback tests on T002 went GREEN on first implementation — the pattern paid for itself within hours of being recorded.
- **Cross-task contract held**: `InventoryService.applyReceipt` defined and tested at T001, called from inside T002's `markReceived` outer transaction. Nested better-sqlite3 transactions composed correctly; AC-10's `markReceived` rollback test proved the inner audit nests into the outer txn.
- **Real-DB integration tests (LES-002 reinforced).** Mocking the audit logger or the DB would have masked C1 entirely — only a real DB + real `audit.append` substitution surfaced the gap.
- **Two-stage code review caught the real bug**: Stage 1 (spec compliance) said "yes, all ACs covered." Stage 2 (code quality) found C1. Splitting the stages made the quality scan an explicit step rather than a perfunctory "looks good."
- **Brain check at /requirement Step 0 worked**: T002 picked up PAT-008 directly from MOC-Patterns and applied it from line 1 of the service.

## What could be improved (across all tasks)
- **REQUIREMENT-TEMPLATE produces N/A noise** for non-Express, non-React stacks. ~30 % of 5pt sections didn't apply to a service+presenter slice (Routing, Responsive, Analytics, Caching, Event Publishing, External Deps).
- **PostToolUse hook misaligned with subprojects** — runs from repo root, can't find the local `vitest.config.ts` or `tsconfig.json` under `tmp/erp-test/`, auto-installs Jest 30 + TypeScript 6 it doesn't need, then errors. Active hindrance, not just noise.
- **Workflow ordering glitch:** `/retro-task` Step 2 expects commit log evidence ("test commits before impl commits"), but `/git-commit` runs *after* `/retro-task`. The TDD-via-commit-trail signal is unavailable when retro asks for it. Worked around by capturing TDD evidence from session activity.
- **Branch-naming convention conflict:** `/implement` Step 0b prescribes a worktree on branch `[sprint-id]/[task-id]-[short-desc]` but the harness pinned this work to `claude/test-erp-workflow-iD5fZ`. No clean override; both commits had to flag the deviation in the body.
- **Discovery template numbering vs. command numbering mismatch** (template has 18 sections; `/discovery` Step 2 enumerates 10 topics) caused minor confusion when filling. Optional sections were marked but the structure feels fragmented.
- **Boundary cases live in AC text, not the TDD plan rows.** ฿5,000 boundary (`>=` vs `>`) was clear in AC-2's text but not carved out as its own row in the TDD plan; only got a test because I noticed it while writing.

## TDD Effectiveness (sprint-wide)
- Tasks with tests written before code: **2 / 2** (100 %)
- Bugs caught by tests before manual QA: **1 critical** (C1, T001 — the failure-injection test in `/issue` reproduced the gap deterministically before the fix; that same pattern was then preemptively applied to all of T002's transitions, catching zero further bugs but locking the contract)
- Common TDD gaps identified:
  - Boundary cases (e.g., total exactly at threshold) discovered during test-writing rather than planning
  - Cross-cutting non-functional rules (R-2: every state change → audit row) need their own dedicated test row, not just AC text — added in T002 by AC-10

## Knowledge sharing
- LES-004 + PAT-008 captured at T001 retro; PAT-008 reused at T002 implementation; updated PAT-008 example with the nested-txn case via `applyReceipt`.
- One CLAUDE.md candidate: "When a service writes a state change AND records an audit row, both writes MUST live inside the same transaction. See PAT-008." — proposed for promotion below.

## Action items for next sprint
| Action | Owner | Priority |
|--------|-------|----------|
| Lift `requireNonEmpty` to `src/utils/validate.ts` (currently duplicated in inventory + po) | dev | low |
| Add boundary-case checklist to `docs/templates/REQUIREMENT-TEMPLATE.md` TDD Test Plan section | template-owner | med |
| Update PAT-008 with the cross-module nested-txn example (markReceived → applyReceipt) | dev | low |
| Decide: hook-walk-from-edited-file or per-subproject hook config — fix `.claude/hooks/` to handle `tmp/erp-test/` correctly | template-owner | high |
| Document branch-name override semantics for `/implement` Step 0b when an outer harness pins the branch | template-owner | med |

## Definition of Done — Sprint Level
- [x] All stories are `done` (T001, T002)
- [x] All success metrics instrumented (the deferred ones are explicit deferrals, accepted at sprint planning)
- [ ] Deployed to production — N/A (sandbox / workflow-test, not a real product)
- [x] Sprint retro written (this file)
