# /issue
Workflow position: **implement (loop) → START → /code-review**

Log and resolve a bug found during implementation using TDD.
Arguments: `[task-id] [issue description]`  — e.g. `SP1-T002 API returns 500 when email is null`

---

## Step 1 — Parse, classify, load context

Parse `[task-id]` and `[issue description]`, extract `[sprint-id]`.

Classify severity:
- **critical** — blocks the task or breaks existing functionality
- **major** — AC not met but workaround exists
- **minor** — cosmetic, performance, or edge case not in ACs

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — which AC does this violate?
- Relevant design doc (`[task-id]-frontend.md` or `[task-id]-backend.md`) — expected behavior?


---

## Step 2 — Investigate

Read relevant source files to find the root cause.
- Do NOT retry the same approach more than twice. If stuck → document and ask the user.
- Identify root cause, not just the symptom.


---

## Step 3 — Fix using TDD

1. Write a **failing test** that reproduces the bug. Run it — confirm it fails.
2. Fix the code so the test passes.
3. Run the full test suite — confirm no regressions.
4. Keep the fix minimal.


---

## Step 4 — Assess impact

Does this bug affect other tasks in the sprint?
- If yes → update their status to `blocked` in `docs/BACKLOG.md` and note the dependency.


---

## Step 5 — Append to issues file

Append one issue entry to `docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md` (create from `docs/templates/ISSUE-TEMPLATE.md` if it doesn't exist).

---

## Output

```
✓ Issue logged: docs/sprints/[sprint-id]/[task-id]/[task-id]-issues.md
  Severity: [level]  |  Test added: yes/no  |  Blocks: [list or none]

Next: /testing [task-id]
```

If unresolvable → document as `status: blocked`, list what information is needed, ask the user.
