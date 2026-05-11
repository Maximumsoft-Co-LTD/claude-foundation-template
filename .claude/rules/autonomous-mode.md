---
name: Autonomous Mode Rules
description: Governs `/dev` autopilot — the only 3 reasons to block (ambiguity, destructive op, ui-verify fail), mandatory 1-line status format, and phase-boundary continue-by-default.
scope: universal
---

# Autonomous Mode Rules

When `/dev` invokes the autonomous workflow pipeline, these rules govern when to block, how to report progress, and how to hand control back to the user. Skills MUST honor this rule when they detect autopilot mode.

## Detection

Autopilot mode is active when ANY of:
- Environment var `AUTOPILOT=1` is present in the calling shell context
- The caller passed `--autopilot` as part of args
- The current command file is `.claude/commands/dev.md` (running the orchestrator)

Anything else = manual mode (skill behaves as written, BLOCK steps execute as documented).

## The 3 (and only 3) reasons to block in autopilot mode

| Block reason | Trigger | How to resolve |
|---|---|---|
| **Ambiguity** | Skill confidence < 90% on a path that has > 1 viable option | Invoke `ask-choice` (batch all currently-known ambiguities into one question), wait, resume |
| **Destructive op** | About to: push to `main`/`master`, force-push any branch, drop a Mongo collection, run prod migration, delete a tracked file, run `rm -rf` outside `/tmp` | Show exact action + impact + ask plain yes/no, then proceed or cancel |
| **UI verify fail** | `ui-verify` returns FAIL OR a previously-GREEN test goes RED | Auto-trigger `/debug`. If `/debug` returns RESOLVED with the original test now GREEN → continue. Otherwise BLOCK with the diagnosis. |

If a step would normally BLOCK in manual mode but doesn't match any of the 3 above → in autopilot mode, **emit status line and continue**.

### Phase boundary — soft, not blocking

Phase boundaries (end of discovery / sprint plan / each slice / all slices / retro-sprint) are **not** automatic block points in autopilot. At each phase boundary:

1. Emit the 1-line phase-boundary marker (`> [phase boundary] [phase name]`) plus a brief summary (≤ 5 lines).
2. **Then check the 3 block reasons above.** If any apply → block as defined. If none apply → continue immediately to the next phase, no A/B prompt, no `enter to continue`.

The user can still interrupt at any time by sending a message; the orchestrator treats freeform input as feedback and routes it through `ask-choice`.

Reason: stopping at every phase boundary defeats the purpose of autopilot. The user explicitly asked for "if nothing needs answering and the work is correct, just continue" — phase boundaries with zero pending decisions are exactly that.

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

When `/dev` reaches a phase boundary AND none of the 3 block reasons apply, print and **continue immediately** (no waiting):

```
> [phase boundary] [phase name]
   [3-5 line summary of what just happened]
   Next: [what the pipeline will do next, 1 line]
```

After this block the orchestrator MUST immediately spawn the next stage. The very next line in the transcript is the next stage's first status line — never a prompt, never a question, never a reminder.

**Correct (continues automatically):**

```
> [phase boundary] STAGE 2 — Sprint plan
   SP2 planned: 5 tasks / 15 SP. Sequential dispatch (payment risk-tagged).
   Next: STAGE 3 — /requirement SP2-T008
> requirement: ⏳ scope-check running...
```

**Wrong (turns the soft boundary into a hard block — FORBIDDEN):**

```
> [phase boundary] STAGE 2 — Sprint plan
   ...
   Next: STAGE 3 — ...

   Press enter to continue, or type pause to stop and write resume state.   ❌
```

When a block reason DOES apply at a phase boundary (ambiguity / destructive op / ui-verify fail), the relevant block prompt is shown — the phase boundary itself is not what causes the wait. Examples:

- Ambiguity at boundary → emit summary + invoke `ask-choice` with batched questions.
- Destructive op next → emit summary + show explicit yes/no for the destructive action.
- ui-verify failed in the slice that just finished → emit summary + auto-`/debug`.

User can interrupt mid-pipeline at any time by sending a message; the orchestrator treats freeform input as feedback and routes it through `ask-choice`. To pause cleanly, the user types `pause` (handled at the next status emission), which writes the checkpoint and stops.

## Forbidden phase-boundary outputs

At a phase boundary where none of the 3 block reasons applies, the orchestrator MUST NOT emit any of these strings (or paraphrases in any language):

- ❌ "Press enter to continue"
- ❌ "Press any key to continue"
- ❌ "Type pause to stop" / "Type pause to ..."
- ❌ "Continue? (y/n)" / "Proceed? (y/n)"
- ❌ "Should I continue?" / "Ready to continue?"
- ❌ "Hit enter / press space / ตอบกลับเพื่อไปต่อ"
- ❌ Any phrase that asks, hints, or reminds the user to confirm continuation

The pause mechanism is documented **once** in `/dev help`. Re-announcing it at every phase boundary turns the soft boundary into a hard block — exactly what this rule prevents. The user already knows they can interrupt at any time by sending a message.

If the orchestrator catches itself about to emit a continuation prompt at a phase boundary AND no block reason applies → suppress the prompt and immediately spawn the next stage.

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
  - If condition matches one of the 3 official reasons → BLOCK
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
- ❌ Re-announcing the pause/resume mechanism at phase boundaries ("type pause to stop", "press enter to continue", etc.) — see Forbidden phase-boundary outputs above

## Why this exists

Without a single rule, every skill re-invents "should I block here?" and gets it inconsistent. With this rule, the autopilot UX is deterministic: user knows the only 3 reasons execution will pause, and the progress format is uniform across all 20 skills.
