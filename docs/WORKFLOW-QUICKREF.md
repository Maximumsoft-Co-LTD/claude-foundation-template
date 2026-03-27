# Workflow Quick Reference

One-page manual for the Claude Code workflow template.
Full command details: `.claude/commands/`. Full rules: `CLAUDE.md` + `.claude/rules/`.

---

## A. FLOW DIAGRAM

### Single-Task Flow (Sequential)

```
START
  │
  ▼
/discovery [disc-id] [name]
  │  Step 3b ── HARD-GATE: pick approach ──▶ wait for user choice
  ▼
/new-sprint [sprint-id] "epic description"
  │  Step 3 ── confirms task breakdown ──▶ wait for user confirm
  ▼
/requirement [task-id]
  │  Step 3 ── presents drafted ACs ──▶ wait for user confirm
  ▼
/design fe [task-id]          ← skip if BE-only task (no UI changes)
  │  Step 1b ── clarify gaps ──▶ wait if ambiguities found
  ▼
/design be [task-id]          ← skip if FE-only task (no API changes)
  │  Step 1b ── clarify gaps ──▶ wait if ambiguities found
  ▼
/implement [task-id]
  │  Step 2: write all failing tests (RED first, always)
  │  Step 3: implement until all tests GREEN
  │  Step 4: fresh full-suite verification (no exceptions)
  │
  │  bug found? ──▶ /issue [task-id] [desc] ──▶ fix ──▶ return here
  ▼
/code-review [task-id]
  │  Stage 1: spec compliance (ACs + design match)
  │  Stage 2: code quality (perf, security, edge cases)
  │
  │  critical issues? ──▶ /issue [task-id] [desc] ──▶ fix ──▶ re-review
  ▼ (APPROVED)
/testing [task-id]
  │  Steps 3-4: every TDD/E2E plan row → verify test exists, run suite
  │  Step 6: production readiness gate (E2E or manual browser verify)
  │
  │  failures or missing tests? ──▶ /issue [task-id] [desc] ──▶ re-run
  ▼ (all ACs: READY)
/retro-task [task-id]
  ▼
/git-commit [task-id]
  │  Step 5 ── HARD-GATE: confirm staged files ──▶ wait for yes/no/edit
  │  Step 8: choose merge / PR / keep / discard
  │
  ├──▶ more tasks in sprint? ──▶ /next-task ──▶ /requirement [next-id]
  │
  ▼  all tasks done
/retro-sprint [sprint-id]
  │  (brain update runs as Step 6 — no separate command)
  ▼
END → /discovery [next-disc-id] (next epic)
```

### Multi-Task Flow (Parallel)

```
/new-sprint → /run-tasks [task-id] [task-id] ...
     │
     ├── Phase 1: PLAN (all tasks in parallel per tier)
     │     requirement → cross-task alignment
     │     → fe-design  → cross-task alignment
     │     → be-design  → final consistency check
     │     ── ⏸ HARD-GATE: user reviews all plans
     │        "go" | "edit [task-id] [instruction]" | "skip [task-id]"
     │
     └── Phase 2: IMPLEMENT (all tasks in parallel per tier)
           implement → spec review → quality review + testing → retro-task
           (3-agent pipeline per task — no separate /code-review needed)
           │
           └── /git-commit per task → /retro-sprint when all done
```

---

## B. COMMAND CHEAT SHEET

