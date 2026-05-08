# /code-review
Workflow position: **/implement (or /issue from prior loop) → START → /testing**

Review all code changes for this task against the design docs and ACs.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 0 — Verify it builds and runs

**Run before doing any static review. If this step fails, stop — do not proceed to Step 1.**

1. Run the project's build command (e.g. `npm run build`, `go build ./...`, `python -m py_compile`).
   - Build fails → stop. Log the error and tell the user to run `/issue [task-id] [build error description]` before continuing.

2. Run the fast unit test suite (not full suite — just for quick signal).
   - Any test fails → stop. Tell the user to fix failing tests via `/issue [task-id]` before review.

3. If the task includes a server/app, verify it starts cleanly (no crash on startup, no missing env var errors).

Output on pass:
```
✓ Build: passed
✓ Unit tests: X passed, 0 failed
✓ Startup: clean
Proceeding to static review...
```

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — single unified doc containing ACs, FE design, BE design, TDD test plans, Implementation Plan

Validate: missing requirement, empty ACs, empty Implementation Plan, or missing `Execution Slices` / `Plan Drift Guard` → stop with specific message.

Run `git diff main...HEAD` to identify all changed files.

---

## Step 1b — Confidence Gate

Assess confidence that you can perform a thorough, accurate code review based on all context loaded so far.

Key dimensions:
- ACs loaded and understood — every AC clear enough to verify?
- Design sections loaded — FE/BE design inside the unified requirement doc to check implementation against?
- Changed files identified — diff scope understood?
- Codebase conventions understood — can you spot deviations?
- Security and performance patterns known for this stack?

**>= 90%** → proceed to Step 2a.
**< 90%** → **STOP.** State what you know, what you don't, and what you need. Do NOT start reviewing until confidence reaches 90%. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

---

## Step 2a — Stage 1: Spec Compliance Review

**Superpowers integration:** If the superpowers plugin is available, dispatch the spec compliance reviewer using `Skill("superpowers:requesting-code-review")` — it provides a spec-document-reviewer subagent with precise context. Otherwise, perform the review inline below.

**Goal:** Does the code do what the spec says? Nothing more, nothing less.

Check every changed file against requirement + design docs:

**Plan-driven conformance**
- Invoke `plan-driven-delivery` in review mode.
- Compare the diff against `Execution Slices`, `Implementation Plan`, and `Plan Drift Guard`.
- Flag any changed file that is not covered by a slice or clearly justified by an in-plan bug fix.
- If the diff materially changed scope but the requirement doc was not updated, this is **Critical**.

**AC Coverage**
- Every AC has working code that satisfies it?
- No AC silently skipped or partially implemented?
- No extra features added beyond what ACs specify?

**Design Match**
- Implementation matches design docs (correct endpoints, components, data models)?
- API contracts match exactly (method, path, request/response shape)?
- Data models use the exact field names from design?

**TDD Compliance**
- Is there git commit evidence of red→green cycle (test commits precede implementation commits)?
- Integration tests use real DB/services — not mocks?
- Any implementation file created before its test file? (git log — test commit should come first)
- Do NOT recount rows here — `/testing` Step 3 does the exhaustive row-by-row coverage check.

**Impact-map coverage**
- If the requirement doc has an `## Impact Map` section: every Tier-1 row appears in the diff (or has a documented reason for being excluded).
- Tier-3 rows (external consumers) → check that the diff includes the contract-versioning artifact promised (new endpoint version, Sunset header, OpenAPI bump, schema migration with rolling read).
- **Missing impact-map → Critical** ONLY when the change meets the same trigger as `/implement` Step 1e (non-trivial existing surface, shared contracts, or external-consumer impact). For purely local fixes explicitly allowed to skip in `/issue` Step 2, mark Impact-map coverage as N/A with rationale instead of Critical.

**Spec verdict:** `PASS` (all ACs covered, design matched, slices honored, impact-map honored) or `FAIL` (list gaps).
If FAIL → stop. Fix spec gaps before proceeding to Stage 2.

---

## Step 2b — Stage 2: Code Quality Review

**Goal:** Is the code well-written? Only run this after Stage 1 passes.

**Context7 — verify library usage (if available):**
From `git diff main...HEAD`, identify any external library APIs used in changed files (especially any new packages added).
For each library that appears in the diff (max 3), follow `.claude/rules/context7-cache.md`:
1. **Cache check** — read `docs/sprints/[sprint-id]/.context7-cache.json`; on hit, reuse and skip both MCP calls below.
2. `mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs` — query for correct usage patterns, deprecated APIs, and security best practices.
3. Append `{libraryId, result, fetchedAt}` to the cache file.
4. Flag any usage in the diff that contradicts current docs.

If context7 is not available, proceed using codebase patterns and existing knowledge.

**Performance**
- N+1 query risk (loops triggering DB calls)?
- Unnecessary re-renders or missing memoization on FE?
- Heavy synchronous ops that should be async or queued?

**Security**
- No SQL injection, XSS, command injection, path traversal.
- No secrets or tokens committed.
- Authorization checks present (not just authentication)?
- User input validated at system boundary?

**Complexity**
- Is the change more complex than the ACs require?
- Any speculative abstraction, generic helper, or config surface added without a second use case?
- Any control flow that is harder to review than the simpler alternative?

