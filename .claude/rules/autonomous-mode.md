# Autonomous Mode Rules

When `/dev` invokes the autonomous workflow pipeline, these rules govern when to block, how to report progress, and how to hand control back to the user. Skills MUST honor this rule when they detect autopilot mode.

## Detection

Autopilot mode is active when ANY of:
- Environment var `AUTOPILOT=1` is present in the calling shell context
- The caller passed `--autopilot` as part of args
- The current command file is `.claude/commands/dev.md` (running the orchestrator)

Anything else = manual mode (skill behaves as written, BLOCK steps execute as documented).

## The 4 (and only 4) reasons to block in autopilot mode

| Block reason | Trigger | How to resolve |
|---|---|---|
| **Ambiguity** | Skill confidence < 90% on a path that has > 1 viable option | Invoke `ask-choice` (batch all currently-known ambiguities into one question), wait, resume |
| **Destructive op** | About to: push to `main`/`master`, force-push any branch, drop a Mongo collection, run prod migration, delete a tracked file, run `rm -rf` outside `/tmp` | Show exact action + impact + ask plain yes/no, then proceed or cancel |
| **Phase boundary** | End of: discovery, sprint plan, each slice, all slices, retro-sprint | Print 5-line summary + `enter to continue / "pause" to stop` |
| **UI verify fail** | `ui-verify` returns FAIL OR a previously-GREEN test goes RED | Auto-trigger `/debug`. If `/debug` returns RESOLVED with the original test now GREEN → continue. Otherwise BLOCK with the diagnosis. |

If a step would normally BLOCK in manual mode but doesn't match any of the 4 above → in autopilot mode, **emit status line and continue**.

## Progress format (mandatory, every step)

Every skill in autopilot mode emits exactly ONE status line as its final output:

```
> [skill-name]: [≤ 60 char status]  [marker]
```

Markers:
- `✓` — step completed successfully
- `⏳` — step in progress (long operation, may emit multiple ⏳ lines)
- `✗` — step failed (always pairs with a block or auto-debug)
- `?` — ambiguity flagged; orchestrator will batch into next `ask-choice`

Examples:
```
> workspace-detect: brownfield (Vue/Nuxt + Go + Mongo)  ✓
> reverse-engineer: scanning 47 files... ⏳
> reverse-engineer: 12 components, 3 services  ✓
> scope-check: 5 ACs, 3 boundary cases, ~6h  ✓
> tdd-plan: 8 rows (3 BE unit, 2 BE int, 1 FE comp, 2 e2e)  ✓
> ui-verify: FAIL on AC2 (toast missing)  ✗
```

NO multi-paragraph output during pipeline execution. Detail goes to the audit log file, not the user's terminal.

## Phase boundary summary template

When `/dev` reaches a phase boundary, print:

```
> [phase boundary] [phase name]
   ─────────────────────────────────────────
   [3-5 line summary of what just happened]

   Next: [what the pipeline will do next, 1 line]

   Press enter to continue, or type "pause" to stop.
```

User options at every phase boundary:
- **enter / blank line** → continue
- **`pause`** → write checkpoint to `docs/sprints/[sprint-id]/.autopilot-state.json` and stop
- **`stop`** → same as pause but also clear `AUTOPILOT=1` so subsequent commands run manual
- **anything else** → treat as freeform feedback; route to `ask-choice` to formalize as a directive, then continue

## Ambiguity batching

When multiple skills flag `?` in a row before a phase boundary, the orchestrator collects them and invokes ONE `ask-choice` call with up to 4 questions (the tool's max). Order: most-blocking first.

Skills MUST NOT call `ask-choice` themselves in autopilot mode — they emit `?` and let the orchestrator batch.

## Resume protocol

`/dev resume`:
1. Read `docs/sprints/[active-sprint]/.autopilot-state.json`
2. State file contains: last completed step, pipeline position, pending answers, env state, branch
3. Re-establish context (re-read requirement doc, re-check git status)
4. Continue from the next step after the last completed one

If state file missing or stale (> 7 days) → tell user "no resumable session", don't auto-restart.

## Skill-author contract

When writing a skill, follow these in EVERY step that says "BLOCK" or "wait for user":

```markdown
## Step N — [name]

[normal step content]

**Blocking**: in manual mode, BLOCK as written above.
In autopilot mode (per autonomous-mode.md):
  - If condition matches one of the 4 official reasons → BLOCK
  - Else → emit `> [skill]: [status] ?` (or appropriate marker) and return
```

The shared output line at end of every skill:

```markdown
## Output (autopilot status line — required)

`> [skill-name]: [status]  [marker]`
```

## Audit interaction

Hook `audit-log.py` already captures every prompt and tool call. Skills do NOT write to audit themselves. They emit only the user-facing progress line; the hook handles the rest.

## Anti-patterns

- ❌ Writing 3-paragraph status updates during autopilot — only the 1-line spec
- ❌ Calling `ask-choice` from inside a skill in autopilot — flag `?` and return, let orchestrator batch
- ❌ Auto-resolving "ambiguous" by picking a default silently — that's the whole problem this rule prevents
- ❌ Auto-pushing to main "to save time" — destructive-op block is non-negotiable

## Why this exists

Without a single rule, every skill re-invents "should I block here?" and gets it inconsistent. With this rule, the autopilot UX is deterministic: user knows the only 4 reasons execution will pause, and the progress format is uniform across all 20 skills.
