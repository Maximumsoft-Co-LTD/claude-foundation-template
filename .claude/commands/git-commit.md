# /git-commit
Workflow position: **/retro-task → START → /next-task (or /retro-sprint)**

Stage and commit all changes for a completed task.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Inspect state

Parse `[task-id]`, extract `[sprint-id]`.

Run in parallel: `git status` · `git branch --show-current` · `git diff` · `git diff --staged`


---

## Step 2 — Check branch name

Expected: `[sprint-id]/[task-id]-[short-description]` — e.g. `SP1/SP1-T002-user-auth`

If branch doesn't match → warn: "Branch `[current]` doesn't follow the expected pattern. Continue? (yes/no)"


---

## Step 3 — Pre-commit sanity check

Scan changed files for:
- `console.log`, `console.error`, `debugger` in source code
- `.only` in test files
- `.env` or secret files about to be staged

Report any findings and ask the user to resolve before staging.


---

## Step 4 — Stage files selectively

Read `[task-id]-requirement.md` for context on what this task includes.

Stage by specific file path — **NEVER `git add -A` or `git add .`**:
- Include: source code, test files, everything under `docs/sprints/[sprint-id]/[task-id]/`
- Exclude: `.env`, secrets, unrelated files, binaries

Show the exact list of files and ask: "Stage these files? (yes/no/edit)"


---

## Step 5 — Draft commit message

Format: `[task-id] type: short description (max 72 chars)`
Types: `feat` `fix` `test` `docs` `refactor` `chore`

Body (add if non-trivial): explain WHY, not what — the diff shows what changed.

Show proposed message and wait for confirmation.

---

## Step 6 — Commit

After user confirms → create the commit.

---

## Step 7 — Offer to push and open PR

Ask: "Push `[branch]` and open a PR? (yes/no)"

If yes:
1. `git push -u origin [branch]`
2. Suggest `gh pr create` with: Title `[task-id] [Task Title]`, Body linking to requirement, listing ACs, linking to retro.

---

## Step 8 — Check sprint completion and output

Read `docs/BACKLOG.md` — are all tasks in `[sprint-id]` now `done`?

```
✓ Committed: [commit message]
  Branch: [branch-name]

Next:
  Sprint has open tasks → /next-task
  All sprint tasks done → /retro-sprint [sprint-id]
```