**Code Quality**
- No `console.log`, `debugger`, `.only` left in.
- No premature abstractions. 3 similar lines > a utility.
- New packages added? Justified, license acceptable?
- All async operations have error handling?

**Tests**
- Do tests fail for the right reason, or only because of incidental setup?
- Does the change rely on E2E/browser coverage where a smaller unit/integration test should exist?
- Are assertions tied to ACs and contract behavior instead of implementation trivia?

**Edge Cases**
- Empty states, null/undefined, boundary values handled?
- Errors surfaced to the user — not silently swallowed?

**Style / nits**
- Pure naming/formatting nits are suggestions, not blockers, unless they hide a design or readability problem.

**Risk-register evidence**
- **Required-but-missing → Critical:** if `/implement` Step 1e triggers apply (migration · auth · payment · public API · removed cron · destructive/irreversible op) but no `## Risk Register` section exists in the requirement doc → automatic Critical finding.
- If a `## Risk Register` section exists, then:
  - Every "Must-mitigate-before-merge = Yes" row has its Verification column filled with concrete evidence (terminal output, test name + green, EXPLAIN plan, k6 numbers).
  - Rollback plans are present for high-severity rows.
  - 🔴🔴 No-rollback rows (irreversible: column drop, document deletion) → require sign-off note in the review.
  - Missing verification evidence on a Must-mitigate row → automatic Critical finding.


---

## Step 3 — Write the review report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Code Review: [task-id] — [User Story]
Result: APPROVED / REQUEST CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Critical (must fix before merge):
  ☐ [issue]

Minor (should fix):
  ☐ [issue]

Suggestions (non-blocking):
  • [suggestion]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```


---

## Step 3b — Self-check before updating docs

Re-read the review report just written and verify:
- [ ] Every AC from the requirement doc is addressed — none silently skipped.
- [ ] Every changed file is either covered by an `Execution Slice` or explicitly justified as an in-plan bug fix.
- [ ] Critical / Minor / Suggestions sections are present; none left empty if issues were found.
- [ ] Result (`APPROVED` / `REQUEST CHANGES`) is consistent with the issues listed.
- [ ] No changed file from `git diff` was omitted from the review.
- [ ] Security and TDD Compliance sections were explicitly checked — not just assumed OK.

Fix any gap found before updating docs.

---

## Step 3c — Receiving review feedback (when issues found)

**Superpowers integration:** If the superpowers plugin is available, invoke `Skill("superpowers:receiving-code-review")` before implementing any feedback — it enforces technical evaluation over performative agreement.

If the review found Critical or Minor issues, follow this protocol when fixing:

**Response pattern:**
1. **Read** — complete feedback without reacting.
2. **Understand** — restate the technical requirement in own words.
3. **Verify** — check against codebase reality. Is the feedback correct for THIS codebase?
4. **Evaluate** — technically sound? Or does the reviewer lack context?
5. **Implement** — one item at a time, test each fix individually.

**When to push back (with technical reasoning):**
- Suggestion breaks existing functionality
- Reviewer lacks full context (e.g., legacy/compatibility reasons)
- Violates YAGNI — grep codebase, if unused, don't add
- Conflicts with architectural decisions in design docs

**Implementation order for multi-issue feedback:**
1. Blocking issues (breaks, security)
2. Simple fixes (typos, imports)
3. Complex fixes (refactoring, logic)
4. Test each fix individually → verify no regressions

**Never:** blind implementation without verification, performative agreement ("Great point!"), batch multiple fixes without testing each.

---

## Step 3d — Auto-handoff to /issue on critical findings

If the review report in Step 3 lists **any** issues under "Critical (must fix before merge)", do not finish here — open them as tracked issues before proceeding:

1. For each Critical line, invoke `/issue [task-id] "[critical issue description]"` (one invocation per item). This runs investigation + TDD fix + appends to `[task-id]-issues.md` per the existing `/issue` flow.
2. After all `/issue` runs return, re-run Step 0 (build + tests) and re-evaluate the AC table — fixes may have changed the verdict.
3. If the result flips to `APPROVED`, update Step 3's report block accordingly. If new Critical issues surfaced from the fixes, loop again — don't proceed with critical issues outstanding.

Major and Minor findings stay logged inline (Step 3) and are surfaced in the output below — they don't auto-trigger `/issue` but the user can elect to `/issue` them manually.

---

## Step 4 — Update requirement doc and status

Update `[task-id]-requirement.md`:
- Mark each AC: `✓` fully implemented + tested · `✗` critical issue · `~` partial.
- Add **Review Summary** section: date, result, one-line note per AC.
- If review found material plan drift, update `Plan Drift Guard` or return the task to `/requirement` instead of silently accepting the drift.

Update BACKLOG.md status to `review`.

---

## Output

```
Result: APPROVED / REQUEST CHANGES

ACs: ✓ AC-1  ✗ AC-2 ← [reason]  ✓ AC-3
Plan drift: none / return to /requirement
Critical issues filed: [N] (auto via /issue)

Next:
  Major/Minor issues → /issue [task-id] [description]  (per issue, optional)
  No outstanding issues → /testing [task-id]
```
