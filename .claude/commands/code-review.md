# /code-review
Workflow position: **/issue (loop) → START → /testing**

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
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs and success metrics
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — FE spec and TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — BE spec and TDD test plan

Validate: missing requirement, empty ACs, or missing design docs → stop with specific message.

Run `git diff main...HEAD` to identify all changed files.

---

## Step 2a — Stage 1: Spec Compliance Review

**Superpowers integration:** If the superpowers plugin is available, dispatch the spec compliance reviewer using `Skill("superpowers:requesting-code-review")` — it provides a spec-document-reviewer subagent with precise context. Otherwise, perform the review inline below.

**Goal:** Does the code do what the spec says? Nothing more, nothing less.

Check every changed file against requirement + design docs:

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

**Spec verdict:** `PASS` (all ACs covered, design matched) or `FAIL` (list gaps).
If FAIL → stop. Fix spec gaps before proceeding to Stage 2.

---

## Step 2b — Stage 2: Code Quality Review

**Goal:** Is the code well-written? Only run this after Stage 1 passes.

**Context7 — verify library usage (if available):**
From `git diff main...HEAD`, identify any external library APIs used in changed files (especially any new packages added).
For each library that appears in the diff (max 3):
1. `mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs` — query for correct usage patterns, deprecated APIs, and security best practices.
2. Flag any usage in the diff that contradicts current docs.

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

**Code Quality**
- No `console.log`, `debugger`, `.only` left in.
- No premature abstractions. 3 similar lines > a utility.
- New packages added? Justified, license acceptable?
- All async operations have error handling?

**Edge Cases**
- Empty states, null/undefined, boundary values handled?
- Errors surfaced to the user — not silently swallowed?


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

## Step 4 — Update requirement doc and status

Update `[task-id]-requirement.md`:
- Mark each AC: `✓` fully implemented + tested · `✗` critical issue · `~` partial.
- Add **Review Summary** section: date, result, one-line note per AC.

Update BACKLOG.md status to `review`.

---

## Output

```
Result: APPROVED / REQUEST CHANGES

ACs: ✓ AC-1  ✗ AC-2 ← [reason]  ✓ AC-3

Next:
  Critical issues → /issue [task-id] [description]  (per issue)
  No critical issues → /testing [task-id]
```
