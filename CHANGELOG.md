# Changelog

All notable changes to claude-foundation-template are documented here.

---

## [0.17.7] — 2026-05-11

### Changed
- **All 19 rule files in `.claude/rules/` now carry a uniform lean YAML frontmatter.** Each file opens with `name`, `description` (one-sentence purpose ≤150 chars), `scope` (`universal` | `path`), and — only when `scope: path` — a `paths` glob list. Previously only 4 of 19 rules had frontmatter (and those carried just `paths`); the remaining 15 had none. Universal scope (15): `autonomous-mode.md`, `brain.md`, `clarification.md`, `completion-format.md`, `confidence-gate.md`, `context7-cache.md`, `discovery.md`, `discovery-epic-mapping.md`, `metric-instrumentation.md`, `new-sprint.md`, `parallel-work.md`, `self-check.md`, `superpowers.md`, `testing.md`, `workflow.md`. Path scope (4, existing `paths` preserved verbatim): `backend.md`, `frontend.md`, `hook-authoring.md`, `skill-authoring.md`. No rule body content changed — additive metadata only (102 insertions across 19 files, 0 deletions).

### Rationale
- **Rule discoverability was uneven.** A reader (human or model) browsing `.claude/rules/` had to open every file to learn its purpose; only 4 rules carried any structured metadata, and even those only documented their file-glob scope. With every rule now declaring `name`, `description`, and `scope` in the same shape, a single `grep -h '^description:' .claude/rules/*.md` returns the whole rule catalogue, and a future hook-driven loader can act on `scope` directly instead of parsing prose. Body content was deliberately left untouched in this pass to keep blast radius minimal — no terminology unification, no de-duplication, no new index file.

---

## [0.17.6] — 2026-05-11

### Added
- **`SKILLS-SUMMARY.md` at repo root.** Single-page reference for all 25 skills in `.claude/skills/`, grouped by the five categories used in `CLAUDE.md` (Intent atom · Pre-implementation gates · Bug & quality · Delivery · Meta). Each skill row has three columns — what it does, when it triggers, which command(s) use it — so a reader can jump from "I need X" to the right skill without opening every `SKILL.md`.

### Rationale
- **Skill catalog grew to 25 with no top-level index.** The `CLAUDE.md` Atomic Skills table groups skills by category but only names them; each `SKILL.md` is detailed but local. New contributors had to read 25 files to learn the catalog. `SKILLS-SUMMARY.md` is the missing middle layer: short enough to scan in one minute, specific enough to identify the right skill for a given trigger.

---

## [0.17.5] — 2026-05-08