| Command | When | Args | Gate (must be true to run) | Next |
|---------|------|------|---------------------------|------|
| `/discovery` | Before any sprint planning | `[disc-id] [name]` | None | User picks approach → `/new-sprint` |
| `/new-sprint` | After approach approved | `[sprint-id] "epic"` | Discovery doc exists (or explicit override) | User confirms tasks → `/requirement` or `/run-tasks` |
| `/requirement` | Before designing any task | `[task-id]` | Task exists in BACKLOG.md | User confirms ACs → `/design fe` |
| `/design fe` | After requirement confirmed | `[task-id]` | `[task-id]-requirement.md` has non-empty ACs | Clarifications answered (if any) → `/design be` |
| `/design be` | After FE design saved | `[task-id]` | `[task-id]-requirement.md` has non-empty ACs | Clarifications answered (if any) → `/implement` |
| `/implement` | After design docs complete | `[task-id]` | Design docs exist with TDD test plans | All tests green → `/code-review` |
| `/issue` | Bug with known cause, during impl or review | `[task-id] [desc]` | Inside an active sprint task | Returns to calling command (implement or code-review) |
| `/debug` | Unknown root cause, flaky test, regression | `[task-id?] [desc]` | None — standalone | After fix: `/issue [task-id]` if sprint task |
| `/code-review` | After impl verified | `[task-id]` | Build passes, unit tests green | APPROVED → `/testing`; critical issues → `/issue` |
| `/testing` | After code-review approved | `[task-id]` | Status is `review` | All ACs READY → `/retro-task`; failures → `/issue` |
| `/retro-task` | After all tests pass | `[task-id]` | Status is `testing` | `/git-commit` |
| `/git-commit` | After retro written | `[task-id]` | `[task-id]-retro.md` exists | Merge/PR/keep/discard → `/next-task` or `/retro-sprint` |
| `/next-task` | After committing, to pick up next task | `[task-id?]` | Previous task committed | → `/requirement [next-id]` |
| `/retro-sprint` | After ALL tasks in sprint are `done` | `[sprint-id]` | Every task in sprint is `done` | Brain update runs as Step 6 → `/discovery` (next epic) |
| `/run-tasks` | To run multiple tasks in parallel | `[task-id] [task-id]...` | Tasks exist in BACKLOG.md as `todo` | Phase 1 → user "go" → Phase 2 → `/git-commit` per task |

### When to use `/issue` vs `/debug`

| Situation | Command |
|-----------|---------|
| Bug found during active implementation — you know what broke | `/issue [task-id] [desc]` |
| Bug found after code-review — specific failing check | `/issue [task-id] [desc]` |
| Unknown root cause — symptom without clear origin | `/debug [task-id] [desc]` |
| Flaky test, intermittent failure, unexpected regression | `/debug [task-id] [desc]` |
| Production incident — no sprint context | `/debug [desc]` (no task-id) |

**Rule:** `/debug` is investigation-first. `/issue` is fix-first (calls `/debug` Phases 1-3 internally). When in doubt: if you can name the likely root cause, use `/issue`. If you're guessing, use `/debug` first.

---

## C. HARD GATES

Every gate below is a mandatory stop. Do not proceed until the condition is met.

```
┌──────────────────────────────────────────────────────────────────┐
│ GATE 1 — Approach Approval                                       │
│ Command: /discovery Step 3b                                      │
│ Stop: until user explicitly picks an approach (number, alt, or   │
│ "go with recommendation"). "skip gate" is valid only if obvious. │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ GATE 2 — Task Breakdown Confirmation                             │
│ Command: /new-sprint Step 3                                      │
│ Stop: present sub-task table, wait for user to confirm or edit.  │
│ Do not write docs until user says "confirm."                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ GATE 3 — Requirement AC Confirmation                             │
│ Command: /requirement Step 3                                     │
│ Stop: print full drafted requirement, wait for "confirm" or      │
│ edits. Do not save until explicitly confirmed.                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ GATE 4 — Design Clarification (FE and BE)                        │
│ Command: /design fe Step 1b, /design be Step 1b                  │
│ Stop: if ambiguities exist, collect ALL into one message, wait   │
│ for answers before writing any design. Never ask one-by-one.     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ GATE 5 — Plan Review (run-tasks only)                            │
│ Command: /run-tasks Step 5                                       │
│ Stop: show all plans. Wait for user reply.                       │
│   "go"                        → start Phase 2                   │
│   "edit [task-id] [instr]"    → revise plan, re-show gate       │
│   "skip [task-id]"            → drop task from Phase 2          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ GATE 6 — Staging Confirmation                                    │
│ Command: /git-commit Step 5                                      │
│ Stop: show exact file list, wait for "yes / no / edit."          │
│ NEVER run git add -A or git add . without user confirmation.     │
└──────────────────────────────────────────────────────────────────┘
```

---

## D. ESCAPE HATCHES

