# /code-review
Workflow position: **/issue (loop) → START → /testing**

Review all code changes for this task against the design docs and ACs.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs and success metrics
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — FE spec and TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — BE spec and TDD test plan

Run: `git diff main...HEAD` to identify all changed files.

---

## Step 2 — Review each changed file

Check every file against these criteria:

### Correctness
- Does every AC from `[task-id]-requirement.md` have working code that satisfies it?
- Does the implementation match the design docs (correct endpoints, components, data models)?

### TDD Compliance
- Is there a test for every row in both TDD Test Plan tables?
- Integration tests use real DB/services — not mocks?

### Performance
- Any N+1 query risk? (loops that trigger DB calls)
- Unnecessary re-renders or missing memoization on the FE?
- Heavy synchronous operations that should be async or queued?

### Security
- No SQL injection, XSS, command injection, path traversal.
- No secrets, API keys, or tokens committed.
- Authorization checks present — not just authentication?
- User input validated at system boundary?

### Code Quality
- No `console.log`, `debugger`, or `.only` left in.
- No premature abstractions. 3 similar lines > a premature utility.
- New packages added? Justified and license acceptable?
- All async operations have error handling?

### Edge Cases
- Empty states, null/undefined, boundary values handled?
- Errors surfaced to the user — not silently swallowed?

---

## Step 3 — Write the review report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Code Review: [task-id] — [Task Title]
Result: APPROVED / REQUEST CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Critical Issues (must fix before merge):
  ☐ [issue description]

Minor Issues (should fix):
  ☐ [issue description]

Suggestions (non-blocking):
  • [suggestion]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Step 4 — Update requirement with review results

Update `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`:
- For each AC: mark `✓` if the review confirms it is fully implemented and tested, `✗` if it has a critical issue, `~` if partially done.
- Add a **Review Summary** section at the bottom listing: date, result (APPROVED / REQUEST CHANGES), and a one-line note per AC.

---

## Step 5 — Update status and output next step

1. Update task status in `docs/BACKLOG.md` to `review`.
2. Output:

```
Review Result: APPROVED / REQUEST CHANGES

ACs status:
  ✓ AC-1: [description]
  ✗ AC-2: [description] ← [reason]

Next step:
  Critical issues found → /issue [task-id] [description]  (for each one)
  No critical issues   → /testing [task-id]
```
