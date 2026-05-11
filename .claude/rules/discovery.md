---
name: Discovery Rules
description: Requires `/discovery` to infer answers from input, batch all gaps into a single question, and skip asking entirely when the input is clear.
scope: universal
---

# Discovery Rules

When running `/discovery`:

- **Infer first** — analyze the user's input and pre-fill what can be reasonably inferred.
- **Ask once** — collect all unanswered questions into a single message, never one-by-one.
- **Skip if clear** — if the input already answers everything, go straight to filling the doc without asking.

Flow: create file → infer answers from input → show brief summary of what's understood → ask only the gaps (in one message).

## Why

Interrogation-style Q&A — one question at a time, waiting for answers — breaks flow and trains users to give minimal input. Pre-filling from context signals that Claude is actively reasoning, not just prompting. Batching gaps into a single message keeps the conversation to one round-trip when clarification is truly needed.
