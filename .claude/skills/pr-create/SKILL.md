---
description: Push branch and open a GitHub PR with pre-filled title, body, and AC checklist
allowed-tools: Read, Bash(git *), Bash(gh *)
disable-model-invocation: false
---

# /pr-create
Workflow position: **/git-commit → START → /next-task (or /retro-sprint)**

Push the current branch and create a GitHub PR populated from the task's requirement doc and commit history.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Validate state

Parse `[task-id]`, extract `[sprint-id]`.

Run in parallel:
- `git status` — confirm working tree is clean (no uncommitted changes)
- `git branch --show-current` — confirm branch matches `[sprint-id]/[task-id]-*`
- `git log main..HEAD --oneline` — list commits that will go into the PR

If working tree is dirty → stop: "Uncommitted changes found. Run `/git-commit [task-id]` first."
If no commits ahead of main → stop: "No commits to push."

---

## Step 2 — Load task context

Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`:
- Task title and description
- All ACs (for PR body checklist)
- Story points

---

## Step 3 — Push branch

```bash
git push -u origin [current-branch]
```

If push fails due to upstream divergence → stop and report; do not force-push without user confirmation.

---

## Step 4 — Compose PR

**Title format:** `[task-id] [User Story]` (max 72 chars)

**Body template:**
```
## Summary

[1–3 sentence description of what this PR does and why]

## Acceptance Criteria

- [ ] AC-1: [text]
- [ ] AC-2: [text]
...

## Docs

- Requirement: docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md
- Frontend design: docs/sprints/[sprint-id]/[task-id]/[task-id]-frontend.md *(if exists)*
- Backend design: docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md *(if exists)*

## Test plan

- Unit + integration: run `[test command]`
- E2E: run `[e2e command]`

🤖 Generated with [Claude Code](https://claude.ai/code)
```

---

## Step 5 — Create PR

```bash
gh pr create \
  --title "[task-id] [User Story]" \
  --body "[composed body]" \
  --base main
```

---

## Output

```
✓ Pushed: [branch]
✓ PR created: [PR URL]

  Title : [task-id] [User Story]
  ACs   : [N] checklist items
  Base  : main ← [branch]

Next:
  Sprint has open tasks → /next-task
  All sprint tasks done → /retro-sprint [sprint-id]
```
