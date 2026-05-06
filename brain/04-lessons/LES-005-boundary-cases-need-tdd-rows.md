---
type: lesson
id: LES-005
sprint: SP1
source: retro-sprint SP1
tags: [testing, tdd, requirement-doc, planning]
updated: 2026-05-05
---

# LES-005 — Boundary Cases Belong as TDD-Plan Rows, Not Buried in AC Text

## What Happened

In SP1-T002, AC-2's text said *"PO total ≥ ฿5,000 enters PENDING_APPROVAL"*. The TDD Test Plan listed one row: *"createPO ≥ threshold goes to PENDING."* The boundary case (total **exactly equal to** ฿5,000) was implied by the `≥` in the AC but never a planned test row.

I noticed it only at test-writing time, while typing the test name "createPO at exactly threshold (₿5,000) goes to PENDING (boundary)." A separate test row was added retroactively. It passed — but only because I happened to think of it; if I had not, the boundary would have been untested and the implementation could have shipped with `>` instead of `>=` without anyone noticing.

The same risk applies to other implicit boundaries: empty list (`length === 0`), single-element list, max-allowed-value, off-by-one indexes, exactly-at-rate-limit, etc. AC text often uses words like "≥", "less than", "non-empty", "before", "after" without enumerating the boundary as a separate test.

## Root Cause

The requirement template's TDD Test Plan section asks for "min 1 unit + 1 integration per AC" but does NOT prompt the author to enumerate boundaries. Authors transcribe the AC's happy-path expectation into a test row and move on.

## What Changed

- T002's TDD plan was amended to include an explicit boundary row (`createPO at exactly 5000 → PENDING (boundary >=)`). Test passed.
- Action item logged in `SP1-retro.md`: add a "Boundary Cases" checklist row to `docs/templates/REQUIREMENT-TEMPLATE.md`'s TDD Test Plan section so future authors are prompted explicitly.

## Rule Going Forward

**For every AC that contains a comparison operator (`>`, `>=`, `<`, `<=`, `!=`, `before`, `after`, `non-empty`, `exactly`), the TDD Test Plan MUST include at least one row that hits the exact boundary.** Without it, a sign error or off-by-one slips past spec-compliance review (which only checks "is there a test for AC-N?", not "is the boundary covered?").

## Links

- Source retro: `docs/sprints/SP1/SP1-retro.md` ("What could be improved")
- Related: [[CON-tdd-rules]] — Verify-RED is mandatory; this lesson extends it with "boundary rows must be planned, not improvised"
- Action: amend `docs/templates/REQUIREMENT-TEMPLATE.md`
