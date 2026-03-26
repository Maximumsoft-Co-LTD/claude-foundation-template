# /git-commit
Workflow position: **/retro-task → START → /next-task (or /retro-sprint)**

Stage and commit all changes for a completed task.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Inspect state

Parse `[task-id]`, extract `[sprint-id]`.

Run in parallel: `git status` · `git branch --show-current` · `git diff` · `git diff --staged`


---

## Step 2 — Verify task is ready to commit

Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`.

- File does not exist → **stop**. Task retro has not been completed. Run `/retro-task [task-id]` first.

Read `docs/BACKLOG.md` — check status for `[task-id]`.

- Status is not `testing` or `done` → **stop**. Testing has not been completed. Run `/testing [task-id]` first.

---

## Step 3 — Check branch name

Expected: `[sprint-id]/[task-id]-[short-description]` — e.g. `SP1/SP1-T002-user-auth`

If branch doesn't match → warn: "Branch `[current]` doesn't follow the expected pattern. Continue? (yes/no)"


---

## Step 4 — Pre-commit sanity check

Scan changed files for:
- `console.log`, `console.error`, `debugger` in source code
- `.only` in test files
- `.env` or secret files about to be staged

Report any findings and ask the user to resolve before staging.


---

## Step 5 — Stage files selectively

<HARD-GATE>
Show the exact file list and wait for "yes / no / edit" before staging anything.
NEVER run `git add -A` or `git add .` without explicit user confirmation.
</HARD-GATE>

Read `[task-id]-requirement.md` for context on what this task includes.

Stage by specific file path — **NEVER `git add -A` or `git add .`**:
- Include: source code, test files, everything under `docs/sprints/[sprint-id]/[task-id]/`
- Exclude: `.env`, secrets, unrelated files, binaries

Show the exact list of files and ask: "Stage these files? (yes/no/edit)"


---

## Step 6 — Draft commit message

Format: `[task-id] type: short description (max 72 chars)`
Types: `feat` `fix` `test` `docs` `refactor` `chore`

Body (add if non-trivial): explain WHY, not what — the diff shows what changed.

Show proposed message and wait for confirmation.

---

## Step 7 — Commit

After user confirms → create the commit.

---

## Step 8 — Finishing the development branch

**Verify tests pass one final time before presenting options:**

```bash
# Run full test suite
[project test command]
```

If tests fail → stop. Fix before proceeding.

**Present exactly these 4 options:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Branch ready: [branch-name]
Commit: [task-id] [type]: [description]
Tests: [N] passing, 0 failing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would you like to do?

1. Merge back to [base-branch] locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

### Option 1: Merge locally

**Warning:** if `[base-branch]` is `main` or `master`, warn the user:
> "Team convention is 'no direct commits to main.' Consider Option 2 (PR) instead. Continue merge to main? (yes/no)"

Only proceed if user explicitly confirms.

```bash
git checkout [base-branch]
git pull
git merge [feature-branch]
# Verify tests on merged result
[project test command]
git branch -d [feature-branch]
```

### Option 2: Push and create PR
```bash
git push -u origin [feature-branch]
gh pr create --title "[task-id] [Task Title]" --body "$(cat <<'EOF'
## Summary
[link to requirement doc, list ACs, link to retro]

## Test Plan
- [ ] All tests passing
- [ ] Code review approved
EOF
)"
```

### Option 3: Keep as-is
Report: `Keeping branch [name]. No cleanup.`

### Option 4: Discard
**Require typed confirmation:**
```
This will permanently delete:
- Branch [name]
- All commits since [base-branch]

Type 'discard' to confirm.
```
If confirmed: `git checkout [base-branch] && git branch -D [feature-branch]`

---

## Step 8b — Worktree cleanup

If working in a git worktree (check `git worktree list`):
- **Options 1, 2, 4:** `git worktree remove [worktree-path]`
- **Option 3:** keep worktree

---

## Step 9 — Check sprint completion and output

Read `docs/BACKLOG.md` — are all tasks in `[sprint-id]` now `done`?

```
✓ Committed: [commit message]
  Branch: [branch-name]
  Action: [merge/PR/keep/discard]

Next:
  Sprint has open tasks → /next-task
  All sprint tasks done → /retro-sprint [sprint-id]
```
