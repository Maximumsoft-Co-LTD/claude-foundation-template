# Completion Format Rules

Every artifact-producing step in a workflow command (manual `/discovery`, `/requirement`, `/implement`, etc., AND every phase boundary in `/dev` autopilot) MUST end with a standardized 2-option completion message.

## The pattern

```
[1–5 line summary of the artifact just produced]

Next: choose one
A) Request changes — describe what to revise
B) Continue to [next-step-name]
```

That's it. No third option. No open-ended "what would you like?". No checklist of 7 things.

## Why exactly 2 options

- **A) Request changes** is the universal "go back" — covers every kind of revision (rewrite a section, change a decision, add missing detail). User describes in free text what they want different.
- **B) Continue** is the universal "advance" — proceeds to the next step in the workflow.

Adding a third option dilutes both. Users hesitate, conversations drift. AI-DLC explicitly bans 3+ option emergent menus for this reason.

## When this applies

- End of every step in manual slash commands that produces an artifact (discovery doc, requirement doc, implementation, retro)
- End of any skill that produces a user-reviewable output

## When this does NOT apply

- Pure intermediate steps that don't produce a reviewable artifact (e.g. tool dispatch, internal lookup)
- `ask-choice` invocations — those are decision points with 2–4 multi-choice options per their own rule
- Destructive-op confirmations — those are explicit yes/no, not A/B (semantics differ)
- **`/dev` autopilot phase boundaries** — autopilot phase boundaries do NOT use the A/B prompt. They emit a brief summary line and continue automatically unless one of the 3 autopilot block reasons applies (ambiguity / destructive op / ui-verify fail). See `autonomous-mode.md`. The A/B prompt only appears at the *final* end-of-`/dev` summary.

## Examples

### Good

```
Discovery doc complete: docs/discovery/disc-007-export.md
Identified 1 epic (CSV export), 5 user stories, 2 shared entities.

Next: choose one
A) Request changes — describe what to revise
B) Continue to /new-sprint
```

```
Slice S2 done: callback handler + session creation
Tests: 4 RED → 4 GREEN. Build: exit 0. (ui-verify runs in /testing.)

Next: choose one
A) Request changes — describe what to revise
B) Continue to S3 (refresh token)
```

### Bad — DO NOT WRITE

```
Discovery doc complete. What would you like to do?
- Continue
- Edit the doc manually
- Revise specific section
- Run reverse-engineering again
- Cancel
```
*Five options is paralysis. The "edit manually" / "specific section" / "again" all collapse into A) Request changes.*

```
Done. Should I proceed?
```
*No artifact summary, no clear next step name. User has nothing to evaluate.*

## Wording rules

- **A) label** is always exactly: `Request changes — describe what to revise`
- **B) label** is always: `Continue to [next-step-name]` where `[next-step-name]` is concrete (`/new-sprint`, `S3`, `/retro-sprint`, etc.)
- Summary above the options is **at most 5 lines** — file paths, key counts, status. Not prose.
- Label A always before label B (recovery-first ordering — user reads top-to-bottom; "request changes" being first signals the system is open to revision, not pushy).

## Anti-patterns

- ❌ "Looks good?" / "OK to proceed?" / "How does this look?" — vague, no clear options
- ❌ A/B/C menus — always collapse C and beyond into A
- ❌ Asking "should I commit?" as a 2-option — commits are destructive ops, follow that rule instead
- ❌ Skipping the summary — user can't decide A vs B without seeing what's there

## Why this exists

Standardized exits make every step predictable. Predictable means fast review. Fast review means the workflow flows. The cost is one more review per step, but the quality and consistency gains across an entire sprint are large — and the 2-option discipline prevents the conversation from sprawling.
