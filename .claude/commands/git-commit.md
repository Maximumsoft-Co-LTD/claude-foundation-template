# /git-commit
Workflow position: **/retro-task → START → /next-task (or /retro-sprint if sprint complete)**

Stage and commit all changes for a completed task.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Parse and inspect current state

Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Run in parallel:
- `git status` — all changed and untracked files
- `git branch --show-current` — current branch name
- `git diff` — unstaged changes
- `git diff --staged` — already staged changes

---

## Step 2 — Check branch name

Expected pattern: `[sprint-id]/[task-id]-[short-description]`
Example: `SP1/SP1-T002-user-auth`

If the branch doesn't match this pattern → warn the user:
> "Branch `[current]` doesn't follow the expected pattern `[sprint-id]/[task-id]-[desc]`. Continue anyway? (yes/no)"

---

## Step 3 — Pre-commit sanity check

Scan changed files for:
- `console.log`, `console.error`, `debugger` left in source code
- `.only` in test files (scoped tests that would hide failures)
- `.env` or files containing secrets about to be staged

Report any findings and ask the user to resolve before staging.

---

## Step 4 — Stage files selectively

Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` for context on what this task includes.

Stage by specific file path — NEVER `git add -A` or `git add .`:
- **Include:** source code, test files, and everything under `docs/sprints/[sprint-id]/[task-id]/`
- **Exclude:** `.env`, secrets, unrelated files, binary files

Show the user the exact list of files to be staged and ask: "Stage these files? (yes/no/edit)"

---

## Step 5 — Draft commit message

Format:
```
[task-id] type: short description (max 72 chars)
```

Types: `feat` `fix` `test` `docs` `refactor` `chore`

Body (add if non-trivial): explain WHY, not what — the diff shows what changed.

Show the proposed commit message and wait for confirmation.

---

## Step 6 — Commit

After user confirms → create the commit.

---

## Step 7 — Offer to push and open PR

Ask:
> "Push `[branch]` and open a PR? (yes/no)"

If yes:
1. Push the branch: `git push -u origin [branch]`
2. Suggest the `gh pr create` command with:
   - Title: `[task-id] [Task Title]`
   - Body: link to `[task-id]-requirement.md`, list ACs, link to retro

---

## Step 8 — Check sprint completion and output

Read `docs/BACKLOG.md` — are all tasks in `[sprint-id]` now `done`?

```
✓ Committed: [commit message]
  Branch: [branch-name]

Next step:
  Sprint still has open tasks → /next-task
  All sprint tasks done       → /retro-sprint [sprint-id]
```
