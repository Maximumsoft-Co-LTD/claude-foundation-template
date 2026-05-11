---
name: Discovery Rules
description: Requires `/discovery` to infer answers from input, then run a progressive multi-choice interview — ask as many `AskUserQuestion` questions as needed (including drill-down follow-ups) until the doc is sufficient for `/requirement` to produce an Implementation Plan.
scope: universal
---

# Discovery Rules

When running `/discovery`:

- **Infer first** — analyze the user's input and pre-fill every topic that can be reasonably inferred from args, codebase scan, or brain lessons.
- **Skip if clear** — if input already satisfies the Sufficiency Bar (below), go straight to filling the doc; no interview at all.
- **Interview gaps progressively** — for each remaining gap, run ONE `AskUserQuestion` call with 2-4 concrete inferred options. One question per call so later options can be informed by earlier answers.
- **Drill down when answers are too coarse** — follow-up questions on the same topic are allowed (and expected) whenever an answer doesn't yet clear the Sufficiency Bar. No fixed cap on question count.
- **Multi-choice only, never free-text interrogation** — every interview question MUST use `AskUserQuestion`. Free-form chat-style Q&A is forbidden in `/discovery` (use `/brainstorm` for conversational exploration).
- **Recommend a default** — when one option is clearly stronger, place it first and append ` (Recommended)` to its label. Don't sit on the fence when codebase or prior answers point to a default.
- **Record as you go** — fill the matching doc section after each answer before moving to the next gap.

## Sufficiency Bar

Stop the interview only when ALL of these are true — the doc must be **detailed enough for `/requirement` to produce a concrete Implementation Plan**, not implementation-ready by itself:

- Every of the 10 topics is answered or confidently inferred.
- Problem Statement names who / what / why with no hand-waving.
- At least 2 candidate approaches with real Pros / Cons (not placeholders).
- Constraints the chosen approach must respect are explicit (stack, deadline, compliance, design system).
- Scope Estimate decisively picks single-epic vs multi-epic, with the in-/out-of-scope boundary drawn.
- Remaining Open Questions are tagged `blocking-for-planning` or `carry-forward-to-/requirement` — no untagged unknowns.

If any item is still vague → ask another question (drill-down on the weakest topic). Quality of the resulting spec > number of questions asked.

Flow: create file → infer from input/codebase/brain → preamble (what's inferred + pending topics) → progressive `AskUserQuestion` per gap, with follow-ups, until Sufficiency Bar is met → Step 3 fills any still-unanswered sections from inference.

## Relationship to clarification.md

`.claude/rules/clarification.md` says "never one-by-one" and applies to commands with a *"Clarify ambiguities"* step (`/requirement`, `/implement`, etc. — those still batch ambiguities into a single message). `/discovery` Step 2 is a **progressive interview**, not a clarification step, and follows the multi-choice rule above. The two rules cover different phases and do not conflict.

## Why

The old batched-gap pattern asked for prose answers to every unanswered topic at once — trains "idk" / "see above" answers and forces the user to think about all 10 topics simultaneously. Progressive multi-choice flips the cost: the AI commits to inferences (visible as the recommended option), the user confirms or overrides in one click, and each answer narrows the option space for the next question. Free-text one-question-at-a-time is what `/brainstorm` is for; `/discovery` is the structured path.
