# /issue
Workflow position: **implement (loop) → START → /code-review**

Log and resolve a bug found during implementation using TDD.
Arguments: $ARGUMENTS
Format: `[task-id] [issue description]`  — e.g. `SP1-T002 API returns 500 when email is null`

---

## Step 1 — Parse and classify

1. Parse `[task-id]` and `[issue description]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).
2. Classify severity immediately:
   - **critical** — blocks the task or breaks existing functionality
   - **major** — AC not met but workaround exists
   - **minor** — cosmetic, performance, or edge case not in ACs

Register all steps with TaskCreate — store the returned IDs:

```
t1 = TaskCreate(subject: "[task-id] — issue: classify + load context", description: "Classify severity and read requirement/design docs to identify which AC is violated")
t2 = TaskCreate(subject: "[task-id] — issue: investigate root cause",  description: "Read source files and identify root cause, not just symptom")
t3 = TaskCreate(subject: "[task-id] — issue: document before fixing",  description: "Write reproduce steps, expected vs actual behavior, and root cause")
t4 = TaskCreate(subject: "[task-id] — issue: fix using TDD",           description: "Write failing test that reproduces the bug, fix code, confirm no regressions")
t5 = TaskCreate(subject: "[task-id] — issue: assess impact",           description: "Check if bug affects other tasks in sprint and update their status if blocked")
t6 = TaskCreate(subject: "[task-id] — issue: append to issues file",   description: "Append issue record to [task-id]-issues.md")
```

Wire dependencies:
```
TaskUpdate(t2, addBlockedBy: [t1])
TaskUpdate(t3, addBlockedBy: [t2])
TaskUpdate(t4, addBlockedBy: [t3])
TaskUpdate(t5, addBlockedBy: [t4])
TaskUpdate(t6, addBlockedBy: [t5])
```

```
TaskUpdate(t1, status: in_progress)
```

---

## Step 2 — Load context

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — which AC does this violate?
- The relevant design file (`[task-id]-frontend.md` or `[task-id]-backend.md`) — what was the expected behavior?

```
TaskUpdate(t1, status: completed)
```

---

## Step 3 — Investigate

```
TaskUpdate(t2, status: in_progress)
```

Read relevant source files to find the root cause.
- Do NOT retry the same approach more than twice. If blocked → document and ask the user.
- Identify: root cause, not just the symptom.

```
TaskUpdate(t2, status: completed)
```

---

## Step 4 — Document before fixing

```
TaskUpdate(t3, status: in_progress)
```

Write down:
- **Steps to reproduce** (numbered, exact)
- **Expected behavior** (from the design doc or AC)
- **Actual behavior** (what currently happens)
- **Root cause** (why it happens)

```
TaskUpdate(t3, status: completed)
```

---

## Step 5 — Fix using TDD

```
TaskUpdate(t4, status: in_progress)
```

1. Write a **failing test** that reproduces the bug — run it to confirm it fails.
2. Fix the code so the test passes.
3. Run the full test suite to confirm no regressions.
4. Keep the fix minimal — only change what is necessary.

```
TaskUpdate(t4, status: completed)
```

---

## Step 6 — Assess impact

```
TaskUpdate(t5, status: in_progress)
```

Does this bug affect other tasks in the sprint?
- If yes → update their status to `blocked` in `docs/BACKLOG.md` and note the dependency.

```
TaskUpdate(t5, status: completed)
```

---

## Step 7 — Append to issues file

```
TaskUpdate(t6, status: in_progress)
```

Append to `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (create if it doesn't exist).

If creating the file for the first time, use `docs/templates/ISSUE-TEMPLATE.md` as the starting structure (replace `[task-id]` and `[Task Title]` in the header, then fill in the first issue section).

If the file already exists, append a new section using this format:

```markdown
## Issue: [short title]
**Date:** [today]
**Severity:** critical / major / minor

### Description
[what went wrong]

### Steps to Reproduce
1.
2.

### Expected
[from design/AC]

### Actual
[what happened]

### Root Cause
[why]

### Fix
[what was changed and why]

### Test Added
[test file:line — or "none"]

### Blocks
[task-id list — or "none"]

---
```

```
TaskUpdate(t6, status: completed)
```

---

## Step 8 — Output

```
✓ Issue logged: docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md
  Severity: [level]
  Test added: [yes/no]
  Blocks other tasks: [yes: list / no]

Next step: /testing [task-id]
```

If unresolvable → document as `status: blocked`, list what information is needed, and ask the user directly.
