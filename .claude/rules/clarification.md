# Clarification Rules

When a command includes a "Clarify ambiguities" step:

- **Scan for gaps** that would block writing correct output (unclear scope, missing rules, ambiguous criteria).
- **If everything is clear** → skip entirely. Do NOT ask unnecessary questions.
- **If gaps exist** → collect ALL unclear points into **one message**, ask them together, wait for answers before proceeding.
- **Never ask one-by-one.** Never ask about things already answered in prior docs (discovery, requirement, sprint overview, codebase exploration, or design docs).
- **After receiving answers** → append a `## Clarifications` table to the output doc before the main content:

```
## Clarifications
| # | Question | Answer |
|---|----------|--------|
| 1 | [question asked] | [answer received] |
```
