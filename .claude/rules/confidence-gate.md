# Confidence Gate Rules

**Before executing any workflow command or making changes, you MUST assess your confidence that you can complete the task successfully. If confidence is below 90%, STOP and gather more information.**

## When this applies

Every workflow command: `/discovery`, `/requirement`, `/design fe`, `/design be`, `/implement`, `/issue`, `/code-review`, `/testing`, `/retro-task`, `/debug`, `/refactor`

Also applies to: any freeform request that involves writing or modifying code, docs, or configuration.

## How to assess

Before proceeding, evaluate these dimensions silently:

1. **Requirement clarity** — Do I know exactly what needs to be built/changed?
2. **Codebase familiarity** — Have I read the relevant files and understand the current state?
3. **Acceptance criteria** — Are the success conditions unambiguous?
4. **Dependencies** — Do I know what this touches and what could break?
5. **Approach** — Do I have a concrete plan, not just a vague direction?

## The rule

- **< 90% confident** — **STOP.** Do not proceed. Instead:
  1. State what you ARE confident about (briefly).
  2. State what you are NOT confident about and why.
  3. Ask targeted questions or request access to specific files/context.
  4. Re-assess after receiving answers. Repeat until you reach 90%.

- **>= 90% confident** — Proceed with execution.

## Output format (when blocked)

When confidence is below 90%, output this before anything else:

```
**Confidence: [X]%** — not enough to proceed.

Confident about:
- [what you know]

Not confident about:
- [gap 1] — [why / what's missing]
- [gap 2] — [why / what's missing]

Need from you:
- [specific question or request 1]
- [specific question or request 2]
```

## Anti-gaming rules

- Do NOT inflate confidence to avoid stopping. If you have doubts, the number must reflect them.
- Confidence must be based on **evidence** (files read, context received), not assumptions.
- "I think I know" is not 90%. "I read the file and confirmed" is.
- If you discover mid-task that your confidence was wrong — STOP at that point, reassess, and flag it.

## Why

AI that guesses and gets it wrong wastes more time than AI that asks first and gets it right. The 90% bar ensures high-quality output by forcing information gathering before action. One round of clarifying questions is cheaper than one round of wrong implementation.
