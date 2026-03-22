# /code-review
Workflow position: **/issue (loop) → START → /testing**

Review all code changes for this task against the design docs and ACs.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`. Register sub-tasks (wire sequentially; mark in_progress/completed at each step):
```
t1 = TaskCreate("[task-id] — review: load context")
t2 = TaskCreate("[task-id] — review: review changed files")
t3 = TaskCreate("[task-id] — review: write report")
t4 = TaskCreate("[task-id] — review: update requirement + status")
```
Mark t1 in_progress.

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs and success metrics
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — FE spec and TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — BE spec and TDD test plan

Validate: missing requirement, empty ACs, or missing design docs → stop with specific message.

Run `git diff main...HEAD` to identify all changed files.
Mark t1 completed, t2 in_progress.

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

Mark t2 completed, t3 in_progress.

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

Mark t3 completed, t4 in_progress.

---

## Step 4 — Update requirement doc and status

Update `[task-id]-requirement.md`:
- Mark each AC: `✓` fully implemented + tested · `✗` critical issue · `~` partial.
- Add **Review Summary** section: date, result, one-line note per AC.

Update BACKLOG.md status to `review`.

Mark t4 completed.

---

## Output

```
Result: APPROVED / REQUEST CHANGES

ACs: ✓ AC-1  ✗ AC-2 ← [reason]  ✓ AC-3

Next:
  Critical issues → /issue [task-id] [description]  (per issue)
  No critical issues → /testing [task-id]
```
