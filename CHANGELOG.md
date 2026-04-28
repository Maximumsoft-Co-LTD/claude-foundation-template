# Changelog

All notable changes to claude-foundation-template are documented here.

---

## [0.15.0] — 2026-04-29

### Added
- **Brain citation meter — read-only dashboard for measuring brain ROI.**
  - New slash command `/brain-meter` shows how many times each brain note has been cited inside workflow output docs (`docs/sprints/`, `docs/discovery/`). Runs in dashboard mode by default; pass a prefix (`/brain-meter CON`) to drill into the full uncited list for that type.
  - New PostToolUse hook `.claude/hooks/brain_citation_meter.py` registered in `.claude/settings.json` — runs on every Write/Edit, scans the doc for brain note references (`CON-foo`, `PAT-001`, `DEC-003`, etc.), and increments per (note_id, doc_path) pairs at most once so re-edits don't inflate the metric. `lastCitedAt` refreshes on every edit that still contains the reference.
  - State persists in `brain/.metrics/citations.json` (gitignored via `brain/.metrics/.gitignore` — only the `.gitignore` itself is tracked, so the directory exists in fresh checkouts but per-project counts stay local).
  - The dashboard surfaces ONE actionable insight per run, prioritised: stale high-value DEC/PAT/LES notes never cited → bloated CON/GLO with low coverage → "brain used effectively, no action" → empty meter recommends running `/discovery` to seed citations.
  - Failures in the hook are swallowed silently — the meter must never block a tool call.
- **27 orphan brain notes brought under version control.** These were referenced from `BRAIN-INDEX.md` and several MOCs (Workflow, Data, Developer, DevOps, Infrastructure, Patterns) but had never been `git add`-ed. Adding them now closes every dangling `[[CON-…]]` / `[[PAT-…]]` link the audit pass surfaced.
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