### Changed
- **`/dev` tightened with four plan-contract verification gates so large multi-slice tasks no longer skip steps.** The orchestrator now treats fork-returned progress as a *claim* and verifies it against the requirement doc before advancing.
  - **Fork return contract gains `task_state`.** `/requirement`, `/implement`, `/code-review`, and `/testing` forks must return `{ slices_done, slices_total, acs_with_passing_test, ui_verify }`. The orchestrator MUST verify against the requirement doc (`Execution Slices` table, AC coverage); doc wins on disagreement and the orchestrator emits a reconciliation status line.
  - **Step 5.0 dispatch decision gains `SHARED_FILE_RISK`.** Refactor / theme / token / cross-cutting intents (`refactor`, `redesign`, `revamp`, `ปรับ ux`, `ปรับ ui ทั้ง`, `migrate to`, `เปลี่ยน design`) — and sprints whose tasks declare overlapping `Planned files` rows or whose Sprint Goal mentions design tokens / theme / base components / shared layout / global state — force sequential mode. Pipeline overlap is also disabled, since the next task's implement fork would otherwise read uncommitted code from a pending-review task.
  - **New Step 5.B.3b — Slice-completeness verification gate.** After every `/implement` fork return AND before advancing to `/code-review`, the orchestrator re-reads `Execution Slices` and counts un-`done` rows. If `slices_remaining > 0`, it re-spawns `/implement` with a continuation prompt naming the remaining slices; it does NOT advance. Stuck-detection: 3 consecutive re-spawns with no progress → batch as `?` via `ask-choice` (open `/issue` for the stuck slice, re-scope via `/requirement`, or ship-without as a known limitation).
  - **Step 5.B.7 commit pre-flight gate is now four mandatory preconditions.** Slices closed (`Status: done` for every row) · review APPROVED · testing PASS with every AC ✓ and `ui-verify: PASS` for FE-touching tasks · plan-contract intact (no unresolved drift). Any precondition unmet → DO NOT commit; route to the matching recovery (re-spawn `/testing`, open `/issue`, or re-spawn `/implement` for the missing slice).
  - **`/dev resume` now reconciles state vs reality.** Re-reads each task's `Execution Slices` and AC coverage on resume; if the state file disagrees with the doc, the doc wins, the state file is overwritten, and `current_step` is rolled back if the task was advanced past `/implement` while slices were still planned. Pending review/testing forks are also reconciled against audit-log notifications.
  - **New "Plan-contract gates" recap section.** Clarifies that the slice gate, commit gate, and resume reconciliation are *internal correctness checks*, NOT the three official user-facing block conditions from `autonomous-mode.md`. They auto-recover (re-spawn / route to `/issue` / auto-`/debug`) and only escalate to `ask-choice` when recovery itself gets stuck.
  - **Six new orchestrator-level anti-patterns** spell out the failure modes each gate prevents (trusting `next_recommendation` past open slices, committing with AC ✗, parallel mode on refactor sprints, resuming without reconciliation, reporting fork's `task_state` as verified truth).

### Rationale
- **Large UX/UI refactor sprints surfaced a "fork-said-done-but-it-wasn't" failure mode.** Real dogfood: a whole-system UX/UI refactor task with 5+ slices ran under `/dev`; an `/implement` fork returned `status: ok` after closing only 3 of 5 slices, the orchestrator trusted `next_recommendation: advance to /code-review`, and `/dev` proceeded past `/implement` despite open slices in `Execution Slices`. By the time the user noticed, several tasks had committed with partial implementations. Root cause: the orchestrator had no second-source verification — it trusted the fork's claim about its own progress. The four gates make the requirement doc the authoritative second source: slice statuses, AC coverage, and `ui-verify` verdict are checked against the doc on every fork return, every commit, and every resume. The `SHARED_FILE_RISK` heuristic prevents the related failure mode where parallel/pipeline forks race on the same FE files during a refactor sprint. Net effect: `/dev` self-detects and self-recovers from incomplete work without involving the user, except when recovery itself is genuinely stuck (3 implement re-spawns without progress).

---

## [0.17.4] — 2026-05-08

### Added
- **`/sprint-report` command (`.claude/commands/sprint-report.md`).** New phase between the last task's `/git-commit` and `/retro-sprint`. Runs once after every task in a sprint is `done` and committed; aggregates per-task requirement / retro / smoke / issues docs and produces a stakeholder-and-QA-facing delivery report at `docs/sprints/[sprint-id]/[sprint-id]-report.md`. The report has four parts: A) stakeholder summary (executive bullets, deliverables-at-a-glance table, sprint-goal outcome), B) per-task technical detail (story · ACs delivered with evidence · files / API / DB / config changed · known limitations from Out of Scope + Open Questions), C) manual test checklist (per-task golden paths sourced from `[task-id]-smoke.md`, per-task edge cases sourced from TDD boundary rows, cross-task integration scenarios derived from shared entities / API consumer chains / sequential flows / events, regression spot-checks derived from impact-map evidence), and D) sign-off table for QA / PO / Tech Lead. Self-check enforces full task coverage, AC→test mapping, ≥1 edge-case row per task, explicit cross-task statement (filled or "all tasks are independent"), and plain-language stakeholder bullets. Manual mode ends with the standard A/B exit; autopilot emits the single-line status `> sprint-report: [N] tasks · [M] cross-task · [K] regressions ✓` and continues to `/retro-sprint`.
- **`SPRINT-REPORT-TEMPLATE.md` (`docs/templates/`).** Template backing the new command — Part A stakeholder summary, Part B per-task detail block (copyable per task), Part C four-section manual test checklist, Part D sign-off table.

### Changed
- **Workflow chain advances through `/sprint-report` before `/retro-sprint`.** `CLAUDE.md` command chain, `.claude/commands/_WORKFLOW-REF.md` (full flow for sequential / parallel / headless variants + commands table + docs structure tree), and `.claude/rules/workflow.md` (canonical sequence + new `Sprint report` phase-gate row between Git commit and Retro-sprint) now route through `/sprint-report` once all tasks in a sprint are `done` and committed.
- **`/retro-sprint` Step 1 hints (does not block) when no sprint-report exists.** If `[sprint-id]-report.md` is missing, retro-sprint warns the user and recommends running `/sprint-report` first so delivery / manual-test artifacts are not skipped, then continues only on explicit confirmation. Retro-sprint remains the owner of brain capture, success-metric Gate 3, and BACKLOG sprint-done status.

### Rationale
- **Sprint-level QA handoff was missing.** Per-task `ui-verify` covers golden paths inside one story, but cross-task integration (story A's endpoint consumed by story B's UI, sequential user flows that touch three tasks, shared entities mutated from multiple places) had no single source of truth before sign-off. `/retro-sprint` is backward-facing (lessons + brain) and the wrong place to put a QA checklist. `/sprint-report` is the dedicated forward-facing artifact: stakeholder visibility on top, QA checklist and regression spot-checks below, sign-off row at the bottom — all derived mechanically from artifacts the prior phases already produced (requirement docs · retros · smoke files · issues files · impact-map output).

---

## [0.17.3] — 2026-05-08

### Added
- **`CON-hexagonal-architecture` brain note (`brain/01-concepts/architecture/CON-hexagonal-architecture.md`).** Promoted Hexagonal Architecture from a sub-section of `CON-clean-architecture` to its own atomic concept note. Covers driving vs driven ports, ports & adapters folder layout, port/adapter code example, in-memory adapter test strategy (vs mocks at the port boundary), Hex vs Clean comparison, when-to-use checklist, and common mistakes. Improves discoverability for the recurring "do I want Clean or Hexagonal here?" question.

### Changed
- **`CON-clean-architecture` trimmed and re-linked.** The inline Hexagonal section is now a one-paragraph pointer to the new note; the comparison table (Layered vs Clean vs Hexagonal) stays in place as the side-by-side reference. Removed the `hexagonal` tag and added `CON-hexagonal-architecture` to `related`.
- **`MOC-Architecture-Patterns` includes the new note as a peer entry.** Added a dedicated `CON-hexagonal-architecture` row with tags + key insight + when-to-read, and extended the "How Should I Organize My Code?" decision tree with a Hexagonal branch for multi-channel / swappable-persistence cases.
- **`BRAIN-INDEX` Architecture Patterns section.** New line for `CON-hexagonal-architecture`; the `CON-clean-architecture` description no longer claims to cover Hexagonal so the two notes own non-overlapping scope.

---

## [0.17.2] — 2026-05-08

### Added
- **Skill and brain authoring guardrails.** Added `.claude/rules/skill-authoring.md` for `.claude/skills/**` edits and `.claude/rules/hook-authoring.md` for `.claude/hooks/*.py` edits so future changes inherit the current schema, trigger-boundary, and fail-safe hook conventions instead of drifting ad hoc.
- **Two new dispatcher sub-hooks.** `skill_validate.py` validates project-local `SKILL.md` edits against the active skill schema (and lightly checks `agents/openai.yaml` when present). `brain_note_lint.py` warns on missing frontmatter, dead-end MOCs, orphaned notes, and leftover placeholder text in `brain/**/*.md`.

### Changed
- **`/new-sprint` is planning-only again.** Removed the contradictory task-doc scaffolding behavior from the command and aligned references so per-task requirement docs are created by `/requirement` or Phase 1 of `/run-tasks`, not during sprint planning.
- **Sprint overview now carries `Origin` and `Sprint Goal`.** The sprint template, command flow, and workflow rule now make the sprint's why/what trace explicit: discovery doc origin, a single sprint goal, then the selected story set and estimates.
- **Testing guidance now prefers the smallest sufficient test first.** The testing rule, requirement command, and requirement template now explicitly bias toward unit/integration proof first and reserve E2E rows for critical user journeys and cross-boundary smoke.
- **Hook and architecture docs match the dispatcher runtime.** README, MOCs, and DEC-002 now reflect source-test feedback, skill validation, brain-note linting, and citation-meter routing as they actually run today.
- **README inventory and command docs are now accurate.** The README now distinguishes the active 24-skill catalog from `_archive/` reference skills, describes `.claude/hooks/` as dispatcher/audit/validation infrastructure rather than only PostToolUse linting, corrects `/debug` usage text, and fixes the `/dev` blocker count to the current three-condition rule.
- **Skill authoring checks now match real skill structure.** `plan-driven-delivery` now uses the canonical workflow/invoke/output contract, and `skill_validate.py` accepts either `## Output` or step-oriented `## Step N — Output` sections so advisory warnings stay high-signal instead of noisy.
- **Python hook cache artifacts are ignored.** `.gitignore` now ignores `__pycache__/` and `*.py[cod]`, which keeps `git status` clean after hook compile checks.

## [0.17.1] — 2026-05-08

### Added
- **`plan-driven-delivery` skill (`.claude/skills/plan-driven-delivery/`).** Turns the unified requirement doc into a task-level plan contract and aligns `/requirement`, `/implement`, `/issue`, `/code-review`, `/testing`, and `/dev` around `Execution Slices` plus `Plan Drift Guard`.

### Changed
- **Active skill metadata normalized to the current validator schema.** All 24 active skills now declare `name:` in `SKILL.md` frontmatter and no longer use the legacy `disable-model-invocation` key. Repo-local skill validation now passes cleanly across the full active catalog.
- **Workflow docs and templates are plan-driven by default.** The quick reference, requirement template, sprint overview template, workflow rule, and command docs now treat the requirement doc as the downstream source of truth instead of letting later phases infer plan state from chat history.
- **Hook and brain docs now match runtime behavior.** `README.md`, `DEC-002`, hook concept/glossary notes, and architecture/workflow MOCs now describe the real `dispatch.py` routing model, the targeted-test behavior of `run_tests.py`, and the fact that full-suite enforcement still belongs to `/testing`.

## [0.17.0] — 2026-05-07

### Added
- **`/dev` autopilot command (`.claude/commands/dev.md`).** Single-intent autonomous workflow that runs the full Inception → Sprint plan → Per-task → Sprint close pipeline end-to-end, blocking only on the three official conditions (ambiguity, destructive op, ui-verify fail). Phase boundaries are soft — they emit a 1-line marker plus brief summary and continue automatically. Manual slash commands (`/discovery`, `/requirement`, `/implement`, …) remain unchanged — `/dev` is the new autonomous entry point; the manual flow stays available for fine-grained control. Stage 3 auto-picks between `/run-tasks` (parallel) and a per-task for-loop (sequential) based on task count, tier width, risk flags (auth/payment/migration), and explicit user pacing hints. Risk-tagged tasks force sequential to preserve per-slice `ui-verify` boundaries; independent same-tier tasks parallelize.
- **15 atomic skills (`.claude/skills/`).** Twelve second-batch skills wired into the autopilot pipeline — `prompt-understand`, `ask-choice`, `solution-options`, `brain-capture`, `local-run`, `debug`, `tdd-plan`, `mongo-review`, `skill-evolution`, `agent-routing`, `session-handoff`, `pr-create` — plus three AI-DLC selective additions: `workspace-detect`, `reverse-engineer`, `nfr-plan`. Each ships with model-discoverable metadata so commands can compose them and Claude can pick them up by description match. Total skill catalog now stands at 23 with explicit references in CLAUDE.md.
- **Three new gate skills + command wiring (`bug-repro`, `impact-map`, `risk-register`).** Gaps that earlier dogfooding surfaced are now mechanical:
  - `bug-repro` — write the failing test that reproduces a bug *before* any fix code. Used by `/issue` Step 3 (replaces inline "write failing test" improvisation) and `/debug` Phase 4 (steps 1–2). Distinct from `tdd-plan` (new features) — this targets regressions.
  - `impact-map` — given a planned change, mechanically enumerate Tier-1 (direct callers), Tier-2 (indirect dependents), Tier-3 (external consumers like webhooks/mobile/OpenAPI). Surfaces contract changes that "just rename this field" usually misses. New `/implement` Step 1e runs it always (unless greenfield-within-brownfield); `/issue` Step 2 runs it after root cause located; `/code-review` Step 2a checks coverage.
  - `risk-register` — categorize change (data/auth/payment/api/perf/security/observability), apply checklist, attach mitigation + rollback. Required for migrations and high-risk surfaces. `/implement` Step 1e runs it conditionally; `/code-review` Step 2b verifies evidence + rollback plans for must-mitigate rows.
  - `/code-review` now treats missing `impact-map` coverage or missing `risk-register` verification on a Must-mitigate row as an automatic Critical finding.
- **Metric-instrumentation rule (`.claude/rules/metric-instrumentation.md`) — 3-gate enforcement.** Closes the "metric target without measurement" gap surfaced during the `/dev` SP2 dogfood. Gate 1 (`/new-sprint` Step 3b): the Success Metrics table must name a concrete data source, a query/aggregation, and the task that produces the artifact — vague cells (`manual check`, `TBD`) block. Gate 2 (`/requirement` Step 2c self-check): for each metric whose Measurement references THIS task, the requirement doc must include an Implementation Plan row producing the artifact, an AC asserting emission, and a TDD row verifying it. Gate 3 (`/retro-sprint` Step 3): produces a row per metric with Actual + Source-artifact + run-the-query evidence; "not measured" auto-creates an Action Item and marks the DoD line failed. One-shot manual counts allowed only when artifact + ownership + replacement-debt are explicit.
- **Audit-log hook (`.claude/hooks/audit-log.py`).** UserPromptSubmit + PreToolUse-Bash + Stop hook that writes a per-day compliance trail to `docs/audit-YYYY-MM-DD.md`. Catches destructive Bash patterns (`rm -rf`, force push, `drop*`, `deleteMany`, `truncate`, `docker rm -f`) and sensitive-file writes (`.env`, `credentials.json`). Hardened parsing: silent exit on malformed stdin, 2-second `git` timeout, always emits valid JSON to stdout per Claude Code hook protocol. `redact()` helper scrubs `api_key` / `token` / `password` / `Bearer` / JWT / AWS-AKIA / URI-creds → `[REDACTED]` before any value is written, since audit files can be committed. `docs/audit-*.md` is now gitignored as a runtime artifact.
- **Autonomous-mode and completion-format rules (`.claude/rules/`).** `autonomous-mode.md` codifies the three (and only three) reasons to block in autopilot (ambiguity / destructive op / ui-verify fail), the explicit Forbidden phase-boundary outputs list (no `Press enter to continue`, no `type pause to stop`, no continuation-confirm prompts of any kind), the mandatory `> [skill-name]: [≤60 char status] [marker]` status-line format, ambiguity batching (skills emit `?` and let `/dev` batch into one `ask-choice` call), and the resume protocol. `completion-format.md` standardizes phase-boundary and artifact-step exits to a 2-option `A) Request changes — describe what to revise / B) Continue to [next-step-name]` template — no third options, no open-ended menus. Both rules apply across all 23 skills.
- **CLAUDE.md atomic-skills catalog.** New "Atomic Skills" section after the Workflow command chain — 5-row category table grouping the 23 skills by purpose (Intent atom · Pre-implementation gates · Bug & quality · Delivery · Meta), a callout for the three new gates with their trigger and command-position, and a note that `/code-review` treats missing `impact-map`/`risk-register` artifacts as Critical findings. Compact (table form, no per-skill descriptions) — full details remain in each `SKILL.md`.

### Changed
- **Skill `allowed-tools` lists corrected.** Nine skills declared tools their own steps required but had not been listed: `ask-choice` (+ `AskUserQuestion`), `local-run` (+ `diff`/`grep`/`sort`/`cp`/`node`/`tail`), `pr-create` (+ `npm`/`yarn`/`pnpm`/`go test/vet/build`/`pytest`/`ruff`/`python` + `mcp__github__subscribe_pr_activity`), `release-notes` (+ `git describe`/`add`/`status`), `reverse-engineer` (+ `stat`), `session-handoff` (+ `git branch`/`add`/`commit`/`push`), `ui-verify` (+ `go test/vet`/`pytest`/`ruff`), `vertical-slice` (+ `Edit`/`Write` — Step 6 appends to requirement doc), `workspace-detect` (+ `git log`).
- **`prompt-understand` autopilot threshold 70% → 90%.** Now matches the confidence-gate matrix and `autonomous-mode.md`.
- **`solution-options` Step 5 split.** Manual mode invokes `ask-choice`; autopilot mode emits `?` and lets `/dev` batch — per `autonomous-mode.md`.
- **`brain-capture` Step 5 MOC mapping.** Added the missing `CON → MOC-Concepts.md` row.
- **`ui-verify` package-manager detection.** Reads lockfile (`pnpm-lock.yaml` / `yarn.lock` / `package-lock.json`) instead of hardcoding `npm`.
- **`/code-review` impact-map gate.** "Missing → Critical" now matches `/implement` Step 1e trigger and the `/issue` purely-local-fix exemption — was previously over-blocking.

### Fixed
- **Audit-log hook always emits JSON.** Previously `sys.exit(0)` on stdin parse failure violated the Claude Code hook protocol. Now always emits a valid JSON envelope, even on malformed input.
- **Audit-log secret leakage.** Raw API keys, tokens, JWTs, and URI credentials could be written into `docs/audit-*.md` if they appeared in user prompts or tool inputs. The new `redact()` helper scrubs them before any value is appended.

### Removed
- **Test/dogfood docs.** `docs/sprints/SP1/` (ERP inventory + purchase order workflow-test, including `WORKFLOW-TEST-REPORT.md`), `docs/sprints/SP2/` (kiosk ticket booking `/dev` autopilot test), `docs/discovery/disc-001-erp-inventory-and-purchase-order.md`, `docs/discovery/disc-002-kiosk-ticket-booking.md`. The matching ERP source code at `tmp/erp-test/` was already removed in 0.16.x cleanup. `docs/BACKLOG.md` reset to the empty-template state. Lessons learned from these dogfood sessions live in `brain/04-lessons/` (LES-004, LES-005) and the rule promotions they produced (`testing.md` Iron Law, audit-in-transaction pattern, metric-instrumentation rule).

### Rationale
- **Autopilot `/dev`:** the manual command chain (`/discovery → /new-sprint → /requirement → … → /retro-sprint`) is precise but slow when the user just wants the workflow to run. `/dev` runs the same chain unattended, blocks only on the three conditions worth a human (ambiguity / destructive op / ui-verify fail), and emits one status line per skill so the user can read the audit trail without opening a terminal pane. Manual commands keep working unchanged for users who want fine-grained control.
- **Three new gates:** the SP1 ERP dogfood found that `/code-review` Stage 2 caught a critical bug (audit append outside the transaction) only because two-stage review forced quality scrutiny — but two-stage review is *reactive*. `bug-repro`, `impact-map`, `risk-register` make the same scrutiny *proactive* — the failing test, the dependents map, and the rollback plan are produced before code lands, not after. This is the gap that `/implement` Step 1e and `/code-review` Step 2a/2b now close.
- **Metric-instrumentation rule:** the SP2 kiosk dogfood had a "median time-to-ticket ≤ 90s" metric with no corresponding log line or query — it was unmeasurable from day 1. The 3-gate rule prevents that pattern: target → instrumentation in code → query → actual must form a closed loop, or the metric is wrong (delete it) or the task is wrong (add the AC).
- **Audit-log hook:** AI-DLC requires a per-prompt + per-tool-call compliance trail. Doing it in a hook keeps the trail tamper-evident (Claude can't write the file from a tool — only the hook process can) and out of the working transcript. Secret redaction is non-negotiable since the file is committed.
- **Test docs removal:** dogfood sprints proved the workflow end-to-end and produced LES-004 / LES-005 / PAT-008 / DEC-004 in the brain (the durable artifacts). The sprint docs themselves served their one-time purpose and were leaking ERP-specific noise into a generic template — clones of the template were inheriting fictional ERP product backlog rows.

---

## [0.16.0] — 2026-05-06

### Added
- **PostToolUse hook dispatcher (`.claude/hooks/dispatch.py`).** A single dispatcher entry in `.claude/settings.json` replaces the previous 5-entry hook array. It routes Write/Edit events to the relevant sub-hooks (language linters, `run_tests.py`, `brain_citation_meter.py`) based on the edited file path and runs them in parallel via a thread pool. Wins: source linters never run on docs/brain/`.claude/` edits, sub-hooks parallelize instead of running sequentially, and adding a new linter is one `if` in the dispatcher.
- **Sprint-scoped context7 cache (`.claude/rules/context7-cache.md`).** All commands that fetch library docs (`/requirement`, `/implement`, `/code-review`, `/testing`, `/debug`, `/issue`) now check `docs/sprints/[sprint-id]/.context7-cache.json` before calling MCP. Cache key is `<library>::<normalized-query>`. `/retro-sprint` Step 5b deletes the cache at sprint close so stale docs don't poison the next sprint.
- **Discovery scenario templates (`docs/templates/discovery-scenarios/`).** `/discovery` Step 1 now picks one of four scenario types — `new-feature` / `refactor` / `bug-investigation` / `integration` — and reads the matching prompt template (`NEW-FEATURE.md` / `REFACTOR.md` / `BUG-INVESTIGATION.md` / `INTEGRATION.md`). The 10-topic structure stays constant; only the per-topic prompts change per scenario.
- **Discovery → epic mapping rule (`.claude/rules/discovery-epic-mapping.md`).** Codifies the contract between `/discovery` and `/new-sprint`: every sprint must trace back to a discovery doc and an explicit epic row, shared entities are owned by the first epic that introduces them, no orphan sprints. `/new-sprint` now writes `Origin: docs/discovery/[disc-id]-[name].md` into the sprint overview, and `/discovery` enumerates an Epic Breakdown table with `Depends On` cells when `Estimated sprints > 1`.
- **Parallel work rule (`.claude/rules/parallel-work.md`).** Authoritative statement that the unit of split for parallel sub-agents is one user story per agent — never one layer per agent. Layer-split agents produce contracts that don't match (FE invents request shape, BE invents response shape, neither converges). `/run-tasks` Step 1 references this rule directly.
- **Worked examples (`.claude/examples/`).** Three reference docs commands can point users at when filling templates: `example-discovery.md` (single-epic OAuth), `example-sprint-overview.md` (three vertical-slice stories), `example-requirement.md` (3-pt fullstack story with full BE design + Implementation Plan + TDD plan). Linked from `/discovery`, `/new-sprint`, `/requirement`.
- **FE smoke walkthrough gate.** `/testing` Step 6a-smoke walks the running UI for every AC in a real browser via `mcp__claude-in-chrome__*` — visual correctness, all 5 State Inventory states, transition smoothness — and writes `[task-id]-smoke.md` with screenshots. `/retro-task` Step 1 HARD-GATEs on this file existing for `fullstack` / `fe-only` tasks. BE-only / infra tasks write a one-line skip note so the file always exists.
- **Plan size advisory in `/requirement`.** When `Points >= 5` and no `[task-id]-plan.md` exists, the self-check prints a warning recommending `/write-plan` before `/implement`. Advisory only — does not block proceeding.
- **Persisted debug records (`docs/templates/DEBUG-TEMPLATE.md` + `/debug` Phase 5).** When `/debug [task-id] [desc]` is run inside a sprint, it writes `docs/sprints/[sprint-id]/[task-id]/[task-id]-debug.md` with sections Symptom / Reproduction / Root Cause / Fix / Tests Added / Lessons. Multiple debug rounds in the same task append `## Incident — [ISO date]` blocks instead of overwriting. `/retro-task` Step 1 now reads this file alongside the issues file.
- **Issue template gains a "Lesson candidate?" + "Brain entry" field (`docs/templates/ISSUE-TEMPLATE.md`).** `/retro-task` Step 4 reads the lesson-candidate flag to know whether to offer a `LES-` capture, and writes the resulting brain note path back into the issue's Brain entry field. Issues with `Severity: critical` or `Severity: major` set `from_bug: true` in the brain note's frontmatter so future audits can filter "lessons from bugs" vs. "lessons from features."

### Changed
- **Brain access narrowed across `/discovery`, `/brainstorm`, `/requirement`, `/implement`.** Each Step 0 now opens MOCs only when the task / story-points warrant it (e.g. `MOC-Frontend.md` only when Task Type includes FE; `MOC-Lessons.md` only when `Points >= 5` AND a keyword overlap exists). Reads stop at 1–3 relevant notes — never the full MOC, never multiple MOCs unconditionally. Each command prints a one-line summary of what it pulled (e.g. `Brain: reusing PAT-006, avoiding LES-012`).
- **`/code-review` Workflow position label.** Was `/issue (loop) → START → /testing` (misleading — code-review is the normal step after `/implement`); now `/implement (or /issue from prior loop) → START → /testing`.
- **`/debug` argument notation.** Was `[task-id?] [description]` (non-standard); now `[task-id] [description]` with the optional-when-omitted rule stated in prose, matching the convention used by `/next-task`.
- **`/run-tasks` Phase 2 note.** Added the FE smoke gate caveat: the Quality Reviewer agent is responsible for executing `/testing` Step 6a-smoke and producing `[task-id]-smoke.md` for fullstack/fe-only tasks. If missing, the retro-task agent will return BLOCKED and the user must run `/testing` manually before re-invoking retro.
- **`/retro-task` Step 1.** Now also reads `[task-id]-smoke.md` (when present) and `[task-id]-debug.md` (when present) alongside the requirement and issues docs, so the retro reflects FE smoke evidence and any debug rounds without re-discovery.
- **README "Step 3 — Configure hooks for your stack."** Rewritten for the single-dispatcher model — describes which sub-hooks the dispatcher routes to, how it skips docs/.claude edits, and how to add a new sub-hook (one `if` in `dispatch.py`).

### Fixed
- **`REQUIREMENT-TEMPLATE.md` Status field enum.** Was `todo / in-progress / in-review / done`; now `todo / in-progress / review / testing / done` — matches the actual lifecycle in `_WORKFLOW-REF.md` and the statuses set by `/code-review` (`review`) and `/testing` (`testing`). Discovered while doing an end-to-end CLI todolist test against the workflow.
- **`/implement` Step 1 section extraction table.** Two errors:
  - referenced `### [FE] Subtasks` / `### [BE] Subtasks` as headings — they are bold paragraphs inside `### [FE] Plan` / `### [BE] Plan`, not headings. The extractor would have returned empty content for large requirement docs.
  - referenced `## [FE] Scope` / `## [BE] Scope` — actual heading level is `### [FE] Scope` / `### [BE] Scope` under `## Scope Overview`.
  Fixed both. The `### ... Plan` extraction already includes the subtask checkboxes, so no separate row is needed.
- **`/run-tasks-p` `extract_section` awk.** The previous pattern `^## ${SECTION}` only matched level-2 headings, silently returning empty content when asked for level-1 sections like `# 3 · Frontend Design` or `# 4 · Backend Design`. For requirement docs over 6000 chars, this meant agents received empty design context and produced incorrect output. New awk records the level of the matched heading and stops at the next heading of equal or shallower depth, so it works for `# `, `## `, and `### ` consistently.
- **`run_tests.py` vitest detection.** Previously vitest was only detected via `vitest.config.*` — projects that listed vitest in `package.json` `devDependencies` (with no config file) silently fell back to jest and failed with "Option `testPathPattern` was replaced by `--testPathPatterns`." The detector now also reads `package.json` scripts/deps/devDeps for the string `vitest`. Updated the jest fallback flag to `--testPathPatterns` (Jest 30+).
- **`run_tests.py` test filter on macOS.** Vitest/Jest filters match by substring against the in-process file path. The hook was passing the absolute path (`/tmp/...`), which on macOS resolves to `/private/tmp/...` after symlink expansion, so the filter never matched and the runner exited with "No test files found." The hook now relativizes the path against `os.getcwd()` whenever the file is inside the project — works across symlink boundaries.

### Removed
- The 5 separate hook entries (`lint_go.py`, `lint_ts.py`, `lint_js.py`, `run_tests.py`, `brain_citation_meter.py`) from `.claude/settings.json`. Their behavior is preserved through `dispatch.py` and they remain available as sub-hooks invoked by the dispatcher. Existing forks that customized `settings.json` should re-run `install.sh` (which JSON-merges) or replace the array manually with the single dispatcher entry.

### Rationale
- **Dispatcher:** the previous 5-hook chain ran every linter on every Write/Edit, including docs and `.claude/` config — Go's linter would fire when editing a Markdown file. The dispatcher gates on file extension and project area before spawning anything, and parallelizes the calls that do need to run. Net effect: hooks are noticeably faster on docs-heavy sessions and silent on non-source edits.
- **Context7 cache:** during a 5-task sprint, `/requirement` × 5 + `/implement` × 5 + `/code-review` × 5 was firing 30–45 MCP calls fetching essentially the same docs for the same libraries. Sprint-scoped cache cuts that to ~3–5 first-fetch calls and lets later commands hit cached entries. Cache wipes at `/retro-sprint` so a new sprint always pulls fresh docs.
- **Discovery scenarios:** the same 10-topic skeleton was wrong for refactors (no "users") and bug-investigations (no "to-be journey"), forcing the operator to mentally translate. Per-scenario prompt templates keep the structure constant but ask the right question per topic.
- **Smoke walkthrough gate:** E2E tests assert logic but don't catch wrong copy, broken layout, or jarring state transitions. The smoke walkthrough fills that gap, and persisting evidence in `[task-id]-smoke.md` lets `/retro-task` and audits verify the walkthrough actually happened. The retro HARD-GATE prevents tasks closing on green tests + bad UX.
- **Test detection / filter fixes:** found by running an end-to-end workflow on a fresh CLI todolist project. Both bugs were silent — they made the auto-test hook a no-op, defeating the TDD enforcement the template advertises. Fixing detection at the `package.json` level + relativizing the path makes the hook work on any project layout vitest supports, on Linux and macOS alike.

---

## [0.15.0] — 2026-04-29

### Added
- **Brain citation meter — read-only dashboard for measuring brain ROI.**
  - New slash command `/brain-meter` shows how many times each brain note has been cited inside workflow output docs (`docs/sprints/`, `docs/discovery/`). Runs in dashboard mode by default; pass a prefix (`/brain-meter CON`) to drill into the full uncited list for that type.
  - New PostToolUse hook `.claude/hooks/brain_citation_meter.py` registered in `.claude/settings.json` — runs on every Write/Edit, scans the doc for brain note references (`CON-foo`, `PAT-001`, `DEC-003`, etc.), and increments per (note_id, doc_path) pairs at most once so re-edits don't inflate the metric. `lastCitedAt` refreshes on every edit that still contains the reference.
  - State persists in `brain/.metrics/citations.json` (gitignored via `brain/.metrics/.gitignore` — only the `.gitignore` itself is tracked, so the directory exists in fresh checkouts but per-project counts stay local).
  - The dashboard surfaces ONE actionable insight per run, prioritised: stale high-value DEC/PAT/LES notes never cited → bloated CON/GLO with low coverage → "brain used effectively, no action" → empty meter recommends running `/discovery` to seed citations.
  - Failures in the hook are swallowed silently — the meter must never block a tool call.
- **25 orphan brain notes brought under version control.** These were referenced from `BRAIN-INDEX.md` and several MOCs (Workflow, Data, Developer, DevOps, Infrastructure, Patterns) but had never been `git add`-ed. Adding them now closes every dangling `[[CON-…]]` / `[[PAT-…]]` link the audit pass surfaced.
  - Workflow concepts (9): `CON-bite-sized-tasks`, `CON-brain-access-protocol`, `CON-claude-code-hooks`, `CON-claude-code-skills`, `CON-confidence-gate`, `CON-mcp-integration`, `CON-self-check-rule`, `CON-two-stage-review`, `CON-verification-before-completion`.
  - Data deep-dives (5): `CON-cap-acid-base`, `CON-database-indexing`, `CON-database-types`, `CON-distributed-transactions`, `CON-replication-sharding`.
  - Developer paradigms (3): `CON-concurrency-parallelism`, `CON-functional-programming`, `CON-oop-fundamentals`.
  - DevOps (3): `CON-feature-flags`, `CON-secrets-management`, `CON-trunk-based-development`.
  - Infrastructure (2): `CON-load-balancing`, `CON-storage-types`.
  - Patterns (3): `PAT-005-subagent-driven-development`, `PAT-006-worktree-isolation`, `PAT-007-headless-parallel-agents`.

### Rationale
- **Brain-meter:** a knowledge vault is only useful if anyone actually consults it during work. Without a citation meter, there's no signal whether `/discovery`, `/requirement`, `/implement` are pulling on brain notes — or whether the vault is dead weight. The hook records citations passively (zero workflow change), the dashboard surfaces them on demand, and the single-insight rule prevents the meter from becoming yet another noisy report.
- **Orphan brain notes:** the 0.14.2 audit found that BRAIN-INDEX listed many notes as `[[CON-…]]` links pointing at files that existed on disk but were untracked in git. New clones of the template were missing 25%+ of the brain content the index advertised. Tracking them resolves every dangling link.

---

## [0.14.2] — 2026-04-29

### Added
- **Task-level brain capture in `/retro-task` with sprint-level dedup.** `/retro-task` now captures brain entries while task context is fresh instead of waiting for `/retro-sprint`. The bar is intentionally high — most tasks produce zero entries; only genuinely reusable lessons / decisions / patterns / glossary terms get captured.
  - Notes written by `/retro-task` carry `source: retro-task <task-id>` in their frontmatter.
  - `/retro-sprint` Step 6 reads those entries first, dedupes against them, and consolidates the full sprint summary plus CLAUDE.md rule promotions in one pass — no separate brain-update command needed.
  - `RETRO-TASK-TEMPLATE.md` gained a **Brain Entries Written** table so the dedup pass at sprint end is readable at a glance.
  - `/retro-task` was simultaneously revised: confidence gate added, computed metrics block (estimated vs actual story points, variance %, AC coverage %, TDD adherence), explicit self-check step, one-line metrics summary in the output.
- **Three new backend concept notes filling identified gaps in the brain.**
  - `brain/01-concepts/backend/CON-message-brokers.md` — technology comparison (Kafka vs RabbitMQ vs SQS vs NATS vs Redis Streams), log-vs-queue mental model, outbox pattern, partition key design, anti-patterns. Complements `CON-async-patterns` (which stays at the pattern level).
  - `brain/01-concepts/backend/CON-graphql.md` — schema/resolvers, the N+1 problem and DataLoader fix, Relay cursor pagination, mutations with payload errors, federation, performance/security hardening (depth limit, cost analysis, persisted queries).
  - `brain/01-concepts/backend/CON-grpc.md` — Protobuf, the four RPC types (unary, server-stream, client-stream, bidi), schema-evolution rules (tag numbers are forever, reserve removed tags), deadlines and cancellation, gRPC-Web, operational concerns (load balancing, health checks, observability).

### Fixed
- **`_WORKFLOW-REF.md` synced with actual commands.** Added `/status` (its command file existed but the reference table didn't list it) and removed `/create-pr` (listed twice in the table but no command file ever existed — only the `pr-create` skill is real). All entries now map 1:1 to `.claude/commands/` or `.claude/skills/`.
- **Stale references across MOCs.**
  - `MOC-Workflow.md` — removed obsolete `/design fe` and `/design be` commands (folded into `/requirement` since 0.14.1) from Core Flow and Command Reference; added missing `/run-tasks-p`; fixed `/write-plan` description to point at `/requirement` instead of `/design be`.
  - `MOC-Frontend.md` — workflow tip rewritten to point at the FE Design section of `/requirement`.
  - `MOC-Data.md` — removed `(when added)` / `(future)` markers for notes that already exist (`CON-database-patterns`, `CON-scalability-patterns`, `CON-caching-strategies`, `CON-backend-layers`); added pointer to new `CON-message-brokers`.
  - `MOC-Backend.md` — restructured into four sub-sections (API & Layering, Data & Persistence, Async & Real-time, Security & Limits) and added missing links to existing notes (`CON-api-security`, `CON-rate-limiting`, `CON-websockets-realtime`, plus the three new backend notes).
  - `MOC-Patterns.md` — added `PAT-005-subagent-driven-development`, `PAT-006-worktree-isolation`, `PAT-007-headless-parallel-agents` to the table and Workflow Patterns category (previously listed in BRAIN-INDEX but missing from this MOC).
  - `MOC-SDLC.md` — corrected "6 phases" → "7 phases" (the phase list was already 7).

### Changed
- `CLAUDE.md` — Brain section updated to describe the new dual-layer capture flow: "`/retro-task` Step 4 captures task-level entries (high-bar, optional — most tasks produce zero) and `/retro-sprint` Step 6 consolidates sprint-level entries with dedup against task captures."
- `BRAIN-INDEX.md` — Backend section reorganized to include the three new notes and call out CON-async-patterns as pattern-level vs CON-message-brokers as technology-level. Cross-Domain Link Map gained three new entries (`graphql`, `grpc`, `message-brokers`). Total concept-note count corrected from `98 → 109` (the prior count had drifted from the actual file tree).

### Rationale
- **Task-level brain capture:** waiting for `/retro-sprint` to write everything meant context was 1–3 weeks stale for early-sprint tasks; capturing at task time uses fresh memory while the dedup mechanism (`source: retro-task <id>`) prevents the sprint-level pass from double-writing.
- **Brain audit:** a pre-flight pass found three classes of decay — stale workflow references (`/design fe` / `/design be` were removed in 0.14.1 but several MOCs still mentioned them); "to be added" placeholders pointing at notes that had since been created; MOCs missing links to notes that already lived in their domain folder. The fix was mechanical (rewrite the references) plus three deep-dive notes for queue technology, GraphQL, and gRPC — three topics that other notes referenced repeatedly but had no canonical home.

---

## [0.14.1] — 2026-04-23

### Changed (breaking)
- **Unified requirement doc — one file per task.** Merged `REQUIREMENT-TEMPLATE.md` + `FRONTEND-DESIGN-TEMPLATE.md` + `BACKEND-DESIGN-TEMPLATE.md` into a single `REQUIREMENT-TEMPLATE.md` that contains story, ACs, FE design (Section 3), BE design (Section 4), Scope Overview, Implementation Plan with subtask checkboxes, and TDD + E2E test plans.
  - New `Task Type` field in Metadata: `fullstack / fe-only / be-only / infra`. FE design sections are skipped (marked `N/A — BE-only task`) for be-only tasks; BE design sections skipped for fe-only; both skipped for infra.
  - One doc per task: `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`. No more `*-frontend.md` / `*-backend.md` files.

### Removed
- **`/design` command deleted** — its logic now lives inside `/requirement`. Users should not run `/design fe` or `/design be` anymore.
- **`FRONTEND-DESIGN-TEMPLATE.md` and `BACKEND-DESIGN-TEMPLATE.md` deleted** — their content is absorbed into the unified `REQUIREMENT-TEMPLATE.md` with `[FE]` / `[BE]` tagging.
- Workflow chain simplified: `/discovery → /new-sprint → /requirement → /implement → ...` (was `/discovery → /new-sprint → /requirement → /design fe → /design be → /implement → ...`).

### Updated
- `/requirement` command rewritten to produce the unified doc: detects `Task Type`, explores FE and/or BE codebase accordingly, fetches context7 docs for relevant libraries, fills all sections (FE design, BE design, Implementation Plan with subtasks, TDD + E2E) in one pass, one confirmation gate at the end.
- `/implement` now reads **one** `DOC_REQ` instead of three. Section-extraction map updated to point at unified sections (`# 3 · Frontend Design`, `# 4 · Backend Design`, `### [FE] Plan`, `### [BE] Plan`, etc.). Sub-agent spawning still runs FE/BE in parallel via `HAS_FE`/`HAS_BE` flags derived from `Task Type` and the TDD Test Plan rows.
- `/run-tasks` + `/run-tasks-p` Phase 1 collapsed from three steps (requirement → design fe → design be) to one (requirement with FE+BE design baked in). Cross-task alignment now reads API Contracts/Endpoints from the unified doc sections.
- `/code-review`, `/testing`, `/retro-task`, `/issue`, `/write-plan`, `/execute-plan`, `/next-task`, `/status`, `/git-commit` updated to reference only the unified `[task-id]-requirement.md`.
- `_WORKFLOW-REF.md`, `CLAUDE.md`, `README.md`: workflow chain, docs structure, points tiers, skill integration points, confidence-gate list, and quickstart examples all updated for the unified model.
- Skills that referenced design docs (`/adr`, `/db-schema-review`, `/accessibility-review`, `/test-coverage`, `/pr-create`, `/session-handoff`) now point at the unified requirement doc's relevant section.

### Rationale
Three separate files for every task produced sprawl without benefit: a story is a vertical slice, so its design is one design. The unified template still uses `[FE]` / `[BE]` tags and point-scoped sections so FE-only and BE-only stories don't carry dead sections, but the *document boundary* matches the *story boundary*. Sub-agent parallelization (separate FE/BE agents in `/implement`, `/run-tasks`) is unchanged — they now slice the one doc by section instead of reading different files.

---

## [0.14.0] — 2026-04-22

### Added
- **`install.sh` bootstrap script** — one-step install of the workflow into a target repo. Replaces the prior `/plugin install` flow. Default mode clones from GitHub; `--local [src]` uses a local clone.
  - Runs **before** Claude Code knows about the target repo, so it is a shell script — not a slash command.
  - One-liner: `curl -fsSL .../install.sh | bash -s -- ~/path/to/target-repo`.
  - Scans target stack (Node/Python/Go/Rust/PHP/Ruby/JVM), FE/BE/tests roots, git branch & commit conventions, README content.
  - Diff preview per category — for each of `.claude/commands/`, `rules/`, `hooks/`, `skills/`, `brain/`, `docs/templates/`, lists `+new`, `~changed`, `=same`, and `·custom-kept` counts (with filenames) before any write.
  - Safe merge — `cp -rn` policy; never overwrites existing `brain/` notes, `BACKLOG.md`, or `CLAUDE.md`.
  - **JSON-aware `settings.json` merge** — parses your existing `settings.json` and appends only missing template hooks. Preserves your custom hooks (matched by matcher + command), entries, and any top-level keys. Saves a timestamped backup (`settings.json.bak-<ts>`) before any write.
  - Stack-aware `CLAUDE.md` — first-install only — pre-filled with detected stack and `TBD` placeholders.
  - Path-scoped globs in `.claude/rules/{frontend,backend}.md` adapted to detected FE/BE roots.
  - **Version marker** — `.claude/.foundation-version` records `version`, `source_sha`, `installed_at`, `previous_version` so re-runs show `old → new`.
  - **Re-install safety** — interactive prompt for `[m]erge` (default — add missing only), `[r]einstall` (overwrite template files, keep custom), or `[a]bort`. `--yes` and `--dry-run` default to merge. `settings.json`, `CLAUDE.md`, `BACKLOG.md`, brain notes are protected even in reinstall mode.
  - Flags: `--local [src]`, `--remote`, `--yes/-y`, `--dry-run`.

- **State Inventory promoted from 5pt+ to 2pt+ in FE design** — every interactive component must now enumerate all 5 states in a table (Loading / Empty / Error / Success / Partial-Stale) and pair with a `stateDiagram-v2` when it has > 2 states or async actions.
  - State Inventory rewritten: 5-column table with `N/A — [reason]` cell convention, plus a `### State Transitions` subsection with mermaid example.
  - 2pt tier — adds "State Inventory (5-state table + transition diagram)" to required sections. Moved out of 5pt tier's residual list.
  - Fill logic — new bullet describing the state enumeration rules (no blank cells; mark `N/A — [reason]` only if the state cannot occur).
  - Self-check — two new FE-specific checks: all state cells filled, transitions diagram present for components with > 2 states.
  - `_WORKFLOW-REF.md` points table — "State Inventory" moved from 5pt to 2pt row.

- **Step 6a-smoke in `/testing` — mandatory FE manual smoke walkthrough** regardless of E2E status.
  - `testing.md` — new Step 6a-smoke after Step 6a: browser walkthrough per AC via `mcp__claude-in-chrome__*`, checking visual correctness, all 5 State Inventory states, and transition smoothness. Screenshot per AC. BLOCKED on any visual / continuity / transition defect.
  - Skip rule: 6a-smoke skipped only for BE-only / infra / non-interactive tasks.
  - `testing.md` self-check — adds "FE tasks: Step 6a-smoke ran for every AC, screenshots captured, no `READY` without smoke evidence."

### Removed
- **Plugin model retired** — `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` deleted. The `/plugin marketplace add` + `/plugin install` flow is replaced by `install.sh`. Existing installs are unaffected; new installs use the script.

### Rationale
- **`install.sh` over slash command:** Bootstrap must run before Claude Code is configured for the target repo — a slash command can't do that. A shell script with diff preview, JSON-aware settings merge, and a version marker handles the cold-start cost (clone, copy, fill four CLAUDE.md sections, adapt path globs) that users routinely skipped under the manual flow.
- **State Inventory at 2pt+:** Most FE tasks are 2–3 points. Restricting the 5-state inventory to 5pt+ meant the majority of interactive work shipped without explicit Loading / Empty / Error / Partial-Stale handling planned up front — which is where the real bugs live.
- **Mandatory smoke walkthrough:** E2E tests assert logic but miss wrong copy, broken layout at default viewport, state flashes, and stuck spinners. A 5-minute manual walkthrough catches every one of those before `/retro-task`.

---

## [0.13.0] — 2026-04-22

### Added
- **Scrum hierarchy — authoritative vocabulary.** A single 5-row mapping table in `CLAUDE.md` aligns template terms with standard Scrum terms so "task" is never ambiguous.

  | Template term | Scrum term | Deployable? | User value? |
  |---------------|-----------|-------------|-------------|
  | **Sprint** (`SP[N]`) | Epic — business theme across stories | no | no |
  | **Task** (`SP[N]-T[NNN]`) | Story — vertical slice (FE+BE+data) | **yes** | **yes** |
  | **Scope Overview bullet** | Feature-area summary inside a story | no | no |
  | **Implementation Plan row** | Engineering task — layer-level work | no | no |
  | **Implementation Plan checkbox** | Subtask — atomic 2–5 min action | no | no |

  Rationale: `/new-sprint` already enforces 1 task = 1 user story via HARD-GATE, but fresh sub-agents had no shared vocabulary. Without it, "task" could mean a Scrum Story OR an engineering task — causing scope expansion or mid-layer stalls.

- **SCRUM HIERARCHY briefing injected into every spawned agent.** A 6-line block is now prepended to each sub-agent prompt so they know the exact layer they are working on.
  - `/run-tasks` Step 1.5 — defines `SCRUM_HIERARCHY` once, injects into 6 agent prompts (Requirement, FE Design, BE Design, Implementer, Spec Reviewer, Quality Reviewer)
  - `/run-tasks-p` Step 1.5 — writes `.claude/rtp/$RUN_ID/scrum-hierarchy.md` once, injects via `$(cat $HIERARCHY_FILE)` into 6 headless subprocess prompts
  - `/implement` Step 1d — new shared block, injected into 4 sub-agents (Agent A FE Tests, B BE Tests, C FE Impl, D BE Impl)

- **Epic Breakdown in `/discovery`** — multi-epic discoveries now enumerate each epic as a row, ordered by dependency, with sequential `/new-sprint` invocations.
  - `DISCOVERY-TEMPLATE.md` — new Section 16 "Epic Breakdown" table (`# | Epic Title | One-line Scope | Depends On | Priority`) + **Shared entities / cross-epic concerns** bullet
  - `/discovery` Step 3 — inspects `Estimated sprints`: = 1 leaves table empty, > 1 enumerates each epic with dependency ordering
  - `/discovery` Next Steps — single-epic lists one `/new-sprint`, multi-epic lists one per epic in dependency order
  - `/new-sprint` Step 1.3 — new **Epic Breakdown present** check: looks up the epic row, walks `Depends On = Ek`, verifies the prerequisite sprint in `BACKLOG.md` is `done`, warns if not
  - Also reads **Shared entities / cross-epic concerns** and carries forward to Stories step so shared components are owned by the first epic that needs them

- **Scope Overview section** in FE/BE design templates (2pt+) — 3–6 bullets for orientation before the detailed Implementation Plan.
  - `FRONTEND-DESIGN-TEMPLATE.md` / `BACKEND-DESIGN-TEMPLATE.md` — new `## Scope Overview` section
  - `design.md` 2pt tier — Scope Overview added to required sections
  - `design.md` Step 2c self-check — Scope Overview bullets must each map to at least one phase in the Implementation Plan (no orphans)
  - `/run-tasks` Implementer agent — Section Extraction table now extracts `## Scope Overview` + `## Implementation Plan` (was Implementation Plan only)
  - `/run-tasks-p` Implementer subprocess — adds `FE_SCOPE`/`BE_SCOPE` extract_section calls and injects them into the Implementer prompt

- **Value section** in requirement template (1pt+) — 1–3 bullets covering user impact, business outcome (+ optional "why now").
  - `REQUIREMENT-TEMPLATE.md` — new `## Value` section positioned between Overview and Feature Flow
  - `/requirement` Step 2 fill logic — Value bullets must be concrete; metric included if known (e.g. "-20% support tickets", "unlocks premium tier"); rejects vague restatements of the user story
  - `/requirement` Step 3 self-check — Value must include at least user impact + business outcome, not restate the user story

### Changed
- **Rename "Sub-tasks" → "Stories"** across the template — resolves the last vocabulary collision (template "Sub-tasks" was being confused with Scrum "Subtasks" which are engineering-task checkboxes).
  - `SPRINT-OVERVIEW-TEMPLATE.md` — `## Sub-tasks` → `## Stories` + header comment clarifying each row = one Scrum Story
  - `RETRO-SPRINT-TEMPLATE.md` — "All sub-tasks are `done`" → "All stories are `done`"
  - `new-sprint.md` — 5 references renamed (command description, Step 3 heading, proposal header, update ref, Shared entities carry-forward)
  - `requirement.md`, `retro-sprint.md`, `_WORKFLOW-REF.md`, `.claude/rules/new-sprint.md`, `docs/WORKFLOW-QUICKREF.md` — references updated
  - Historical files (`CHANGELOG.md` prior entries, `docs/sprints/SP1/SP1-overview.md`) intentionally left alone

- **Implementation Plan label in `/design`** — each row is now explicitly documented as "a Scrum engineering task (layer-level work, NOT a story). Implementers follow these checkboxes in sequence." Removes ambiguity about what implementers are building.

### Design
- All 4 `/implement` sub-agents (A/B/C/D) work inside Stories, not engineering tasks — they follow an Implementation Plan that is already broken down by the design phase. The SCRUM HIERARCHY briefing explicitly instructs them: "Do NOT expand scope beyond the ACs. Do NOT treat Implementation Plan rows as stories. Do NOT ask the user mid-layer — follow the plan."
- `/execute-plan` and `/brainstorm` delegate to superpowers skills and don't spawn their own agents, so no hierarchy injection is needed — superpowers uses its own vocabulary.

---

## [0.12.0] — 2026-04-08

### Added
- **Confidence Gate** — AI must self-assess >= 90% confidence before proceeding with any workflow command. If below threshold, stops and asks targeted clarifying questions instead of guessing.
  - New rule file: `.claude/rules/confidence-gate.md` — defines the 90% threshold, 5 assessment dimensions (requirement clarity, codebase familiarity, AC coverage, dependency awareness, approach clarity), output format for blocked state, and anti-gaming rules
  - Gate step embedded in 11 workflow commands, positioned after context loading but before main work begins:

    | Command | Gate step | Position |
    |---------|-----------|----------|
    | `/implement` | Step 1c | After readiness check, before writing tests |
    | `/design` | Step 1c | After clarify ambiguities, before filling design |
    | `/requirement` | Step 1c | After clarify ambiguities, before drafting |
    | `/discovery` | Step 2b | After receiving user answers, before filling doc |
    | `/code-review` | Step 1b | After loading context, before spec review |
    | `/testing` | Step 2b | After verifying env, before TDD coverage check |
    | `/debug` | Phase 2b | After pattern analysis, before hypothesis |
    | `/issue` | Step 1b | After parse/classify, before investigation |
    | `/execute-plan` | Step 1b | After loading context, before worktree setup |
    | `/write-plan` | Step 1b | After loading context, before invoking skill |
    | `/new-sprint` | Step 2b | After creating overview, before task breakdown |

  - Each gate assesses **command-specific dimensions** (e.g. `/implement` checks TDD plan clarity; `/debug` checks reproducibility and root cause narrowing)
  - Anti-gaming rules: confidence must be evidence-based (files read, context received) — not assumptions; "I think I know" ≠ 90%
  - `CLAUDE.md` Key Constraints updated with confidence gate mention

### Design
- Commands NOT gated (and why): `/status` (read-only), `/next-task` (navigation), `/git-commit` (mechanical), `/retro-task`/`/retro-sprint` (backward-looking), `/brainstorm` (already has approach HARD-GATE), `/run-tasks`/`/run-tasks-p` (orchestrators — individual commands inside have their own gates)

---

## [0.11.0] — 2026-04-03

### Added
- **Sprint Context Snapshot** — `/run-tasks` and `/run-tasks-p` pre-load sprint overview, relevant backlog rows, and latest discovery doc once in the parent session; injected into every agent prompt as `--- SPRINT CONTEXT ---`. Agents no longer read these files independently.
- **Codebase Manifest** — parent scans directory tree, package config, shared types, DB schema, and test config once at the start of Phase 2; injected into all implementation agents. Agents no longer explore the codebase independently on every task.
- **Section extraction rule (size guard)** — docs > 6,000 chars are trimmed to the relevant section per agent type before injection. Full mapping table added to `/run-tasks`, `/run-tasks-p`, and `/implement`:

  | Agent | From REQ | From FE | From BE |
  |-------|----------|---------|---------|
  | FE Design | AC only | — | — |
  | BE Design | AC only | API Contracts + Endpoints | — |
  | FE/BE Test (A/B) | AC only | TDD Test Plan / — | — / TDD Test Plan |
  | FE/BE Impl (C/D) | AC only | Impl Plan / — | — / Impl Plan |
  | Spec Reviewer | AC only | API Contracts | API Contracts |
  | Quality Reviewer | AC only | — | — |

- **`MAX_PARALLEL` cap** — `/run-tasks` and `/run-tasks-p` launch agents in rolling batches (default 4, auto-lower to 3 for >8 tasks) instead of all-at-once; prevents API rate-limit throttling on large sprints.
- **`extract_section()` bash helper** in `/run-tasks-p` — reusable awk-based function for section-targeted doc injection; returns full file when ≤ 6,000 chars, extracts named `## Section` block otherwise.
- **Snapshot-to-file** in `/run-tasks-p` — sprint snapshot and codebase manifest written to `.claude/rtp/[run-id]/sprint-snapshot.md` and `.../codebase-manifest.md`; injected via `$(cat file)` instead of shell variable interpolation, eliminating quoting/escaping failures with large docs.
- **Step 4 BE Design** fully written out in `/run-tasks-p` as `run_be_design()` bash function (was previously a one-line stub); injects AC, API Contracts, and Endpoints sections; includes MAX_PARALLEL batching loop.

### Changed
- `/implement` sub-agents (A/B/C/D) each receive only the sections relevant to their role — test agents receive TDD Test Plan, implementation agents receive Implementation Plan. Full docs are no longer injected wholesale into all 4 agents.
- `/run-tasks` Phase 2 Spec Reviewer receives AC + API Contracts only (not full design docs). Quality Reviewer receives AC only.
- All agent prompts no longer include explicit file paths for pre-loaded content — agents cannot re-read injected docs, eliminating redundant file reads per agent.

### Performance impact (9-task sprint, requirement phase)
- Sprint context reads: **9× → 1×** (sprint overview, discovery, backlog)
- Codebase exploration: **N× → 1×** (implementation phase)
- Per-agent context size: **reduced by ~60–80%** for implementation agents via section extraction
- Rate-limit pressure: eliminated for sprints with 8+ tasks via MAX_PARALLEL batching

---

## [0.10.0] — 2026-04-03

### Added
- **`PAT-004 — Superpowers Workflow Integration`** brain note — documents the three-tier priority hierarchy (template commands > bridge commands > direct invocations), all 8 inline integration points, file path overrides, sprint-awareness requirement, and graceful degradation
- **`CON-ui-ux-pro-max`** concept note — documents the `ui-ux-pro-max` skill: capabilities (161 palettes, 99 UX guidelines, 50+ styles, 10 stacks), workflow position (after `frontend-design`, before `/implement`), exact invocation name, and boundary with `accessibility-review`
- `PAT-004` registered in `MOC-Patterns.md` (table + Workflow Patterns category) and `MOC-Workflow.md` (Patterns list + Superpowers Integration section)
- `CON-ui-ux-pro-max` registered in `BRAIN-INDEX.md` Quick Reference and `MOC-Frontend.md` Core Concepts

### Fixed
- **Brain consistency overhaul — 25 files** cleaned up after full audit:
  - `MOC-AI.md` — removed 11 broken wikilinks to nonexistent concept files (CON-prompt-engineering, CON-rag-patterns, CON-llm-evaluation, CON-vector-databases, CON-embedding-models, CON-cost-analysis-llm, CON-prompt-injection-defense, CON-llm-bias-mitigation, CON-data-privacy-ai); replaced with "Planned notes" markers; fixed `type: moc` → `type: MOC`
  - `MOC-QA.md` — removed broken `CON-test-case-design` link
  - `MOC-Team.md` — removed broken `CON-distributed-teams` and `CON-conway-law-inverse` links; fixed `type: moc` → `type: MOC`
  - `GLO-tdd.md`, `GLO-acceptance-criteria.md` — removed broken `CON-testing-strategy` links; GLO-acceptance-criteria replaced with `CON-qa-process`
  - `BRAIN-INDEX.md` — corrected total counts from 17 MOCs/75 concepts to 21 MOCs/76 concepts
  - `PAT-004` example paths corrected: `DISC-007` → `disc-007` (lowercase); `T042/T042-plan.md` → `SP2-T042/SP2-T042-plan.md`
  - `_WORKFLOW-REF.md` — fixed stale `/testing` Step 7b reference → Step 7
- **6 oversized glossary entries trimmed** — GLO-tdd (267→28 lines), GLO-story-points (247→30), GLO-acceptance-criteria (155→30), GLO-discovery (194→25), GLO-sprint (194→30), GLO-posttooluse (225→25); each now follows the `GLO-vertical-slice` pattern (short definition + See Also links to full concept notes)
- **Frontmatter standardization** across 17 files:
  - 7 root-level `brain/01-concepts/` notes — added missing `source: template` tag
  - 3 LES files — added missing `updated: 2026-03-25`
  - 4 GLO files (adr, atomic-note, moc, vertical-slice) — added missing `updated: 2026-03-25`
- **`/debug` command** — added note clarifying that `superpowers:systematic-debugging` extends (not overrides) the 4-phase structure

---

## [0.9.0] — 2026-04-03

### Added
- **Context7 integration** — 7 commands now fetch up-to-date library and framework documentation during coding workflows, preventing stale API knowledge from causing incorrect designs, implementations, or diagnoses:
  - `/design fe` / `/design be` — queries framework/library docs after codebase exploration; used as source of truth when filling design sections
  - `/implement` — queries docs for libraries referenced in design docs; fetched context is passed to FE/BE sub-agents
  - `/debug` Phase 2 — queries library docs during pattern analysis to verify expected behavior before forming hypotheses
  - `/issue` Step 2 — delegates to `/debug` Phase 2 context7 lookup automatically (no duplicate call)
  - `/code-review` Step 2b — queries docs for library APIs appearing in the diff to flag deprecated or incorrect usage
  - `/testing` Step 2 — queries test framework docs (Jest, Vitest, Playwright, Cypress, etc.) when E2E setup patterns are involved
  - `/dependency-update` Step 3 — queries migration guides for major version bumps instead of manually reading CHANGELOGs
- **Context7 Integration section in `CLAUDE.md`** — documents which commands use it, the two-step tool pattern (`resolve-library-id` → `query-docs`), and the graceful degradation guarantee

### Design
- All integration points are advisory and conditional: "if context7 is available … if not, proceed with codebase patterns and existing knowledge." No command fails when the plugin is absent.
- Max 3 library lookups per command invocation to keep context window overhead bounded.

---

## [0.8.0] — 2026-04-03

### Added
- **User story format for tasks** — each non-infra task in `/new-sprint` must now be phrased as `"As a [role], I want [action], so that [outcome]."` The user story is the task identifier, replacing the freeform title
- **E2E Validation Scenarios** — structured `GIVEN/WHEN/THEN` blocks (min 2 per `feat` task) written as rendered markdown below the task table; downstream `/requirement` seeds ACs directly from these scenarios
- **Vertical Slice HARD-GATE** in `/new-sprint` Step 3 — auto-catches layer-only tasks (BE-only API, FE-only component) and forces rephrase/merge before coverage check; built-in violation examples: "Create API endpoint for X → merge into story calling it"
- **`infra` task type** — explicit fourth type (`feat / fix / chore / infra`); only `infra` tasks are exempt from user story format; commit type mapping added: `infra → chore`
- `/run-tasks-p` command — headless `claude -p` variant of `/run-tasks`; same two-phase pipeline but uses subprocesses instead of Agent tool; outputs go to `.claude/rtp/[run-id]/` logs; parent context stays lean; use when running many tasks
- Bridge commands `/brainstorm`, `/write-plan`, `/execute-plan` — invoke superpowers skills at specific integration points with full sprint context passed through
- Superpowers skill hooks — 8 integration points wired into existing commands: `brainstorming` (`/brainstorm`), `writing-plans` (`/write-plan`), `executing-plans`/`subagent-driven-development` (`/execute-plan`), `systematic-debugging` (`/debug`), `verification-before-completion` (`/implement` Step 4), `requesting-code-review`/`receiving-code-review` (`/code-review`), `using-git-worktrees` (`/implement` Step 0b), `finishing-a-development-branch` (`/git-commit` Step 8)
- `.claude/rules/superpowers.md` — priority rules: template commands always win over superpowers orchestrator; file path overrides for superpowers default save paths; graceful degradation guarantee
- `HARD-GATE: vertical slice` entry in `_WORKFLOW-REF.md` Superpowers-Inspired Principles table

### Changed
- **Sub-tasks table** — `Title` column → `User Story`; `Type` values clarified to `feat / fix / chore / infra`; separate `E2E Scenario` column removed (replaced by structured E2E Validation Scenarios section below the table)
- **Two stacked HARD-GATEs merged** — 13-point check and vertical slice check combined into one gate with two named checks (A and B); single re-present cycle on failure
- **`SPRINT-OVERVIEW-TEMPLATE.md`** — sub-tasks table updated to new format; E2E Validation Scenarios section template added
- **`requirement.md`** — seeds ACs from sprint-level E2E Validation Scenarios; Overview expands from User Story instead of old one-sentence scenario; duplicate clarification paragraph removed

### Fixed
- 22 stale `[Title]` / `[Task Title]` references swept across all workflow files: `run-tasks.md`, `run-tasks-p.md`, `code-review.md`, `git-commit.md`, `status.md`, all 5 task templates (`REQUIREMENT`, `FRONTEND-DESIGN`, `BACKEND-DESIGN`, `ISSUE`, `RETRO-TASK`), 4 skill files (`security-review`, `db-schema-review`, `accessibility-review`, `session-handoff`), `pr-create` skill, `docs/BACKLOG.md`
- E2E Validation Scenarios were inside a markdown code fence in `new-sprint.md` but outside in `SPRINT-OVERVIEW-TEMPLATE.md` — fixed: scenarios are now consistently rendered markdown so `/requirement` can parse them as a named section
- `infra` task type had no defined commit type — documented as `chore` in `_WORKFLOW-REF.md` Commit Format section

---

## [0.7.0] — 2026-03-27

### Added
- `/status` command — read-only sprint snapshot: active sprint, task progress counts (done / in-progress / todo / blocked), last completed step inferred per task from doc file existence, suggested next command per task; no state mutations
- `brain/04-lessons/` seeded with 3 example LES- notes (`LES-001` tdd-skipped-on-deadline, `LES-002` mock-vs-real-db-divergence, `LES-003` discovery-skipped-caused-rework) — shows the format teams should follow when writing real lessons
- `source: template` tag added to frontmatter of all 76 generic educational concept notes in `brain/01-concepts/` subdirectories — distinguishes pre-seeded reference knowledge from project-specific content; 7 root-level methodology notes (sprint-lifecycle, tdd-rules, etc.) left untagged
- Source tag legend in `brain/BRAIN-INDEX.md` — explains `source: template` (reference knowledge) vs `source: template-example` (illustrative examples to replace) vs absent (organically grown)
- `brain/00-MOC/MOC-Lessons.md` updated with links to the 3 seeded LES- notes

### Fixed
- All remaining stale `/fe-design` → `/design fe` and `/be-design` → `/design be` references across 18 active files (`.claude/rules/`, `.claude/skills/`, `docs/`, `brain/`)
- All remaining `/brain-update` references replaced with "Step 6 of `/retro-sprint`" in `brain/BRAIN-INDEX.md`, `brain/05-sprints/SP1-brain.md`, `brain/00-MOC/MOC-Workflow.md`, and `.claude/rules/brain.md`

---

## [0.6.0] — 2026-03-27

### Added
- `/design [fe|be] [task-id]` command — consolidates the old `fe-design.md` and `be-design.md` into a single unified command; old files removed
- `docs/WORKFLOW-QUICKREF.md` — one-page manual with ASCII flow diagram, command cheat sheet, 6 hard gates, 6 escape hatch patterns (hotfix / FE-only / BE-only / spike / blocked / multi-sprint epic), TDD Iron Law cheat sheet, and story point quick guide
- `docs/discovery/.gitkeep` — creates `docs/discovery/` so `/discovery` output path exists on first run
- `**Estimate** | ___ days` field to `REQUIREMENT-TEMPLATE.md` — `/retro-task` reads this field; it was missing from the template
- Point-level scope comments (`<!-- 1pt+ -->`, `<!-- 3pt+ -->`, etc.) to every section in `REQUIREMENT-TEMPLATE.md`, `FRONTEND-DESIGN-TEMPLATE.md`, and `BACKEND-DESIGN-TEMPLATE.md` — makes section gating visible in the doc itself
- `<!-- Optional: include for 5pt+ or complex domain projects -->` markers on Discovery enterprise sections: Personas (§3), Event Storming (§9), SIPOC (§10), Glossary (§16)
- `<!-- Example: intentionally simplified ... -->` comment to all four SP1 example files — clarifies they are simplified illustrations, not broken templates
- Smart related-test detection in `run_tests.py` — runs companion test file first (e.g. `bar.test.ts` for `bar.ts`) before falling back to full suite; test files edited directly run themselves; Rust/Cargo support added
- `/issue` vs `/debug` decision table in `_WORKFLOW-REF.md` and `README.md`
- Discovery coverage check explanation in `_WORKFLOW-REF.md` — documents why the check runs at both task level and AC level
- Optional skills footers to relevant commands — skills are visible at point of use, not just in the workflow reference
- Escape Hatches section in `README.md` with summary table

### Changed
- **`git-commit.md` Step 2** — status gate now requires `done` only (was `testing` or `done`); accepting `testing` allowed skipping `/retro-task`
- **`retro-sprint.md` Step 5** — removed duplicate CLAUDE.md update prompt; now handled once in Step 6 alongside brain extraction
- **`FRONTEND-DESIGN-TEMPLATE.md`** — `## Design References` simplified to a pointer to the requirement doc (was duplicating links)
- **`SPRINT-OVERVIEW-TEMPLATE.md`** — `Sprint ID` field renamed to `Sprint` for consistency
- All templates — sprint ID placeholder standardized from `sprint-XX` to `SP[N]`
- **`docs/_WORKFLOW.md`** — `/fe-design` / `/be-design` corrected to `/design fe` / `/design be` throughout
- **`run-tasks.md`** — command names updated to `design fe` / `design be`; Phase 2 header documents Spec Reviewer ≈ `/code-review` Stage 1, Quality Reviewer ≈ Stage 2 + `/testing`
- **`CLAUDE.md`** — removed contradictory "read brain at session start" instruction; brain access defers to `rules/brain.md`
- **`implement.md`** — "BOTH docs missing → stop" vs "ONE doc missing → warn" distinction; Iron Law reminder at Step 1b
- **`debug.md`** — Phase 4 mandates confirm RED before implementing fix
- **`code-review.md`** — TDD compliance check narrowed to process evidence rather than row-by-row coverage count
- **`retro-task.md`** — CLAUDE.md update prompt removed; knowledge items reviewed at sprint level, not per task
- **`testing.md`** — Steps 7 and 7b merged into a single authoritative final full-suite run
- **`README.md`** — workflow strings corrected, commands table expanded, `run_tests.py` description updated to reflect smart related-test detection

### Fixed
- `_WORKFLOW-REF.md` path reference in `WORKFLOW-QUICKREF.md` now uses full path `.claude/commands/_WORKFLOW-REF.md`
- Hard gates inconsistently marked across commands — `<HARD-GATE>` tags added to `/requirement` Step 3, `/git-commit` Step 5, and design commands

### Removed
- `fe-design.md` and `be-design.md` — replaced by unified `/design [fe|be]` command
- `brain-update.md` — brain update step folded into `/retro-sprint` Step 6

---

## [0.5.0] — 2026-03-26

### Added
- Self-check checklists to `/fe-design`, `/be-design`, `/requirement`, and `/testing` — Claude re-reads files after writing and verifies structural integrity before reporting done
- Clarification step (Step 1b) to `/requirement`, `/fe-design`, `/be-design` — collects all ambiguities into one message before designing, never one-by-one

### Changed
- Production readiness gate added to `/testing` Step 6 — E2E tests mandatory for every non-infra task; manual browser verification via `mcp__claude-in-chrome__*` when no E2E framework exists
- `/code-review` and `/git-commit` strengthened with explicit verification-before-completion guards

---

## [0.4.0] — 2026-03-25

### Added
- Brain vault (`brain/`) — Obsidian-style knowledge base with MOCs, atomic notes, and sprint summaries
- `/brain-update [sprint-id]` command — extracts retro learnings into DEC / PAT / LES atomic notes
- `brain/BRAIN-INDEX.md` — master entry point; MOC structure for Frontend, Backend, Workflow, QA, Decisions, Lessons
- Brain integration steps (Step 0) added to `/discovery`, `/requirement`, `/fe-design`, `/be-design`, `/implement`
- `rules/brain.md` — access protocol: read only when task requires it, navigate MOC → targeted notes only

### Changed
- `/retro-sprint` now prompts for CLAUDE.md updates with category suggestions
- README expanded with brain vault structure and how-it-grows explanation

### Removed
- Feedback workflow commands (consolidated into retro flow)

---

## [0.3.0] — 2026-03-22

### Added
- `/run-tasks` command — two-phase parallel pipeline: Plan (requirement → fe-design → be-design → user review gate) then Implement (3-agent: implementer → spec reviewer → quality reviewer)
- Cross-task alignment steps in `/run-tasks` — shared terminology, API contract, scope boundary documents written between phases
- Task dependency tier system — tasks with unmet `depends_on` form Tier 2 and wait for Tier 1 completion

### Changed
- `/implement` — parallel sub-agent architecture (Agent A: FE tests, Agent B: BE tests, Agent C: FE impl, Agent D: BE impl); worktree isolation via `git worktree add` per task
- Story points scale formalised (1 / 2 / 3 / 5 / 8 / 13-block) with required doc sections per level in `_WORKFLOW-REF.md`

---

## [0.2.0] — 2026-03-19 — 2026-03-21

### Added
- `/requirement [task-id]` command — draft ACs + requirement doc with points-based section scope
- `docs/templates/` directory — skeleton templates for every workflow stage (DISCOVERY, SPRINT-OVERVIEW, REQUIREMENT, FRONTEND-DESIGN, BACKEND-DESIGN, ISSUE, RETRO-TASK, RETRO-SPRINT)
- E2E test plan requirement to `/fe-design` and `/testing`
- Discovery and AC coverage checks — `/new-sprint` Step 3b and `/requirement` Step 2b cross-check all items against discovery doc
- To-Be user journey section to discovery template
- Story points scale and section-scoping rules

### Changed
- `/discovery` — creates file first, then asks all unanswered questions in a single message (never one-by-one)
- Templates moved from root to `docs/templates/`
- Task ID format updated — global counter never resets across sprints

### Fixed
- PostToolUse lint hooks for Go, TypeScript, and JavaScript (PR #1)

---

## [0.1.0] — 2026-03-18

### Added
- Initial template: `CLAUDE.md`, `.claude/commands/`, `.claude/rules/`, `.claude/hooks/`, `.claude/settings.json`
- Core commands: `/discovery`, `/new-sprint`, `/fe-design`, `/be-design`, `/implement`, `/issue`, `/debug`, `/code-review`, `/testing`, `/retro-task`, `/retro-sprint`, `/git-commit`, `/next-task`
- PostToolUse hooks: `lint_ts.py`, `lint_go.py`, `lint_js.py`, `run_tests.py`
- TDD rules in `rules/testing.md` — Iron Law, RED verification, rationalization red flags
- Status lifecycle: `discovery → backlog → todo → in-progress → review → testing → done`
- Branch and commit format conventions
- `docs/BACKLOG.md` auto-updated by workflow commands
