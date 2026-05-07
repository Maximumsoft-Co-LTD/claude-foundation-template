# /git-commit
Workflow position: **/testing (or /retro-task) → START → /next-task (or /retro-sprint)**

Stage and commit all changes for a completed task. Per the new core spec, `/git-commit` runs immediately after `/testing` is fully GREEN — `/retro-task` is recommended but no longer a hard gate; if the retro doc is missing, this command warns and proceeds.

Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Inspect state

Parse `[task-id]`, extract `[sprint-id]`.

Run in parallel: `git status` · `git branch --show-current` · `git diff` · `git diff --staged`


---

## Step 2 — Verify task is ready to commit

Two readiness signals — the first is **mandatory**, the second is **advisory**.

**Mandatory: testing is GREEN for this task.**
- Look for evidence the latest `/testing [task-id]` run produced `Production Readiness: PASS` (every AC `READY`). Acceptable evidence:
  - The current chat transcript shows a recent `/testing` PASS for this task, OR
  - `docs/BACKLOG.md` status for `[task-id]` is `testing` or later (`review` / `done`).
- No evidence → **stop**. Run `/testing [task-id]` first. Do not commit untested work.

**Advisory: task retro is written.**
- Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`.
- File missing → warn (do not block):
  ```
  ⚠ No retro doc at docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md
    Recommended: run /retro-task [task-id] before committing so lessons aren't lost.
    Continue without retro? (yes/no)
  ```
  Wait for explicit `yes` to proceed; on `no`, stop and let the user run `/retro-task`.
- File present → continue silently.

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

Run full test suite. If tests fail → stop. Fix before proceeding.

**Superpowers integration:** If the superpowers plugin is available, invoke `Skill("superpowers:finishing-a-development-branch")` — it handles the 4-option flow with worktree cleanup. Otherwise, follow the inline steps below.

Present exactly these 4 options and wait for user choice:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Branch ready: [branch-name]
Commit: [task-id] [type]: [description]
Tests: [N] passing, 0 failing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Merge back to [base-branch] locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work
```

**Option 1 — Merge locally:** If `[base-branch]` is `main` or `master` → warn "Team convention is no direct commits to main. Consider Option 2 instead. Continue? (yes/no)". Only proceed if confirmed. Checkout base, pull, merge, run tests, delete feature branch.

**Option 2 — Push and create PR:** `git push -u origin [branch]` then `gh pr create` with title `[task-id] [User Story]` and body summarising ACs and linking to retro. Use `/pr-create [task-id]` skill for the full PR template.

**Option 3 — Keep as-is:** No action. Report: `Keeping branch [name].`

**Option 4 — Discard:** Require user to type `discard` to confirm. Then checkout base and `git branch -D [feature-branch]`.

If working in a git worktree (`git worktree list`): Options 1/2/4 → `git worktree remove [path]`. Option 3 → keep worktree.

---

## Step 9 — Load next task (auto next-task)

Read `docs/BACKLOG.md`.

**If all tasks in `[sprint-id]` are `done`:**
```
✓ Committed: [commit message]  |  Branch: [branch-name]  |  Action: [merge/PR/keep/discard]

Sprint [sprint-id] complete — run /retro-sprint [sprint-id]
```

**If tasks remain:** Run the full next-task flow inline:

1. **Reconcile statuses** — for each task NOT `todo` or `done`, check its doc files:
   - `[task-id]-retro.md` exists → mark `done`
   - Status is `review`/`testing` but no evidence → revert to `in-progress`
   - Print any corrections made.

2. **Show sprint progress:**
   ```
   SP1 — [Epic Title]: 2 done / 1 in-progress / 3 todo / 0 blocked  (6 total)
   ```

3. **Pick next task** — first `todo` task respecting `depends_on`. If none → list blocked tasks.

4. **Load context** — read the target task's requirement, frontend, backend, issues docs.

5. **Output context card** — update status to `in-progress`, then print:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✓ Committed: [commit message]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Next  : [task-id] — [User Story]
   Status: [status]  |  Priority: [priority]  |  Estimate: [X days]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [Problem Statement one line]

   Acceptance Criteria:
     ☐ AC-1: ...
     ☐ AC-2: ...

   Readiness: Requirement [filled/empty] | Implementation Plan [filled/empty]
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```
   Suggest ONE next step (same table as `/next-task`): requirement missing or empty → `/requirement`, requirement complete → `/implement`.
