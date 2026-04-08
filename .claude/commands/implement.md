# /implement
Workflow position: **/design be → START → /issue (loop) → /code-review**

Implement the task following FE and BE design docs. Write failing tests first, then implement until all pass.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 0 — Check brain for reusable patterns

If `brain/BRAIN-INDEX.md` exists:
- Read `brain/00-MOC/MOC-Patterns.md` — scan for PAT notes matching this task's domain.
- For each matching PAT: read "Solution" and "Example from sprint" sections only.
- Read `brain/00-MOC/MOC-Lessons.md` — any LES note with "early warning signs" for this domain? These are bugs to actively avoid during implementation.
- **Apply patterns found here** — cite the PAT-NNN in code comments where used.

Print: `Brain: reusing [PAT-NNN], avoiding [LES-NNN warning]`
Skip if brain doesn't exist yet.

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

Read **in parallel** and store content in memory as `DOC_OVERVIEW`, `DOC_REQ`, `DOC_FE`, `DOC_BE`:
- `docs/sprints/[sprint-id]/[sprint-id]-overview.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md`
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`

These are injected into every sub-agent prompt — agents must NOT re-read these files.

**Section extraction rule (size guard):** Before injecting into a sub-agent, check character count:
- ≤ 6000 chars → inject full doc
- \> 6000 chars → extract only the section that agent needs (from `## Section Name` to the next `##`)

| Agent | From DOC_REQ | From DOC_FE | From DOC_BE |
|-------|-------------|-------------|-------------|
| A — FE Tests | `## Acceptance Criteria` | `## TDD Test Plan` | — |
| B — BE Tests | `## Acceptance Criteria` | — | `## TDD Test Plan` |
| C — FE Impl | `## Acceptance Criteria` | `## Implementation Plan` | — |
| D — BE Impl | `## Acceptance Criteria` | — | `## Implementation Plan` |

Validate:
- Missing requirement or empty ACs → stop: "Run `/requirement [task-id]` first."
- BOTH FE and BE design docs missing → stop: "Run `/design fe [task-id]` and `/design be [task-id]` first."
- ONE design doc missing → warn: "No `[task-id]-[frontend/backend].md` found. That layer will be skipped (HAS_FE/HAS_BE=false). Continue? (yes/no)"

Assess parallelization flags:
- `HAS_FE`: FE design doc exists and has test plan items
- `HAS_BE`: BE design doc exists and has test plan items
- `SHARED_TYPES`: FE and BE share type/interface definitions
- `HAS_MIGRATION`: BE includes DB migrations

**Context7 — fetch current library docs (if available):**
From the design docs loaded above, identify the key libraries the implementation will use (max 3 — e.g. test framework, UI component library, ORM/query builder).
For each library:
1. `mcp__plugin_context7_context7__resolve-library-id` — resolve the library name to a context7 ID.
2. `mcp__plugin_context7_context7__query-docs` — query for the specific patterns needed (test utilities, component API, query syntax, etc.).

Pass the fetched docs as context to sub-agents in Step 2 and Step 3 so they write code against current APIs.
If context7 is not available, proceed using design doc patterns and existing knowledge.

---

## Step 1b — Pre-implementation readiness check

**Iron Law:** if any implementation code for this task already exists that was written before its tests — **delete it now**. Do not keep it as reference. Rewrite from tests. See `rules/testing.md`.

For each AC in requirement: is there at least one test row in FE or BE TDD Test Plan? Flag any AC with no test → **stop**, fix design doc first.


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

## Step 2 — Write failing tests

**If `SHARED_TYPES`:** write shared type/interface files first, then proceed.

**If `HAS_FE` AND `HAS_BE`:** launch 2 parallel sub-agents:

> **Agent A — FE Tests**
> --- REQUIREMENT: ACCEPTANCE CRITERIA (apply section extraction rule) ---
> [inject `## Acceptance Criteria` section from DOC_REQ]
> ---
> --- FE DESIGN: TDD TEST PLAN (apply section extraction rule) ---
> [inject `## TDD Test Plan` section from DOC_FE]
> ---
> --- CONTEXT7 FE LIBRARY DOCS ---
> [inject fetched FE library docs from Step 1]
> ---
> WORKTREE PATH: [inject absolute worktree path from Step 0b]
> ---
> Write all test files from the TDD Test Plan above.
> Run FE tests — confirm every new test **fails** (red). Do NOT write implementation code.

> **Agent B — BE Tests**
> --- REQUIREMENT: ACCEPTANCE CRITERIA (apply section extraction rule) ---
> [inject `## Acceptance Criteria` section from DOC_REQ]
> ---
> --- BE DESIGN: TDD TEST PLAN (apply section extraction rule) ---
> [inject `## TDD Test Plan` section from DOC_BE]
> ---
> --- CONTEXT7 BE LIBRARY DOCS ---
> [inject fetched BE library docs from Step 1]
> ---
> WORKTREE PATH: [inject absolute worktree path from Step 0b]
> ---
> Write all test files from the TDD Test Plan above.
> Run BE tests — confirm every new test **fails** (red). Do NOT write implementation code.

Wait for both agents. Collect red-test confirmation.

**If only `HAS_FE` or only `HAS_BE`:** write all test files sequentially. Confirm all **fail** (red).
This is the normal path for FE-only and BE-only tasks — no error, no missing-doc warning needed.


---

## Step 3 — Implement

**If `HAS_MIGRATION`:** run DB migrations first in main context.

**If `HAS_FE` AND `HAS_BE`:** launch 2 parallel sub-agents:

> **Agent C — FE Implementation**
> --- REQUIREMENT: ACCEPTANCE CRITERIA (apply section extraction rule) ---
> [inject `## Acceptance Criteria` section from DOC_REQ]
> ---
> --- FE DESIGN: IMPLEMENTATION PLAN (apply section extraction rule) ---
> [inject `## Implementation Plan` section from DOC_FE]
> ---
> --- CONTEXT7 FE LIBRARY DOCS ---
> [inject fetched FE library docs from Step 1]
> ---
> WORKTREE PATH: [inject absolute worktree path from Step 0b]
> ---
> Implement components, routing, state, API calls, loading/error states, analytics, responsive, accessibility per the Implementation Plan above.
> Tests are already written — implement until they pass. No extras, no shortcuts.
> Run FE tests after each logical unit. Log any bugs found (do NOT run /issue — report in output).
> Final state: all FE tests green.

> **Agent D — BE Implementation**
> --- REQUIREMENT: ACCEPTANCE CRITERIA (apply section extraction rule) ---
> [inject `## Acceptance Criteria` section from DOC_REQ]
> ---
> --- BE DESIGN: IMPLEMENTATION PLAN (apply section extraction rule) ---
> [inject `## Implementation Plan` section from DOC_BE]
> ---
> --- CONTEXT7 BE LIBRARY DOCS ---
> [inject fetched BE library docs from Step 1]
> ---
> WORKTREE PATH: [inject absolute worktree path from Step 0b]
> ---
> Implement endpoints, validation, service logic, repository, event publishing, caching, logging, security per the Implementation Plan above.
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
