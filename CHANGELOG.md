# Changelog

All notable changes to claude-foundation-template are documented here.

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
