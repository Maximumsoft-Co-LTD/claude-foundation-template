# /implement
Workflow position: **/requirement → START → /issue (loop) → /code-review**

Implement the task following the unified requirement doc (which contains story + FE design + BE design + implementation plan with subtasks). Write failing tests first, then implement until all pass.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 0 — Check brain for reusable patterns (scoped)

Skip entirely if `brain/BRAIN-INDEX.md` does not exist.

Otherwise, follow the access protocol in `.claude/rules/brain.md`:

- Open `MOC-Patterns.md` **only** if the Implementation Plan in `[task-id]-requirement.md` references a known pattern keyword (auth, schema, api-client, state, retry, idempotency, etc.). If no Implementation Plan section calls out a pattern, skip entirely.
- Open `MOC-Lessons.md` **only** if `Points >= 5`, or if the requirement doc's Existing Code Context cites a past failure mode by note ID. Otherwise skip.
- For each matching PAT/LES, read "Solution" + "Example from sprint" only — never the full note.
- **Apply patterns found here** — cite the PAT-NNN in code comments where used.

Print: `Brain: reusing [PAT-NNN], avoiding [LES-NNN warning]` (or `Brain: skipped — no pattern keywords`).

---

## Step 0b — Set up isolated worktree

If the superpowers plugin is available, invoke `Skill("superpowers:using-git-worktrees")` for smart directory selection and safety verification. Otherwise, follow the inline steps below.

Check if already in a worktree:
```bash
git rev-parse --show-toplevel
git worktree list
```

**If already in a dedicated worktree for this task** → skip this step, print current path.

**If in the main working tree** → create an isolated workspace:

1. Verify `.worktrees` is gitignored:
   ```bash
   git check-ignore -q .worktrees || echo ".worktrees" >> .gitignore
   ```

2. Create the worktree on the task branch:
   ```bash
   git worktree add .worktrees/[task-id] -b [sprint-id]/[task-id]-[short-desc]
   ```
   Branch format: `SP1/SP1-T002-user-auth` (per team conventions in CLAUDE.md)

3. Enter the worktree and verify clean baseline:
   ```bash
   cd .worktrees/[task-id]
   # Install deps if needed (npm install / go mod tidy / etc.)
   # Run test suite — must be GREEN before any new code
   ```
   If baseline tests are RED → stop. Investigate before proceeding.

Print: `Worktree ready: .worktrees/[task-id] on branch [branch-name]`

**Note:** All sub-agents in Step 2 and Step 3 work inside this worktree. When launching parallel agents, pass the worktree absolute path so they operate on the same isolated workspace — not the main working tree.

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read **in parallel** and store content in memory as `DOC_OVERVIEW`, `DOC_REQ`:
- `docs/sprints/[sprint-id]/[sprint-id]-overview.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`

`DOC_REQ` is the **single source of truth** — it contains the story, FE design (if any), BE design (if any), Implementation Plan, and TDD Test Plan all in one file. It is injected into every sub-agent prompt — agents must NOT re-read this file.

**Section extraction rule (size guard):** Before injecting into a sub-agent, check character count:
- ≤ 6000 chars → inject full `DOC_REQ`
- \> 6000 chars → extract only the section(s) that agent needs (from the matching `##` heading to the next heading at the same level)

| Agent | Sections to extract from `DOC_REQ` |
|-------|-----------------------------------|
| A — FE Tests | `## Acceptance Criteria` + `### [FE] TDD Tests` + `## E2E Test Plan` + `# 3 · Frontend Design` (State Inventory, Fail Case Matrix) |
| B — BE Tests | `## Acceptance Criteria` + `### [BE] TDD Tests` + `# 4 · Backend Design` (API Endpoints, Input Validation, Error Handling) |
| C — FE Impl | `## Acceptance Criteria` + `### [FE] Plan` (includes its subtasks) + `# 3 · Frontend Design` (Component Breakdown, State Inventory, API Contracts Consumed) + `### [FE] Scope` |
| D — BE Impl | `## Acceptance Criteria` + `### [BE] Plan` (includes its subtasks) + `# 4 · Backend Design` (API Endpoints, Data Models, Service/Layer Breakdown, Business Logic) + `### [BE] Scope` |

Validate:
- Missing requirement or empty ACs → stop: "Run `/requirement [task-id]` first."
- Implementation Plan empty AND Task Type ≠ infra → stop: "Fill Implementation Plan in `[task-id]-requirement.md` first."

