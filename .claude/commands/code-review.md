# /code-review
Workflow position: **/issue (loop) → START → /testing**

Review all code changes for this task against the design docs and ACs.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

1. Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Register all steps with TaskCreate — store the returned IDs:

```
t1 = TaskCreate(subject: "[task-id] — review: load context",           description: "Read requirement and design docs, run git diff to identify changed files")
t2 = TaskCreate(subject: "[task-id] — review: review changed files",   description: "Check every changed file for correctness, TDD compliance, performance, security, and code quality")
t3 = TaskCreate(subject: "[task-id] — review: write review report",    description: "Write structured review report with critical issues, minor issues, and suggestions")
t4 = TaskCreate(subject: "[task-id] — review: update requirement doc", description: "Mark each AC as passed/failed/partial and add Review Summary section")
t5 = TaskCreate(subject: "[task-id] — review: update status",          description: "Update task status to 'review' in BACKLOG.md")
```

Wire dependencies:
```
TaskUpdate(t2, addBlockedBy: [t1])
TaskUpdate(t3, addBlockedBy: [t2])
TaskUpdate(t4, addBlockedBy: [t3])
TaskUpdate(t5, addBlockedBy: [t4])
```

```
TaskUpdate(t1, status: in_progress)
```

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs and success metrics
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md` — FE spec and TDD test plan
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md` — BE spec and TDD test plan

Validate before proceeding:
- If `[task-id]-requirement.md` is missing → stop: "Cannot review without a requirement doc. Run `/requirement [task-id]` first."
- If `[task-id]-requirement.md` exists but Acceptance Criteria are all empty or unchecked placeholders → stop: "Requirement doc has no ACs. Fill them in before reviewing (run `/requirement [task-id]`)."
- If either design doc is missing → stop: "Cannot review without both design docs. Run `/fe-design` and `/be-design` first."

Run: `git diff main...HEAD` to identify all changed files.

```
TaskUpdate(t1, status: completed)
```

---

## Step 2 — Review each changed file

```
TaskUpdate(t2, status: in_progress)
```

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

```
TaskUpdate(t2, status: completed)
```

---

## Step 3 — Write the review report

```
TaskUpdate(t3, status: in_progress)
```

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

```
TaskUpdate(t3, status: completed)
```

---

## Step 4 — Update requirement with review results

```
TaskUpdate(t4, status: in_progress)
```

Update `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`:
- For each AC: mark `✓` if the review confirms it is fully implemented and tested, `✗` if it has a critical issue, `~` if partially done.
- Add a **Review Summary** section at the bottom listing: date, result (APPROVED / REQUEST CHANGES), and a one-line note per AC.

```
TaskUpdate(t4, status: completed)
```

---

## Step 5 — Update status and output next step

```
TaskUpdate(t5, status: in_progress)
```

1. Update task status in `docs/BACKLOG.md` to `review`.

```
TaskUpdate(t5, status: completed)
```

```
Review Result: APPROVED / REQUEST CHANGES

ACs status:
  ✓ AC-1: [description]
  ✗ AC-2: [description] ← [reason]

Next step:
  Critical issues found → /issue [task-id] [description]  (for each one)
  No critical issues   → /testing [task-id]
```
