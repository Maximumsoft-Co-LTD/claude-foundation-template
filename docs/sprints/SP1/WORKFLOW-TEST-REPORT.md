# Workflow-Test Report — SP1 (ERP Inventory + Purchase Order slice)

> **Purpose.** This is a meta-report on running the entire `claude-foundation-template` workflow end-to-end on a real (small) project. The goal was to find friction, not to ship ERP. Final tally: **3 commits, 67 passing tests, 1 critical bug found and fixed by the workflow itself, 18 friction points worth addressing.**
>
> **Date:** 2026-05-05  ·  **Branch:** `claude/test-erp-workflow-iD5fZ`  ·  **Outcome:** workflow exercised end-to-end successfully, with notable rough edges.

---

## TL;DR

The workflow **works**. End-to-end you can go from `/discovery` to `/retro-sprint` and produce a coherent project with real tests, real bugs caught by structured review, and durable knowledge captured in `brain/`. The two highest-value features observed in practice were:

1. **Two-stage code review caught a real critical bug.** Stage 1 (spec compliance) said "yes, all ACs covered." Stage 2 (code quality) found C1 — audit append outside the transaction. Splitting them is what made the bug visible.
2. **Brain entries paid for themselves within hours.** PAT-008 was born after C1 in T001's retro and was applied proactively on T002, where 3 rollback tests went GREEN on first implementation. The *write-it-once-reuse-it-soon* feedback loop is the workflow's actual superpower.

The rough edges fall into three families: (A) **template-vs-rule contradictions**, (B) **assumptions about project shape**, and (C) **hook + tooling friction**. Details below; recommended fixes are concrete.

---

## What I built

`tmp/erp-test/` — TypeScript + Node 22 + better-sqlite3 + Vitest. No Next.js (workflow-test simplification logged in `SP1-overview.md` Change Log).

| Module | Files | Tests |
|--------|-------|------|
| `audit/` | `audit.service.ts` | 3 |
| `inventory/` | `errors.ts` + `inventory.service.ts` | 22 (incl. 1 PAT-008 rollback) |
| `po/` | `config.ts` + `errors.ts` + `po.service.ts` | 21 (incl. 3 PAT-008 rollback across createPO/approvePO/markReceived) |
| `web/` | `inventory.presenter.ts` + `po.presenter.ts` | 8 + 11 |
| `db/` | `db.ts` + `schema.sql` | 2 (smoke) |
| **Total** | 14 source + test files | **67 passing** |

Knowledge captured: 1 decision (DEC-004), 2 lessons (LES-004 from-bug, LES-005), 1 pattern (PAT-008). 2 rule promotions to `.claude/rules/testing.md`.

---

## What worked well (keep)

1. **The confidence-gate / clarification protocol.** Forcing batched-questions-or-skip is a clear win over interrogation-style Q&A. I never waited on a one-off question.
2. **`/discovery` Step 3b approach-approval HARD-GATE.** Picking Approach A explicitly meant T001 + T002 split fell out naturally as two vertical slices.
3. **`.claude/rules/testing.md` Iron Law.** "Code before test = delete it" is uncomfortable in practice but the right call. The session also exposed a second class — "code WITH test, but test only covers happy path" — which `/code-review` Stage 2 caught.
4. **`/code-review` Stage 1 + Stage 2 split.** This is the workflow's most underrated feature. I would not have found C1 with a single combined review.
5. **`/issue` TDD-fix flow.** Reproducing a bug as a failing test before fixing is the right shape. The `originalAppend = audit.append.bind(audit); audit.append = (e) => { ... }` pattern is reusable across any service-with-callback test.
6. **Brain check at `/requirement` Step 0.** T002 picked up PAT-008 directly from `MOC-Patterns.md` and applied it from line 1 of the new service. The MOC navigation rule (no full-file reads) kept token cost low.
7. **`/git-commit` Step 9 auto-next-task.** Eliminates a context-switch step. Worked correctly on the T001→T002 transition.
8. **Sprint-level brain consolidation.** `/retro-sprint` Step 6 dedup-against-task-captures was clean; LES-004 and PAT-008 were not double-written.