Standard flow deviations — documented patterns for common real-world scenarios.

---

### Hotfix (urgent production bug, no sprint context)

```
1. /debug [description]                 ← root cause first, always
2. Write failing test (RED) → implement fix → GREEN → full suite
3. git checkout -b hotfix/[desc]
4. /git-commit (no task-id — commit manually with type: fix)
5. /pr-create skill → merge to main
6. Post-fix: create a 1pt task in nearest sprint to track the fix
   and run /retro-task for it
```

---

### FE-Only Task (no backend changes)

```
1. /requirement [task-id]               ← scope ACs to UI only
2. /design fe [task-id]                 ← full FE design
3. SKIP /design be                      ← no [task-id]-backend.md needed
4. /implement [task-id]                 ← HAS_BE=false; BE agents not launched
5. /code-review → /testing → /retro-task → /git-commit  ← as normal

Notes:
- E2E tests still required. Call real API (existing endpoints, test env).
- /implement validation: missing backend.md is expected — not an error.
- If /implement warns "missing design docs": reply "BE-only skip, continue."
```

---

### BE-Only Task (pure API, infrastructure, no UI changes)

```
1. /requirement [task-id]               ← scope ACs to API behavior only
2. SKIP /design fe                      ← no [task-id]-frontend.md needed
3. /design be [task-id]                 ← full BE design
4. /implement [task-id]                 ← HAS_FE=false; FE agents not launched
5. /code-review → /testing → /retro-task → /git-commit  ← as normal

Notes:
- Integration tests MUST use real DB. No mocks at integration layer.
- E2E: test via real HTTP calls to the API (Postman, curl, or test client).
- Mark task type=infra in BACKLOG.md if no user-visible outcome.
```

---

### Exploratory Spike (research task, no deliverable code)

```
1. Create spike task in BACKLOG.md: type=spike, points=2-3
2. /requirement [task-id]
   Frame ACs as questions: "Given [problem], when [explored],
   then [decision documented with evidence and rationale]."
3. SKIP /design fe, /design be, /implement, /code-review, /testing
4. Conduct research: read docs, prototype throwaway code, compare options
5. Write findings as:
   - docs/discovery/[disc-id]-[name].md  (if leading to a sprint), OR
   - brain/02-decisions/DEC-NNN-[slug].md  (if a settled decision)
6. /retro-task [task-id]
7. /git-commit [task-id]  ← commit docs only, no production code

Result: a discovery doc or brain DEC note that informs the next sprint.
Throwaway prototype code is NOT committed.
```

---

### Blocked Task (waiting on external dependency)

```
1. /issue [task-id] [blocker description]   ← log with severity=critical
2. Update BACKLOG.md status to `blocked`, note dependency
3. /next-task                               ← pick up next todo task
4. When blocker resolves:
   - Update /issue log (add resolution note)
   - Revert status to `in-progress` in BACKLOG.md
   - Continue from the step where you stopped
   - If blocker caused design changes → update design doc, re-run /code-review
```

---

### Multi-Sprint Epic (scope too large for one sprint)

```
1. /discovery [disc-id] [name]             ← covers full epic
2. /new-sprint SP1                         ← scope to first deliverable
   vertical slice only ("User can do X end-to-end")
3. Complete SP1 fully: /retro-sprint (includes brain update)
4. /new-sprint SP2                         ← next slice
   Read SP1 brain decisions before designing SP2 tasks.

Rules:
- Task IDs never reset. SP2 tasks start from (highest SP1 task number + 1).
- Each sprint must be independently deployable — no "SP1 sets up, SP2 delivers."
- If SP1 task has an 8pt task: break it before starting, do not carry it to SP2.
```

---

## E. TDD CHEAT SHEET

### Iron Law (no exceptions, ever)

```
1. Write the failing test FIRST — before any implementation code.
2. Run it. Confirm it FAILS with an expected message (not a crash).
   If it passes immediately: you are testing existing behavior. Fix the test.
3. Implement the MINIMUM code to make it pass.
4. Run FULL suite. Confirm GREEN with zero regressions.
5. Found code written before its test? DELETE IT.
   Rewrite implementation fresh, starting from Step 1.
   "Keeping as reference" biases the test — it is not allowed.
```

