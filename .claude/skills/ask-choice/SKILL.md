---
name: ask-choice
description: Force every ambiguity to be a multi-choice question (2–4 options with tradeoffs) via AskUserQuestion — never open-ended chat
allowed-tools: Read, Grep, AskUserQuestion
---

# ask-choice

Workflow position: **invoke whenever a decision needs user input that has > 1 viable answer**

Replaces "What do you think?" with "Pick A, B, or C — here are the tradeoffs." User answers in seconds, not paragraphs.

Arguments: `[question]` (or context from caller skill/command)

---

## When to invoke

- `unknowns` field from `prompt-understand` is non-empty
- Mid-task decision with > 1 viable approach
- Before destructive action (delete, force-push, schema change)
- When `solution-options` produced 2–3 options and user must pick

Skip:
- Question is binary "yes / no, proceed?" — just ask plainly
- Only 1 viable answer — don't fake a choice; state the answer
- Question is about preference Claude can decide (variable name, comment style)

---

## Step 1 — Frame the question

Single sentence, ≤ 12 words. Specific. No "what would you like?"

| Bad | Good |
|---|---|
| "How should we handle errors?" | "On validation fail, return 400 with field name or 422 with full error list?" |
| "What's the schema?" | "Mongo `things.tags` — array of strings or array of `{name, color}` objects?" |
| "Should we add caching?" | "Cache `GET /things` for 60s in Redis or skip cache for now?" |

---

## Step 2 — Generate 2–4 options

Each option MUST have:

```
Option [letter]: [≤ 8-word label]
  Pro: [1 line — concrete benefit]
  Con: [1 line — concrete cost]
  Effort: [S / M / L]
```

Rules:
- 2 options minimum (or it's not a choice)
- 4 options maximum (more = analysis paralysis)
- Always include a "do nothing / defer" option if defer is viable
- Pro/Con must be concrete, not abstract ("simpler" is not a pro — "no new dependency" is)
- Order: cheapest/safest first, biggest-change last

---

## Step 3 — Use AskUserQuestion

Call the `AskUserQuestion` tool. Format:

```
Question: [from Step 1]

Options:
A) [label] — [Pro] / [Con] (Effort: [S/M/L])
B) [label] — [Pro] / [Con] (Effort: [S/M/L])
C) [label] — [Pro] / [Con] (Effort: [S/M/L])

Recommended: [letter] — [1-line reason]
```

Always include a recommendation. User can override but should know your read.

---

## Step 4 — Wait. Do not proceed.

Stop. Do not start any work. Do not "begin while waiting."

Resume only when user picks a letter or types a different answer.

---

## Step 5 — On answer

- **User picked an option** → proceed with that path
- **User typed a different answer** → that becomes the choice; don't argue, don't re-ask
- **User asked a clarifying question** → answer it, then re-present the same choice (don't generate new options unless user asked for more)

---

## Anti-patterns

- ❌ Open-ended "What would you prefer?" — always force a choice
- ❌ Options with no tradeoff (all pros) — that means you didn't think hard enough
- ❌ Options that are actually the same thing reworded
- ❌ Asking 3 questions in sequence — batch into one `ask-choice` call when possible
- ❌ Re-asking the same question after the user answers

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: this skill IS the user-input mechanism — always blocks on `AskUserQuestion`.
- **Autopilot mode**: same blocking behavior. `ask-choice` is the only sanctioned way to handle ambiguity in autopilot. The orchestrator (`/dev`) batches up to 4 questions per call.

## Output (autopilot status line — required)

`> ask-choice: asking [N] question(s)  [⏳]` then `> ask-choice: resolved [N], proceeding  [✓]`

---

## Why this exists

Open-ended chat trains the user to give 1-word answers because typing is expensive. Multi-choice lets them answer in 1 letter — same speed, 10× more decision quality. Tradeoffs make the choice honest.