Read `Task Type` from Metadata. Assess parallelization flags:
- `HAS_FE`: Task Type ∈ {fullstack, fe-only} AND `### [FE] TDD Tests` has rows
- `HAS_BE`: Task Type ∈ {fullstack, be-only} AND `### [BE] TDD Tests` has rows
- `SHARED_TYPES`: `HAS_FE` AND `HAS_BE` AND FE API Contracts Consumed references shared types
- `HAS_MIGRATION`: `DOC_REQ` `## Database Migrations` section is filled (not `N/A`)

**Context7 — fetch current library docs (if available):**
From the design sections in `DOC_REQ`, identify the key libraries the implementation will use (max 3 — e.g. test framework, UI component library, ORM/query builder).
For each library, follow `.claude/rules/context7-cache.md`:
1. **Cache check** — read `docs/sprints/[sprint-id]/.context7-cache.json`; on hit, reuse and skip both MCP calls below.
2. `mcp__plugin_context7_context7__resolve-library-id` — resolve the library name to a context7 ID.
3. `mcp__plugin_context7_context7__query-docs` — query for the specific patterns needed (test utilities, component API, query syntax, etc.).
4. Append `{libraryId, result, fetchedAt}` to the cache file.

Pass the fetched docs as context to sub-agents in Step 2 and Step 3 so they write code against current APIs.
If context7 is not available, proceed using design doc patterns and existing knowledge.

---

## Step 1b — Pre-implementation readiness check

**Iron Law:** if any implementation code for this task already exists that was written before its tests — **delete it now**. Do not keep it as reference. Rewrite from tests. See `rules/testing.md`.

For each AC in requirement: is there at least one test row in `### [FE] TDD Tests` or `### [BE] TDD Tests`? Flag any AC with no test → **stop**, fix `[task-id]-requirement.md` first.


---

## Step 1c — Confidence Gate

Assess confidence that you can implement this task successfully based on all context loaded so far.

Key dimensions:
- Design docs complete and unambiguous?
- Codebase patterns understood (from brain + exploration)?
- TDD test plan clear — you know exactly what tests to write?
- Dependencies and side effects identified?
- Implementation approach concrete (not vague)?

**>= 90%** → proceed to Step 2.
**< 90%** → **STOP.** State what you know, what you don't, and what you need. Do NOT write any code until confidence reaches 90%. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

---

## Step 1d — Scrum hierarchy briefing

Every sub-agent spawned in Step 2 and Step 3 receives this block as part of its prompt. Define once here so the injection stays DRY:

```
--- SCRUM HIERARCHY ---
Sprint (SP[N])               = Scrum Epic — business theme, not deployable alone
Task (SP[N]-T[NNN])          = Scrum Story — vertical slice (FE+BE+data), user-facing, deployable
Scope Overview bullet        = feature-area summary inside the story (not a story)
Implementation Plan row      = Scrum engineering task — layer-level work, NOT user-facing
Implementation Plan checkbox = Scrum Subtask — atomic 2–5 min action
You are implementing engineering tasks inside a Story that already has defined ACs. Do NOT expand scope beyond the ACs. Do NOT treat Implementation Plan rows as stories. Do NOT ask the user mid-layer — follow the plan.
---
```

Store as `SCRUM_HIERARCHY`. Inject into every sub-agent prompt in Step 2 and Step 3.

---

## Step 2 — Write failing tests

**If `SHARED_TYPES`:** write shared type/interface files first, then proceed.

**If `HAS_FE` AND `HAS_BE`:** launch 2 parallel sub-agents:

> **Agent A — FE Tests**
> --- SCRUM HIERARCHY ---
> [inject SCRUM_HIERARCHY]
> ---
> --- REQUIREMENT DOC: FE-RELEVANT SECTIONS (apply section extraction rule) ---
> [inject from DOC_REQ: `## Acceptance Criteria` + `### [FE] TDD Tests` + `## E2E Test Plan` + `# 3 · Frontend Design` (State Inventory, Fail Case Matrix)]
> ---
> --- CONTEXT7 FE LIBRARY DOCS ---
> [inject fetched FE library docs from Step 1]
> ---
> WORKTREE PATH: [inject absolute worktree path from Step 0b]
> ---
> Write all test files from the [FE] TDD Test Plan above.
> Run FE tests — confirm every new test **fails** (red). Do NOT write implementation code.

> **Agent B — BE Tests**
> --- SCRUM HIERARCHY ---
> [inject SCRUM_HIERARCHY]
> ---
> --- REQUIREMENT DOC: BE-RELEVANT SECTIONS (apply section extraction rule) ---
> [inject from DOC_REQ: `## Acceptance Criteria` + `### [BE] TDD Tests` + `# 4 · Backend Design` (API Endpoints, Input Validation, Error Handling)]
> ---
> --- CONTEXT7 BE LIBRARY DOCS ---
> [inject fetched BE library docs from Step 1]
> ---
> WORKTREE PATH: [inject absolute worktree path from Step 0b]
> ---
> Write all test files from the [BE] TDD Test Plan above.
> Run BE tests — confirm every new test **fails** (red). Do NOT write implementation code.