---

## Friction points (18 captured in order)

### Family A — template-vs-rule contradictions (highest priority)

#### F12 — `/implement` Step 2+3 contradicts `parallel-work.md` (CRITICAL)
- **What:** `/implement.md` Step 2 launches "Agent A — FE Tests" and "Agent B — BE Tests" in parallel for the same task. Step 3 does the same with FE Impl and BE Impl agents.
- **But:** `.claude/rules/parallel-work.md` says explicitly: *"❌ One agent does FE for SP1-T001, another agent does BE for the same SP1-T001."* (rule body) and *"Layer-split agents produce contracts that don't match."*
- **Effect:** Following the command violates the rule; following the rule means deviating from the command. I deviated.
- **Fix:** Reconcile. Either remove the FE/BE-parallel split from `/implement` (one-agent-end-to-end), or amend `parallel-work.md` to allow same-task FE/BE-split *only when the requirement doc has locked the contract*. I'd vote one-agent-end-to-end.

#### F2 — Example sprint scaffold contradicts current rule
- **What:** Repo ships `docs/sprints/SP1/SP1-overview.md` + `SP1-T001/{requirement,frontend,backend}.md` as illustrative examples.
- **But:** CLAUDE.md says: *"The unified doc contains story + FE design + BE design + Implementation Plan + tests — there are no separate `-frontend.md` / `-backend.md` files."*
- **Effect:** New users running `/new-sprint SP1` collide with placeholder content using the *old* doc structure. I had to delete the example to make room for the real SP1.
- **Fix:** Move example scaffolds to `.claude/examples/` (where the worked examples already live) and use the unified-doc structure. Or use a clearly non-clashing ID like `EXAMPLE-1`.

#### F3 — Example references templates that don't exist
- **What:** Example `SP1-T001-frontend.md` cites `docs/templates/FRONTEND-DESIGN-TEMPLATE.md`. Same for backend.
- **But:** Only `REQUIREMENT-TEMPLATE.md` exists in `docs/templates/`. The FE/BE templates were apparently removed when the unified-doc rule landed; the examples weren't updated.
- **Fix:** Same as F2 — clean up the example.

#### F18 — `brain/05-sprints/SP1-brain.md` ships pre-seeded with "Example Epic"
- **What:** Like F2, a real first sprint collides with placeholder content.
- **Fix:** Same. Either move to a clearly-named example slot or empty the template.

#### F17 — Branch-name convention conflict with outer harness
- **What:** `/implement` Step 0b prescribes branch `[sprint-id]/[task-id]-[short-desc]` and creates a worktree. `/git-commit` Step 3 warns when the branch doesn't match.
- **But:** When an outer harness pins a branch (this session was forced to `claude/test-erp-workflow-iD5fZ`), there is no clean override. Both T001 and T002 commits had to flag the deviation in the body.
- **Fix:** Honor an env-var or a `.claude/settings` override (e.g. `task_branch_override = current`) so the workflow respects an outer pin without warnings.

### Family B — assumptions about project shape

#### F1 — `/discovery` template numbering vs command numbering mismatch
- **What:** `DISCOVERY-TEMPLATE.md` has 18 sections; `/discovery` Step 2 enumerates 10 topics. Optional sections (Personas, Event Storming, SIPOC, Glossary) are tagged `5pt+ or complex`, but the structural mismatch makes "fill the template" feel inconsistent with "answer the 10 topics."
- **Fix:** Renumber the template to match the 10 topics (with optional sections folded inside the appropriate topic — e.g. Personas inside Users & Stakeholders).

#### F7 — `REQUIREMENT-TEMPLATE.md` produces N/A noise for non-Express/non-React stacks
- **What:** At 5pt, the template requires "All sections." For a service+presenter slice with no auth, no caching, no external deps, no analytics, no rate-limit, no real UI runtime, ~30 % of sections become `N/A — [reason]`.
- **Fix:** Group sections by *characteristics of the task* (has-auth? has-cache? has-realtime? has-UI?) rather than by point bucket alone. Authors tick boxes for "has-X" and the template only expands the relevant sections.

