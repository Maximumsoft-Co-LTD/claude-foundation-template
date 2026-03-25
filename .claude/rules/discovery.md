# Discovery Rules

When running `/discovery`:

- **Infer first** — analyze the user's input and pre-fill what can be reasonably inferred.
- **Ask once** — collect all unanswered questions into a single message, never one-by-one.
- **Skip if clear** — if the input already answers everything, go straight to filling the doc without asking.

Flow: create file → infer answers from input → show brief summary of what's understood → ask only the gaps (in one message).
