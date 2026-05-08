# /sprint-report
Workflow position: **(all tasks done + /git-commit per task) → START → /retro-sprint**

Produce a stakeholder-and-QA-facing **delivery report** for a completed sprint: what shipped per task, plus a manual test checklist (golden paths, edge cases, cross-task scenarios). This is forward-facing (delivery / sign-off). It is NOT the same as `/retro-sprint`, which is backward-facing (lessons + brain capture).

Run ONCE after **all tasks in the sprint** are `done` and committed, BEFORE `/retro-sprint`.
Arguments: `[sprint-id]` — e.g. `SP1`

---

## Step 1 — Validate sprint is complete

Parse `[sprint-id]`. Read `docs/BACKLOG.md`:
- Any task in this sprint NOT `done` → STOP: "Tasks still open: [list]. Complete all before running /sprint-report."

Read `docs/sprints/[sprint-id]/[sprint-id]-overview.md` — Epic title, Sprint Goal, Stories table, Definition of Done.

---

## Step 1b — Confidence Gate

Assess confidence that you can produce a complete report from the artifacts loaded so far. Per `.claude/rules/confidence-gate.md`:

Key dimensions:
- All task requirement docs present and have explicit ACs?
- All task retro docs present (so deliverables are confirmed, not speculated)?
- For FE / fullstack tasks, `[task-id]-smoke.md` present (source of golden-path evidence)?
- Sprint overview cleanly identifies the Epic title and Sprint Goal?

**>= 90%** → proceed.
**< 90%** → STOP and emit the structured "not enough to proceed" block per the rule. Common gaps: missing retro for a task that BACKLOG says is `done` (mark BACKLOG inconsistent and ask user), missing smoke file on a FE task (the user must re-run `/testing` to generate it before `/sprint-report` can run).

---

## Step 2 — Aggregate per-task data

For every task in `[sprint-id]`, read in parallel:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — Story, ACs, Task Type, Points, Estimate, Implementation Plan (file paths), API endpoints / DB / config sections, **Out of Scope**, **Open Questions**, **Non-Functional Requirements** (use these to seed edge cases)
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md` — Estimate vs Actual, AC Coverage table (mapping AC → test file), what was actually delivered vs planned
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-smoke.md` (if FE / fullstack) — golden-path UI walkthrough already verified by `ui-verify`; reuse the steps as the manual-test golden path
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (if exists) — bugs found and fixed during the task; turn each into a regression spot-check candidate

Run `git log --oneline --no-merges --grep="[task-id]"` for each task to confirm files-changed scope, and `git diff --name-only [first-commit]^..[last-commit] -- '[task-paths]'` to enumerate the file list per task.

Collect per task:
- 1-line story (use the title from the requirement doc)
- Task Type · Points · Estimate (Xd) → Actual (Yd) (from retro)
- ACs delivered (count + list, mapped to the test that proves each)
- Files changed (top-level summary, not full list — group by FE / BE / DB / config)
- API endpoints added/changed (from requirement BE Design section)
- DB / schema changes (from requirement BE Design or migration files)
- Known limitations carried into ship (from requirement Out of Scope + retro Open Questions)
- Edge cases worth manual review (from TDD Test Plan boundary rows, NFR section, and any issue file with severity ≥ major — translate to UI/API steps)

---

## Step 3 — Identify cross-task integration scenarios

This is the part NO single task's smoke.md covers. Detect cross-task touchpoints:

1. **Shared entities** — scan all task requirement docs for shared models/tables/state (user, session, booking, cart, etc.). If two tasks both touch the same entity → cross-task scenario candidate.
2. **API consumer chains** — task A adds endpoint `X`, task B's FE calls `X` → cross-task scenario.
3. **Sequential user flows** — sprint goal often implies a flow (sign-up → confirm email → first action). If consecutive tasks each implement one stage → cross-task scenario.
4. **Background jobs / events** — task A emits an event, task B consumes it → cross-task scenario.

Produce 1–5 cross-task scenarios. Each must name:
- The user-visible flow (in plain language)
- The tasks it touches (`SP[N]-T[NNN], SP[N]-T[NNN], ...`)
- Step-by-step manual steps
- The single observable outcome that proves the integration works end-to-end

If none exist (e.g. all tasks are independent infra cleanups) → write "No cross-task scenarios — all tasks are independent." Do not invent ones to fill the table.

---

## Step 4 — Identify regression spot-check candidates

Use impact-map evidence already produced during `/implement` and `/code-review`:

