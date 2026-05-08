---
name: prompt-understand
description: Parse freeform user prompt into structured intent, entities, constraints, success criteria, and unknowns — lightweight pre-step before scope-check
allowed-tools: Read, Grep, Glob
---

# prompt-understand

Workflow position: **first step of any command that takes freeform user input → produces structured frame**

Lightweight parser. Different from `scope-check`:
- `prompt-understand` = read + restructure (no block, no commit, no doc)
- `scope-check` = commit to ACs + boundaries + estimate (BLOCK until user confirms)

Run prompt-understand FIRST. Run scope-check only when ready to commit.

Arguments: `[user prompt]` (or refer to last user message)

---

## When to invoke

- Start of `/discovery`, `/issue`, `/debug`, `/brainstorm`
- Anytime user message is > 1 sentence and not already structured
- Before deciding whether to ask `ask-choice` or proceed

Skip:
- Single-line command with no ambiguity (`/git-commit`, `git status`)
- User already provided structured input

---

## Step 1 — Extract 5 fields

Read the prompt. Fill this frame, **brief** (1 line per field):

```
## Prompt frame

intent:           [verb + object — what they want done]
entities:         [nouns — files, services, features mentioned]
constraints:      [must / must-not, deadlines, stack restrictions]
success criteria: [how do we know we're done — observable]
unknowns:         [things the prompt doesn't say but we'd need]
```

Rules:
- `intent` MUST be a verb + object. "Add export endpoint" not "export feature"
- `entities` are concrete things — paths, route names, collection names. Not adjectives.
- `unknowns` is the source of `ask-choice` questions later. Be honest.
- Each field max 1 line. If you need more, the prompt is too big — split it.

---

## Step 2 — Confidence read

Score 0–100% confidence the frame is right. Use evidence:

| Score | Meaning | Action |
|---|---|---|
| ≥ 90% | Frame is clean, proceed | go to next step in caller command |
| 70–89% | Mostly clear but `unknowns` is non-empty | invoke `ask-choice` for the unknowns |
| < 70% | Frame is guessing | invoke `ask-choice` with a "did I get the intent right?" question first |

---

## Step 3 — Output

Emit the frame block + confidence + next-step hint:

```
[paste the frame from Step 1]

Confidence: [X]%
Next: [proceed / ask-choice on unknowns / scope-check / debug]
```

The caller command reads this and decides.

---

## Anti-patterns

- ❌ Filling `unknowns` with "user might want X" guesses — only list things the prompt is silent on
- ❌ Inflating confidence to skip the ask-choice step
- ❌ Treating `prompt-understand` as a doc — it's an in-memory frame, not persisted
- ❌ Running before reading the actual prompt

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: emit frame + confidence + next-step hint, return to caller.
- **Autopilot mode**: same — this skill never blocks; flags `?` when confidence < 90% (or `unknowns` is non-empty) so the orchestrator can batch them via `ask-choice`.

## Output (autopilot status line — required)

`> prompt-understand: intent=[verb+obj], conf [X]%  [✓|?]`

Example: `> prompt-understand: intent=add oauth login, conf 92%  ✓`

---

## Why this exists

Without this, every command tries to read the prompt + ACT in one shot. That's where misinterpretation happens. Forcing a 5-field frame surfaces gaps in 30 seconds — cheaper than 30 minutes of wrong code.
