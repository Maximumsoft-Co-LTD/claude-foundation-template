# /git-commit
Workflow position: **/retro-task → START → /next-task (or /retro-sprint if sprint complete)**

Stage and commit all changes for a completed task.
Arguments: $ARGUMENTS
Format: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Parse and inspect current state

Parse `[task-id]` from `$ARGUMENTS`. Extract `[sprint-id]` from prefix (e.g. `SP1-T001` → `SP1`).

Register all steps with TaskCreate — store the returned IDs:

```
t1 = TaskCreate(subject: "[task-id] — commit: inspect state",        description: "Run git status, git branch, git diff to understand current state")
t2 = TaskCreate(subject: "[task-id] — commit: check branch name",    description: "Verify branch follows [sprint-id]/[task-id]-[desc] pattern")
t3 = TaskCreate(subject: "[task-id] — commit: pre-commit sanity",    description: "Scan for console.log, debugger, .only, and secrets in changed files")
t4 = TaskCreate(subject: "[task-id] — commit: stage files",          description: "Stage specific files selectively — never git add -A")
t5 = TaskCreate(subject: "[task-id] — commit: draft commit message", description: "Draft commit message in [task-id] type: description format and confirm with user")
t6 = TaskCreate(subject: "[task-id] — commit: create commit",        description: "Create the commit after user confirms message")
t7 = TaskCreate(subject: "[task-id] — commit: push + PR",            description: "Offer to push branch and open a PR")
t8 = TaskCreate(subject: "[task-id] — commit: check sprint complete",description: "Read BACKLOG.md and determine next step")
```

Wire dependencies:
```
TaskUpdate(t2, addBlockedBy: [t1])
TaskUpdate(t3, addBlockedBy: [t2])
TaskUpdate(t4, addBlockedBy: [t3])
TaskUpdate(t5, addBlockedBy: [t4])
TaskUpdate(t6, addBlockedBy: [t5])
TaskUpdate(t7, addBlockedBy: [t6])
TaskUpdate(t8, addBlockedBy: [t7])
```

```
TaskUpdate(t1, status: in_progress)
```

Run in parallel:
- `git status` — all changed and untracked files
- `git branch --show-current` — current branch name
- `git diff` — unstaged changes
- `git diff --staged` — already staged changes

```
TaskUpdate(t1, status: completed)
```

---

## Step 2 — Check branch name

```
TaskUpdate(t2, status: in_progress)
```

Expected pattern: `[sprint-id]/[task-id]-[short-description]`
Example: `SP1/SP1-T002-user-auth`

If the branch doesn't match this pattern → warn the user:
> "Branch `[current]` doesn't follow the expected pattern `[sprint-id]/[task-id]-[desc]`. Continue anyway? (yes/no)"

```
TaskUpdate(t2, status: completed)
```

---

## Step 3 — Pre-commit sanity check

```
TaskUpdate(t3, status: in_progress)
```

Scan changed files for:
- `console.log`, `console.error`, `debugger` left in source code
- `.only` in test files (scoped tests that would hide failures)
- `.env` or files containing secrets about to be staged

Report any findings and ask the user to resolve before staging.

```
TaskUpdate(t3, status: completed)
```

---

## Step 4 — Stage files selectively

```
TaskUpdate(t4, status: in_progress)
```

Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` for context on what this task includes.

Stage by specific file path — NEVER `git add -A` or `git add .`:
- **Include:** source code, test files, and everything under `docs/sprints/[sprint-id]/[task-id]/`
- **Exclude:** `.env`, secrets, unrelated files, binary files

Show the user the exact list of files to be staged and ask: "Stage these files? (yes/no/edit)"

```
TaskUpdate(t4, status: completed)
```

---

## Step 5 — Draft commit message

```
TaskUpdate(t5, status: in_progress)
```

Format:
```
[task-id] type: short description (max 72 chars)
```

Types: `feat` `fix` `test` `docs` `refactor` `chore`

Body (add if non-trivial): explain WHY, not what — the diff shows what changed.

Show the proposed commit message and wait for confirmation.

```
TaskUpdate(t5, status: completed)
```

---

## Step 6 — Commit

```
TaskUpdate(t6, status: in_progress)
```

After user confirms → create the commit.

```
TaskUpdate(t6, status: completed)
```

---

## Step 7 — Offer to push and open PR

```
TaskUpdate(t7, status: in_progress)
```

Ask:
> "Push `[branch]` and open a PR? (yes/no)"

If yes:
1. Push the branch: `git push -u origin [branch]`
2. Suggest the `gh pr create` command with:
   - Title: `[task-id] [Task Title]`
   - Body: link to `[task-id]-requirement.md`, list ACs, link to retro

```
TaskUpdate(t7, status: completed)
```

---

## Step 8 — Check sprint completion and output

```
TaskUpdate(t8, status: in_progress)
```

Read `docs/BACKLOG.md` — are all tasks in `[sprint-id]` now `done`?

```
TaskUpdate(t8, status: completed)
```

```
✓ Committed: [commit message]
  Branch: [branch-name]

Next step:
  Sprint still has open tasks → /next-task
  All sprint tasks done       → /retro-sprint [sprint-id]
```
