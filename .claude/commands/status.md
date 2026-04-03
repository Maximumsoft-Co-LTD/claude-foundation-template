# /status
Workflow position: **read-only — use any time to check sprint progress and next steps**

Show the current sprint state without making any changes. Reports progress counts, infers each in-progress task's last completed step from its doc files, and suggests the next action per task.

Arguments: none

---

## Step 1 — Detect active sprint

Read `docs/BACKLOG.md`.

- Find the most recent sprint section (highest sprint number) that contains at least one task NOT in `done` status.
- If **no sprint exists at all** → stop and output:
  ```
  No sprint found.
  Next: /new-sprint [sprint-id] [description]
  ```
- If **all tasks in all sprints are `done`** → stop and output:
  ```
  All tasks complete.
  Next: /retro-sprint [most-recent-sprint-id]
  ```
- Otherwise, record active `[sprint-id]` and its task list for Step 2.

---

## Step 2 — Count sprint progress

From the active sprint's task rows in `docs/BACKLOG.md`, tally:

- `done` — tasks with status `done`
- `in-progress` — tasks with status `in-progress`
- `review` or `testing` — tasks with those statuses (count together as `in-progress` for display)
- `todo` — tasks with status `todo`
- `blocked` — tasks with status `blocked`

Total points: sum the Points column, excluding rows with `-`.

---

## Step 3 — Infer step for each non-done task

For every task that is NOT `done`, check which doc files exist under `docs/sprints/[sprint-id]/[task-id]/` and apply this inference in order (stop at the first match):

| Condition | Last completed step | Suggested next action |
|-----------|--------------------|-----------------------|
| Directory does not exist OR no `[task-id]-requirement.md` | Sprint planning | `/requirement [task-id]` |
| `[task-id]-requirement.md` exists, no `[task-id]-frontend.md` AND no `[task-id]-backend.md` | `/requirement` | `/design fe [task-id]` |
| `[task-id]-frontend.md` exists, no `[task-id]-backend.md` | `/design fe` | `/design be [task-id]` |
| `[task-id]-backend.md` exists, no `[task-id]-retro.md` and no `[task-id]-implement` evidence | `/design be` | `/implement [task-id]` |
| `[task-id]-issues.md` exists — count lines matching open issue pattern (lines starting with `- [ ]` or status `open`) | (show alongside step) | Resolve open issues first |

"Implement evidence" means any file whose name contains `-implement` in the task directory.

For `review` or `testing` status tasks, note the status explicitly rather than inferring from files.

---

## Step 4 — Format and print the status card

Print the status card. Do NOT write to any file.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprint Status — [sprint-id]: [Epic Title]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Progress: [done] done / [in-progress] in-progress / [todo] todo / [blocked] blocked
Points:   [done-pts] / [total-pts] pts complete

Tasks
─────────────────────────────────────────────────────
[task-id]  [user story]                       [status]
  Last step : [last-completed-step]
  Next      : [suggested-command]
  [⚠ N open issues — resolve before implementing]   ← only if issues file has open items

[task-id]  [user story]                       [status]
  Last step : [last-completed-step]
  Next      : [suggested-command]

─────────────────────────────────────────────────────
[If any blocked tasks:]
Blocked
  [task-id]  [user story] — blocked by: [depends_on or "see issues file"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Rules for the card:
- Omit the "Blocked" section entirely if no tasks are blocked.
- Omit the open-issues line per task if no issues file exists or it has no open items.
- List tasks in the same order they appear in `BACKLOG.md`.
- Do not print done tasks in the Tasks section (they are captured in the Progress count).
- `[⚠ N open issues]` line is indented to align with `Next`.

---

## Output

```
(status card printed inline — no files written)

Run any suggested command above, or:
  /next-task              ← jump to highest-priority todo task
  /retro-sprint [sprint-id]  ← only when all tasks are done
```
