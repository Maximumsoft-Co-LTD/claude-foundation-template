---
description: Serialize mid-session context into a handoff doc so the next session (or engineer) can resume without cold-start
allowed-tools: Read, Write, Bash(git log *), Bash(git status *), Bash(git diff *)
disable-model-invocation: false
---

# /session-handoff
Workflow position: **end of any session mid-task → START → next session reads /session-resume**

Create a structured handoff document capturing everything needed to resume work cleanly. Run at the end of any session where the task is not complete.
Arguments: `[task-id]`  — e.g. `SP2-T004`

---

## Step 1 — Capture git state

Parse `[task-id]`, extract `[sprint-id]`.

Run in parallel:
```bash
git status
git diff --stat HEAD
git log main..HEAD --oneline
git stash list
```

---

## Step 2 — Identify stopping point

Read:
- `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` — ACs, what's done vs pending
- Any design docs that exist for this task

From the context of this session, identify:
- **Last completed step** in the workflow (e.g. "completed `/design fe`, starting `/design be`")
- **Current step** — exactly where execution stopped
- **Next action** — the specific next thing to do, not just the command

---

## Step 3 — Write the handoff doc

Save to `docs/sprints/[sprint-id]/[task-id]/[task-id]-handoff.md` (overwrite if exists):

```markdown
# Handoff: [task-id] — [User Story]

**Created:** [YYYY-MM-DD HH:MM]
**Branch:** [branch-name]
**Workflow position:** [last completed step] → **[current step — stopped here]**

---

## Stopping Point

[1–3 sentence description of exactly where this session ended and why it stopped.]

## Next Action

**Run:** `[exact command to resume]`

[1–2 sentences describing what that command should do and any specific focus area.]

## What's Done

- [x] [completed step or decision]
- [x] [completed step or decision]

## What's Pending

- [ ] [next step]
- [ ] [subsequent step]

## Key Context

[Decisions made this session that the next session must know.
Things that were tried and didn't work. Non-obvious constraints discovered.]

## Open Questions

- [question that needs answering before proceeding, if any]

## Git State

```
Branch: [branch]
Uncommitted changes: [yes/no — N files]
Commits ahead of main: [N]
Stash entries: [N]
```

## Relevant Files

- `[path]` — [why it's relevant]
- `[path]` — [why it's relevant]
```

---

## Step 4 — Handle uncommitted changes

If there are uncommitted changes:

Ask: "Uncommitted changes found. (s)tash, (c)ommit WIP, or (l)eave as-is?"

- **Stash:** `git stash push -m "WIP: [task-id] session handoff [date]"`
- **WIP commit:** `git commit -am "WIP: [task-id] — session handoff [date] (do not merge)"`
- **Leave:** note in handoff doc that working tree is dirty.

---

## Output

```
✓ docs/sprints/[sprint-id]/[task-id]/[task-id]-handoff.md

Stopping point: [workflow step]
Next session:   run /session-resume [task-id]
Git state:      [clean / stashed / WIP committed]
```

---

## Resuming (next session)

Read `[task-id]-handoff.md`, then run the exact command listed in "Next Action".
Delete the handoff file after successfully resuming to avoid stale context.
