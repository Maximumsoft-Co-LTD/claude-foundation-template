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

## Step 2 — Review each changed file

Check every file against:

**Correctness**
- Every AC has working code that satisfies it?
- Implementation matches design docs (correct endpoints, components, data models)?

**TDD Compliance**
- Test for every row in both TDD Test Plan tables?
- Integration tests use real DB/services — not mocks?

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
Code Review: [task-id] — [Task Title]
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