#### F9 — Implementation Plan template hard-codes Express-style layers
- **What:** `[BE] Plan` rows are pre-filled with "Migrations / Models / Repository / Service / Controller / Middleware." For projects without controllers/middleware (Hono, Fastify-without-classes, plain Node, Go, Rust), the rows are noise.
- **Fix:** Make the rows examples in a comment, not pre-filled. Or detect framework from `package.json` / file globs and pre-fill conditionally.

#### F10 — State Inventory + Routing assume React/UI runtime
- **What:** "Loading / Empty / Error / Success / Partial-Stale" + Routing table assume a browser/SPA runtime. For presenter functions, server actions, or BE-only endpoints, the 5-state model is forced.
- **Fix:** Mark the State Inventory section as "(if interactive UI runtime exists)." For non-interactive surfaces, replace with a "Return-Shape Inventory" (input → expected output / error variants).

#### F11 — Cross-task service contracts have no dedicated section
- **What:** T001 exposed `applyReceipt` for T002 to consume. The contract had to be wedged into "API Endpoints" + a paragraph in Out of Scope. There's no first-class "Cross-task contracts" section.
- **Fix:** Add a "Cross-task interfaces (consumed by which downstream task)" sub-section under Backend Design. T001 declares the signature; T002 references it.

#### F15 — `/testing` Step 6a strongly assumes a real browser surface
- **What:** Step 6a-smoke is mandatory for any task touching UI; the skip rule covers "BE-only / infra / non-interactive." Service+presenter (no browser yet) sits in a grey zone — I had to write a smoke.md just to log the skip.
- **Fix:** Add an explicit "view-model presenter" exemption with a one-liner that's auto-generated by `/testing` rather than user-written.

### Family C — hook + tooling friction

#### F14 — PostToolUse hook misaligned with subprojects (HIGH)
- **What:** Hook runs from repo root, doesn't walk up from the edited file's directory to the nearest `package.json`. When I edited a file under `tmp/erp-test/`, it auto-installed Jest 30 + TypeScript 6 (which neither I nor the project use), then errored looking for jest config in the repo root.
- **Effect:** Active hindrance — slow, noisy, and wrong-language tooling triggered. I had to ignore the hook output and run my own `npm test` from the right directory.
- **Fix:** Make the hook walk up from the edited file's path looking for `package.json` / `pyproject.toml` / `go.mod` / etc., and run the appropriate tool from THAT directory. If it can't find a project root, skip silently.

#### F13 — PostToolUse hook reports TDD's RED as a regression
- **What:** Every Write that lands a failing test (which is most of them in TDD) triggers the hook to report "Tests failed after editing X." The same hook fires when CI-style regressions land — there's no way to distinguish.
- **Fix:** Hook could compare test count before/after: if NEW tests appeared and only NEW tests failed, this is RED-good. If pre-existing tests now fail, it's a regression.

#### F4 — `/implement` Step 0b assumes pre-existing baseline tests
- **What:** Step 0b says "Run test suite — must be GREEN before any new code. If baseline tests are RED → stop."
- **But:** For the very first task in a greenfield project, there are no baseline tests. I had to bootstrap and write a smoke test before the workflow's "must be GREEN" precondition could be satisfied.
- **Fix:** Recognize "first task in greenfield project" — if no test config exists, skip the green-baseline check; if it exists but no tests, accept "0 tests, 0 failures" as green.

#### F6 — No mechanism for tech-stack re-baseline mid-sprint
- **What:** `disc-001` constrained the stack to "Next.js + Prisma + SQLite." During `/implement` I switched to "TS + Node + better-sqlite3" for time. I had to log the deviation in the SP1 Change Log manually; the discovery doc and Constraints sections did not auto-update.
- **Effect:** Drift between docs is invisible; future readers see the discovery's stack and the actual code's stack diverge.
- **Fix:** When a Change Log entry mentions tech-stack drift, prompt to update the discovery doc + sprint Constraints section in the same edit.