Wait for both agents. Collect red-test confirmation.

**If only `HAS_FE` or only `HAS_BE`:** write all test files sequentially. Confirm all **fail** (red).
This is the normal path for FE-only and BE-only tasks — no error, no missing-doc warning needed.


---

## Step 3 — Implement

**If `HAS_MIGRATION`:** run DB migrations first in main context.

**If `HAS_FE` AND `HAS_BE`:** launch 2 parallel sub-agents:

> **Agent C — FE Implementation**
> --- SCRUM HIERARCHY ---
> [inject SCRUM_HIERARCHY]
> ---
> --- REQUIREMENT DOC: FE-RELEVANT SECTIONS (apply section extraction rule) ---
> [inject from DOC_REQ: `## Acceptance Criteria` + `### [FE] Plan` + `### [FE] Subtasks` + `# 3 · Frontend Design` (Component Breakdown, State Inventory, API Contracts Consumed) + `## [FE] Scope`]
> ---
> --- CONTEXT7 FE LIBRARY DOCS ---
> [inject fetched FE library docs from Step 1]
> ---
> WORKTREE PATH: [inject absolute worktree path from Step 0b]
> ---
> Implement components, routing, state, API calls, loading/error states, analytics, responsive, accessibility per the [FE] Plan and [FE] Subtasks above.
> Tests are already written — implement until they pass. No extras, no shortcuts.
> Run FE tests after each logical unit. Log any bugs found (do NOT run /issue — report in output).
> Final state: all FE tests green.

> **Agent D — BE Implementation**
> --- SCRUM HIERARCHY ---
> [inject SCRUM_HIERARCHY]
> ---
> --- REQUIREMENT DOC: BE-RELEVANT SECTIONS (apply section extraction rule) ---
> [inject from DOC_REQ: `## Acceptance Criteria` + `### [BE] Plan` + `### [BE] Subtasks` + `# 4 · Backend Design` (API Endpoints, Data Models, Service/Layer Breakdown, Business Logic) + `## [BE] Scope`]
> ---
> --- CONTEXT7 BE LIBRARY DOCS ---
> [inject fetched BE library docs from Step 1]
> ---
> WORKTREE PATH: [inject absolute worktree path from Step 0b]
> ---
> Implement endpoints, validation, service logic, repository, event publishing, caching, logging, security per the [BE] Plan and [BE] Subtasks above.
> Tests are already written — implement until they pass. No extras, no shortcuts.
> Run BE tests after each logical unit. Log any bugs found (do NOT run /issue — report in output).
> Final state: all BE tests green.

Wait for both agents. If either reported bugs → run `/issue [task-id] [description]` per bug.

**If only `HAS_FE` or only `HAS_BE`:** implement sequentially in main context.


---

## Step 4 — Verification before completion (Iron Law)

**This step implements the `superpowers:verification-before-completion` protocol.** If the superpowers plugin is available, invoke `Skill("superpowers:verification-before-completion")` to enforce the gate function. Otherwise, follow the inline steps below.

**No completion claims without fresh verification evidence.** Run everything in this step — do not rely on output from Step 3 sub-agents.

Run full test suite + build (FE and BE in parallel if separate commands):

| Claim | Required evidence | NOT sufficient |
|-------|------------------|----------------|
| Tests pass | Fresh test output: 0 failures, exit 0 | Sub-agent report, previous run |
| Build succeeds | Build command: exit 0 | Linter passing, tests passing |
| ACs met | Re-read each AC → trace to passing test | "Tests pass" alone |
| No regressions | Full suite output with 0 failures | Partial suite or assumption |

**Process:**
1. **Run** — execute test/build commands now.
2. **Read** — full output, check exit code, count failures.
3. **Trace** — for each AC in requirement, name the specific test that covers it.
4. **Only then** — print the output below.

**Red flags — STOP if you catch yourself:**
- Using "should pass", "probably works", "seems correct"
- About to claim done without a fresh test run in this step
- Expressing satisfaction before verification ("Great!", "Done!")
- Trusting sub-agent success reports without independent verification

---

## Output

```
✓ Implementation complete: [task-id]
  Tests: [N] passing, 0 failing
  Build: exit 0
  Verified: [timestamp of fresh test run]

ACs covered:
  ✓ AC-1 → [test name]
  ✓ AC-2 → [test name]
  ✓ AC-3 → [test name]

Next: /code-review [task-id]
```

**Optional skills (insert before /code-review):**
- `/security-review [task-id]` — secrets, injection, insecure defaults, dependency risk
