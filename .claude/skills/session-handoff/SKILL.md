---
name: session-handoff
description: Serialize current session state into a handoff doc so the next session (or another engineer) can resume without cold start
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(ls:*), Bash(cat:*)
---

# session-handoff

Workflow position: **invoke when context is approaching limit, before logout, or when handing work to another person — produces a handoff.md the next session reads first**

Solves: "I closed the session, came back, lost 30 minutes re-loading context."

Arguments: `[task-id]` or `[freeform label]`

---

## When to invoke

- Context window > 80% used and the work isn't done
- End of day on a multi-day task
- Switching to another machine / engineer
- Before invoking `/clear` — if you must, this is the lifeline
- After `/debug` discovered a complex root cause that takes time to re-derive

Skip:
- Task is finished — close it, no handoff needed
- Single-step work with no carry-over

---

## Step 1 — Decide the destination

Path:
- Task-scoped: `docs/sprints/[sprint-id]/[task-id]/handoff.md`
- Freeform: `docs/handoffs/[YYYY-MM-DD]-[label].md`

If the path already exists from an earlier handoff → APPEND a new section dated today, do NOT overwrite. Old context is occasionally useful.

---

## Step 2 — Capture the state

Run all in parallel; collect into the handoff doc:

```bash
git status --short
git diff --stat main...HEAD
git log --oneline -10
git branch --show-current
ls /tmp/local-run-status.json 2>/dev/null && cat /tmp/local-run-status.json
```

---

## Step 3 — Write the handoff

Use this exact template — the next session reads it top-to-bottom:

```markdown
# Handoff — [task-id or label] — [YYYY-MM-DD HH:MM]

## TL;DR
[2–3 sentences. What's the task, where am I, what's the next concrete action.]

## Working on
- Task:        [task-id + 1-line scope]
- Branch:      [branch-name]
- Last commit: [sha + subject]
- Slice:       [S2 in progress, S1 done — if vertical-slice was used]

## State of the code
[from git status — list every modified/added file with 1 line of "what's changed"]
- `internal/handlers/things.go` — added POST handler, validation TODO
- `web/composables/useThings.ts` — wired to handler, error path WIP
- `migrations/2026-05-06-things-index.js` — new index, NOT yet applied

## Decisions made this session
- [DEC-NNN] Chose cursor-based pagination over offset (see brain note)
- Picked Mongo schema validator over app-level Joi for `things.tags`

## Open questions / blocked
- [ ] Q1: should `dueAt` be optional on PATCH? — pinged user, no answer yet
- [ ] Q2: socket event name `thing:created` vs `things.created` — picked `:`, may revisit

## Tests
- Wrote: 3 BE unit (pass), 1 BE integration (pass), 0 e2e
- Missing: e2e for AC3, BE unit for boundary `tags.length === 10`
- Last full run: [time + result]

## Local stack
- mongo: up @ :27017  (status from /tmp/local-run-status.json)
- be:    up @ :8080   (last restart: ...)
- fe:    up @ :3000

## Next concrete action
[ONE step. The smallest action to resume productively. Not "continue work" — be specific.]

Example: "Open `internal/handlers/things.go:42`, complete the `validateName` call by importing `validator.New()` from line 8 — boundary test at row 4 of TDD plan will go GREEN."

## Watchouts
- DON'T re-run migration `2026-05-06-things-index.js` — already applied to dev DB
- The seed script has a bug filed in /tmp/seed-error.log; if e2e fails, that's why
- `useThings.ts` line 33 uses a temporary `any` type — fix before commit

## Links
- Requirement: docs/sprints/SP3/SP3-T012/SP3-T012-requirement.md
- TDD plan: same file, "TDD Test Plan" section
- Last debug session: docs/sprints/SP3/SP3-T012/debug-2026-05-06.md

## Files to read first on resume (in order)
1. This handoff doc
2. The TDD plan (line N of requirement)
3. `internal/handlers/things.go`
4. `web/composables/useThings.ts`
```

---

## Step 4 — Pin running processes

If `local-run` is up, decide:

| State | Action |
|---|---|
| Long-running session ahead (just lunch) | Leave running. Note in handoff. |
| End of day | Stop (`docker compose down` or kill bg processes). Note in handoff so next session knows to start. |
| Different machine takes over | Stop. Different machine will start its own. |

Do NOT silently leave services running across machines.

---

## Step 5 — Stash strategy

For uncommitted work:

| State | Strategy |
|---|---|
| Slice not done, no commit yet | Use a WIP commit on a `wip/` branch — easier than stash for handoff |
| Mid-experiment, want to throw away | Don't include in handoff. Just abandon. |
| Half a slice but solid | Commit as WIP, push, mention sha in handoff |

WIP commit message:
```
SP[N]-T[NNN] wip: [1-line state]

Handoff: docs/sprints/[sprint-id]/[task-id]/handoff.md
```

---

## Step 6 — Self-check

Before declaring handoff ready:

| Check | Pass condition |
|---|---|
| TL;DR passes "next person reads only this and gets it"? | yes |
| Next concrete action is 1 specific step? | yes — not "continue" |
| Every WIP file is mentioned? | match against `git status --short` |
| Open questions tracked? | yes — none silent |
| Watchouts captured? | hidden state, broken seed, applied migration, etc. |
| Links to requirement / TDD plan / debug? | yes |

---

## Step 7 — Push the handoff

```bash
git add docs/sprints/[sprint-id]/[task-id]/handoff.md  # or docs/handoffs/...
git commit -m "SP[N]-T[NNN] docs: handoff [YYYY-MM-DD]"
git push -u origin [branch-name]
```

If on a personal branch and the handoff is private → don't push, but tell the user where the file is locally.

---

## Output

```
session-handoff: [task-id or label]
File: [path]
WIP commit: [sha or "none — clean tree"]
Local stack: [running | stopped]
Next concrete action: [1 line]
```

---

## Anti-patterns

- ❌ Vague "continue from where I left off" — that's a TODO, not a handoff
- ❌ Listing 50 files without context — list only WIP files with 1-line state
- ❌ Forgetting to note running services — next session doesn't know what's up
- ❌ Open questions without "what we'll do about them" — leaves the next session stuck
- ❌ Handoff after `/clear` — too late; the doc has nothing to draw from

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: produce handoff doc + push.
- **Autopilot mode**: invoked when `/dev pause` triggered; produce handoff + checkpoint, no further ask. Stopping running services counts as destructive — confirm via yes/no.

## Output (autopilot status line — required)

`> session-handoff: [path], wip-commit [sha or none]  [✓]`

Example: `> session-handoff: docs/sprints/SP3/SP3-T012/handoff.md, wip 9a3f1e2  ✓`

---

## Why this exists

Mid-task interruptions are normal. Re-deriving where you were each morning costs 15–60 min. A 5-minute handoff doc converts that to 30 seconds. Multiplied by every interruption, the math is overwhelming.