### Integration Tests: No Mocks

```
Integration layer = real DB, real queue, real HTTP.
Unit layer = mocks allowed for external calls.
Never mock at integration layer. If setup is hard, fix the setup — not the rule.
```

### Rationalization Red Flags

Stop if you hear yourself think any of these:

| Excuse | Why it's wrong |
|--------|----------------|
| "Too simple to test" | Simple code breaks. The test takes 30 seconds. |
| "I'll write tests after" | Tests that pass immediately prove nothing — they test existing behavior. |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, no re-run, not trusted. |
| "Deleting X hours of work is wasteful" | Sunk cost. Unverified code is hidden tech debt with interest. |
| "Need to explore first" | Fine — throw away the exploration. Then start with TDD. |
| "Test is hard to write" | Listen: hard to test = hard to use. Simplify the design first. |
| "Just this once" | No exceptions. Each skip makes the next skip feel easier. |

---

## F. STORY POINT QUICK GUIDE

### Size → Required Documents

| Points | Size | Docs Required |
|--------|------|---------------|
| **1** | Trivial | Req: Problem + ACs (min 2-3) + Out of Scope + DoD<br>FE: Approach + Component list + 1 TDD test/AC<br>BE: Endpoint spec + 1 TDD test/AC |
| **2** | Small | + User Stories + Dependencies<br>+ Component Breakdown + API Contracts + State flow + Fail State table<br>+ Input Validation + TDD (happy path + key error/AC) |
| **3** | Medium | + Feature Flow (mermaid) + Business Rules + Success Metrics<br>+ UI/UX Overview + Loading States + Impl Plan + E2E Tests + Fail Case Matrix<br>+ Data Models + Service Layer + Business Logic + Error Handling + Impl Plan |
| **5** | Large | All sections (most required)<br>+ User Journey + Behavior Mapping + Routing + Analytics + A11y + Perf<br>+ Auth Matrix + Sequence Diagram + Security + Logging + Env Vars + Migrations |
| **8** | X-Large | All sections + ADR entries for non-obvious choices + Perf benchmarks<br>All sections + Class Diagram + Caching + Rollback Plan |
| **13** | ⛔ Too Big | STOP. Break into smaller tasks before any work begins. |

### Required Documents by Task Type

| Task Type | Requirement | FE Design | BE Design |
|-----------|-------------|-----------|-----------|
| Full-stack | ✓ | ✓ | ✓ |
| FE-only | ✓ | ✓ | — |
| BE-only / infra | ✓ | — | ✓ |
| Spike | ✓ (questions as ACs) | — | — |
| Hotfix | — | — | — (use /debug directly) |

### Common Sizing Mistakes

| Mistake | Fix |
|---------|-----|
| "Auth system" (8pt as single task) | Split: login AC / token refresh / logout / session expiry |
| "Build dashboard" (13pt) | Split by widget or data domain |
| "API endpoint + FE form" — called 1pt | Usually 3pt — form state, validation, error display, API integration |
| Any task touching >3 files across layers | Likely 3pt minimum |

---

## G. OPTIONAL SKILLS — WHERE TO INSERT

Skills extend the workflow with optional quality gates. See `_WORKFLOW-REF.md` for full list.

| Skill | Insert After | Purpose |
|-------|-------------|---------|
| `/db-schema-review [task-id]` | `/design be` | Review schema before writing any code |
| `/security-review [task-id]` | `/implement` | Secrets, injection, insecure defaults, dep risk |
| `/accessibility-review [task-id]` | `/testing` | WCAG 2.1 AA audit for FE tasks |
| `/test-coverage [task-id]` | `/testing` | Coverage gaps mapped to ACs |
| `/adr [task-id] [title]` | During `/design fe` or `/design be` | Record a non-trivial architectural decision |
| `/pr-create [task-id]` | `/git-commit` (Option 2) | Push branch + open PR with pre-filled body |
| `/session-handoff [task-id]` | End of any mid-task session | Serialize context for resumption |
| `/refactor [task-id]` | After `/retro-task` | Safe, test-first tech-debt restructuring |
