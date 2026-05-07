---
description: Break a task into 15–45 min shippable vertical slices (FE+BE+test each) — kills "small task takes same time as big task"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git status:*), Bash(git diff:*)
disable-model-invocation: false
---

# vertical-slice

Workflow position: **after scope-check (when estimate > 60 min) → before /implement → produces a slice plan**

Forces the next chunk of work to be **shippable end-to-end** (UI → API → DB → test) in 15–45 minutes. No "do all the BE first, then all the FE." That's how small tasks balloon to 4 hours.

Arguments: `[task-id]` or scoped description from `scope-check`

---

## When to invoke

- `scope-check` estimated > 60 min
- Task touches FE + BE + DB simultaneously
- You're about to start typing and don't have a clear "first thing that ships"
- Re-invoke mid-task if a slice has run > 60 min

Skip when:
- Task is already < 30 min single-layer (one Go handler, one Vue component, one Mongo migration)

---

## Step 1 — Reject the layer split

If you catch yourself thinking any of these, STOP. The plan is wrong:

| Anti-pattern | Why it fails |
|---|---|
| "First all the API endpoints, then UI" | API gets built without a real consumer → wrong shape |
| "First the Mongo schema, then the BE, then the FE" | 3 hours before anything ships |
| "Backend in this commit, frontend in next" | Half-merged feature, can't demo |
| "I'll mock the API and build UI first" | Mock drifts from real shape, wasted rework |

The unit of work is a **vertical slice**: one user-visible behavior that goes all the way down and all the way back up.

---

## Step 2 — List the user-visible behaviors

From the ACs (from scope-check), list every behavior a user could observe and acknowledge as "done":

```
B1: User clicks "Save" — sees toast "Saved" — refresh shows the value persisted
B2: User submits empty form — sees inline error "Field required"
B3: User edits existing record — sees previous value pre-filled
```

Each behavior must be:
- **Observable** — visible in browser, in API response, or in DB after the action
- **Independent** — can ship without the others (any order works)
- **Atomic** — splitting it further means splitting "Save button" from "Save effect" (don't)

---

## Step 3 — Slice the behaviors into ≤ 45 min units

For each behavior, write a slice row:

| Slice | Behavior | FE work | BE work | Data | Test | Estimate |
|---|---|---|---|---|---|---|
| S1 | B1 happy path | Vue button + composable call | Go handler `POST /x` returning 200 | Mongo insert in `things` | 1 e2e + 1 BE unit | 30 min |
| S2 | B1 toast | Toast component on success | — | — | 1 component test | 15 min |
| S3 | B2 validation | Inline error on submit | Go validator returning 400 | — | 1 e2e + 1 BE unit | 25 min |

Hard rules:
- **Estimate > 45 min** → slice is too big, split it again
- **Estimate < 10 min** → merge with adjacent slice
- **Slice has no test column** → not a slice, it's a chore. Reject.
- **Slice changes only one layer** → that's fine ONLY if the layer is independently shippable (e.g. logging-only change). Otherwise re-slice.

---

## Step 4 — Order by risk, not by layer

Pick S1 (the next slice) using this ranking:

1. **Highest contract risk first** — if FE↔BE shape is uncertain, do that slice first to lock the contract (then run `api-contract` skill on it)
2. **Highest unknown second** — anything you've never built before in this codebase
3. **Quick wins last** — toasts, copy tweaks, styling polish

Do NOT order by "easiest first." Easy slices give false confidence; hard slices reveal blockers.

---

## Step 5 — Define "done" per slice

Each slice gets an explicit exit gate. No ambiguity:

```
S1 done when:
- [ ] Manual: open /things, click Save, see new row in list
- [ ] DB: db.things.findOne({...}) returns the new doc
- [ ] Test: `go test ./handlers/...` and `npm run test:e2e -- things.spec` both pass
- [ ] Branch: committed with message "SP[N]-T[NNN] feat: ..."
```

If you can't write these 4 lines for a slice, the slice is not concrete enough. Re-slice.

---

## Step 6 — Persist

Append to `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` under a new section:

```markdown
## Vertical Slices (planned [YYYY-MM-DD])
[paste the slice table from Step 3]

**Order:** S[a] → S[b] → S[c]
**Reasoning:** [one line per slice on why it's in this position]
```

---

## Step 7 — Commit cadence

Each slice = 1 commit minimum. Push after every slice, not at the end of the task.

This means a task with 4 slices = 4 commits, 4 pushes, 4 chances to ship/rollback.

---

## Output

```
Slices: [N]  |  Total estimate: [sum] min  |  Next slice: S1 — [behavior]

Order: S1 → S2 → S3 → ...
First slice ships when: [the 4-line "done when" from Step 5]

Next: /implement [task-id]  (work S1 only, then re-check)
```

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: present slice plan + 2-option completion message (per `completion-format.md`).
- **Autopilot mode**: emit status line + return. Phase boundary handled by orchestrator after this skill.

## Output (autopilot status line — required)

`> vertical-slice: [N] slices, total [N]min  [✓]`

Example: `> vertical-slice: 4 slices planned (S1=login, S2=callback, S3=session, S4=logout)  ✓`

---

## Why this exists

Previous pain: "ใช้เวลานานในการทำ task — task เล็กใหญ่ใช้เวลาเท่ากัน". Root cause: tasks are sliced by layer (all BE, then all FE), not by behavior. Layer-sliced work has no shippable midpoint, so a 1-hour task and a 4-hour task both take "until it's all done." Vertical slicing forces a shippable result every 15–45 min, regardless of total task size.