### Family D — workflow ordering nits

#### F8 — Section header inconsistency in REQUIREMENT-TEMPLATE
- **What:** Template uses `# 1 · Story & Requirements` (H1) for top-level sections. Discovery template uses `## 1. Problem Statement` (H2). Inconsistent heading levels between templates.
- **Fix:** Standardize on H2 (`##`) for top-level workflow doc sections so a doc renders as one logical document, not seven.

#### F16 — `/retro-task` Step 2 needs commit log; commit happens later
- **What:** `/retro-task` Step 2 metric "TDD adherence" reads `git log --oneline --grep="[task-id]"`. But `/git-commit` runs *after* `/retro-task` in the workflow chain, so at retro time there are no commits.
- **Effect:** I marked TDD as `yes` based on session evidence (write order during the session) rather than commit-trail evidence. Imprecise.
- **Fix:** Either reorder (commit first, retro after) or have retro accept session evidence + the *upcoming* commit's intended order.

#### F5 — `/retro-task` smoke gate doesn't recognize "presenter-only" tasks cleanly
- **What:** Hard-gate stops if Task Type is `fullstack` and `[task-id]-smoke.md` is missing. For tasks where "FE" is presenter functions (no browser), I had to write a placeholder file just to satisfy the gate.
- **Fix:** Combine with F15. If `Task Type = fullstack-presenter-only` (a new value), the smoke step + smoke-file requirement both auto-skip with a generated note.

---

## Recommended next moves (prioritized)

| # | Action | Cost | Impact |
|---|--------|------|--------|
| 1 | Fix the FE/BE parallel-agent contradiction (F12) — pick one, update both files | small | high |
| 2 | Make PostToolUse hook walk up from edited-file's dir (F14) | small | high |
| 3 | Move example sprint scaffold + brain summary out of `SP1/` slot (F2, F3, F18) | small | med-high |
| 4 | Add "view-model presenter" / non-UI Task Type that auto-skips smoke (F5, F15) | small | med |
| 5 | Reorder `/retro-task` ↔ `/git-commit`, or accept session evidence in retro (F16) | tiny | med |
| 6 | Standardize doc heading levels (F8) | tiny | low |
| 7 | Add cross-task contracts section to REQUIREMENT-TEMPLATE (F11) | small | med |
| 8 | Renumber DISCOVERY-TEMPLATE to match the 10-topic command (F1) | small | low |
| 9 | Distinguish RED-by-design from regression in PostToolUse hook (F13) | medium | med |
| 10 | Branch-override mechanism for outer-harness scenarios (F17) | small | low |

---

## Workflow scoring (subjective)

| Stage | Felt right? | Notes |
|-------|-------------|-------|
| `/discovery` | yes | Approach gate is the highlight |
| `/new-sprint` | yes | Vertical-slice gate worked |
| `/requirement` | mostly | Template heaviness is the main complaint |
| `/implement` | yes (after ignoring sub-agent split) | Iron-law TDD held |
| `/issue` | yes | The right shape for "found a bug, here's how to fix" |
| `/code-review` | **standout** | Two-stage split caught a real critical bug |
| `/testing` | mostly | Skip-rules for non-browser tasks need work |
| `/retro-task` | yes | Brain capture is rewarding |
| `/git-commit` | yes | Auto-next-task is good |
| `/retro-sprint` | yes | Dedup-against-task-captures clean |

---

## Closing observation

The workflow's biggest emergent behavior — the one that justifies the whole structure — is the **lesson-to-pattern-to-rule promotion pipeline**. C1 (a real critical bug) entered as an issue, became LES-004 (lesson) and PAT-008 (pattern) at task retro, was reused proactively in the next task within the same sprint, and was promoted to `.claude/rules/testing.md` as a permanent project rule at sprint retro. That's four levels of crystallization in less than a session. No other workflow I've seen makes that loop this short.