- Read each task's `[task-id]-retro.md` for Tier-1/2 dependents called out by impact-map.
- Pre-existing flows whose call-graph touches a modified file are candidates.

Include up to 5 highest-risk pre-existing flows. For each: name + 1-line "why at risk" (e.g. "modifies User.save() — every signup/login path runs through this").

---

## Step 5 — Write the sprint report

Fill `docs/templates/SPRINT-REPORT-TEMPLATE.md` using the data from Steps 2–4. Save to:

```
docs/sprints/[sprint-id]/[sprint-id]-report.md
```

Section-by-section guidance:

- **Part A — Stakeholder Summary** — write Executive Summary in plain language (no jargon, no file paths). Aim for 3–5 bullets that a non-engineer Product Owner could share with leadership. The Deliverables table is one row per task with the 1-line story. The Sprint Goal — Outcome paragraph answers "did we hit the goal?" with one sentence of yes/partial/no plus one sentence of evidence.
- **Part B — Per-Task Detail** — copy the per-task block once per task. Fill the AC table from each task's retro AC Coverage data (so AC → test mapping stays consistent). Files / API / DB / config rows come from Step 2. **Known limitations** rows come from requirement Out of Scope + retro Open Questions — these are NOT bugs, they are intentional scope deferrals, and they belong in Part B (technical) not Part A (stakeholder).
- **Part C — Manual Test Checklist** — this is the QA-facing centerpiece:
  - **C.1 Per-task golden paths** — copy from each task's `[task-id]-smoke.md` if it exists. For BE-only tasks, write API-level steps (curl/Postman) instead.
  - **C.2 Per-task edge cases** — translate each task's TDD Test Plan boundary rows into manual UI / API steps. Boundary cases are mandatory per `.claude/rules/testing.md` so every task should yield ≥1 edge-case row.
  - **C.3 Cross-task integration scenarios** — from Step 3.
  - **C.4 Regression spot-checks** — from Step 4.
- **Part D — Sign-off** — leave the table blank for QA / PO / Tech Lead to fill on review. The "Bugs raised during this report" line points to issues files generated AFTER `/sprint-report` runs and QA finds new bugs (those still go through `/issue [task-id] [desc]`).

---

## Step 6 — Self-check (per `.claude/rules/self-check.md`)

Re-read `[sprint-id]-report.md` and confirm:

- [ ] **Coverage** — every task in the BACKLOG sprint table has both a Deliverables row (Part A) AND a Per-Task Detail block (Part B) AND a golden-path entry (Part C.1).
- [ ] **AC mapping** — every AC listed in Part B has a non-empty `Evidence` cell (test path or smoke.md reference). No AC left with the literal `path/to/test:LN` placeholder.
- [ ] **Edge cases present** — every task has ≥1 row in Part C.2 (boundary cases are mandatory; if a task truly has none, write "no boundary AC in this task" explicitly, do not leave the section empty).
- [ ] **Cross-task scenarios** — Part C.3 either has filled rows OR the explicit "No cross-task scenarios — all tasks are independent." sentence. Never empty.
- [ ] **No placeholders** — no `TBD`, `TODO`, `[fill in]`, `SP[N]-T[NNN]`, `[Story title]`, or empty required cells.
- [ ] **Stakeholder summary is plain language** — Part A bullets do not mention file paths, classes, methods, or commit hashes. If they do, rewrite for a non-engineer audience.

Fix any gap before reporting completion.

---

## Step 7 — Update sprint overview status

In `docs/sprints/[sprint-id]/[sprint-id]-overview.md`, append (or update) a line under metadata:

```
Sprint Report: docs/sprints/[sprint-id]/[sprint-id]-report.md — ready for QA
```

Do NOT mark the sprint itself `done` here — that is `/retro-sprint`'s job (Step 5 in retro-sprint).

---

## Output (manual mode)

```
✓ docs/sprints/[sprint-id]/[sprint-id]-report.md
✓ [sprint-id]-overview.md — Sprint Report link added

Coverage: [N/N] tasks  ·  [M] cross-task scenarios  ·  [K] regression spot-checks
```

Then end with the standard 2-option exit per `.claude/rules/completion-format.md`:

```
Next: choose one
A) Request changes — describe what to revise
B) Continue to /retro-sprint [sprint-id]
```

## Output (autopilot status line — required when invoked from `/dev`)

`> sprint-report: [N] tasks · [M] cross-task · [K] regressions  ✓`

Per `.claude/rules/autonomous-mode.md`, this is a phase boundary: emit the summary, then continue to `/retro-sprint` immediately unless one of the 3 official block reasons applies.
