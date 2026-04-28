---
type: concept
tags: [workflow, quality, claude-code, prompt-engineering]
related: [CON-sprint-lifecycle, CON-verification-before-completion, PAT-005-subagent-driven-development]
updated: 2026-04-29
source: template
---

# Confidence Gate

## Core idea

Before executing any workflow command or making changes, the AI must self-assess confidence on a 0–100% scale. **Below 90% → STOP and gather more information.** At ≥90%, proceed.

This is an **anti-guessing** mechanism. AI that guesses and gets it wrong wastes more time than AI that asks one round of clarifying questions and gets it right the first time.

## When this applies

- Every workflow slash command: `/discovery`, `/requirement`, `/implement`, `/issue`, `/code-review`, `/testing`, `/retro-task`, `/debug`, `/refactor`
- Any freeform request that involves writing or modifying code, docs, or configuration

## The 5 dimensions of confidence

Before proceeding, evaluate silently:

1. **Requirement clarity** — Do I know exactly what to build/change?
2. **Codebase familiarity** — Have I read the relevant files and understand current state?
3. **Acceptance criteria** — Are success conditions unambiguous?
4. **Dependencies** — Do I know what this touches and what could break?
5. **Approach** — Do I have a concrete plan, not a vague direction?

## Output format when blocked

```
**Confidence: [X]%** — not enough to proceed.

Confident about:
- [what you know]

Not confident about:
- [gap 1] — [why / what's missing]

Need from you:
- [specific question or request 1]
```

## Anti-gaming rules

- Do NOT inflate confidence to avoid stopping. Doubts must reflect in the number.
- Confidence must be based on **evidence** (files read, context received), not assumptions.
- "I think I know" is not 90%. "I read the file and confirmed" is.
- If mid-task you discover confidence was wrong → STOP at that point, reassess, flag it.

## Why 90%, not 100%?

100% is unattainable; the bar would never be met. 90% says "high enough that the residual risk is acceptable." It encodes the engineering judgement: gather enough to be reasonably sure, then act — perfectionism is its own waste.

## Why 90%, not 70%?

A 70% bar would tolerate too much guessing. Empirically, AI confidence below ~85% on coding tasks correlates with rework. The 90% gate forces the AI to surface gaps **before** writing code, not after.

## Related

- `.claude/rules/confidence-gate.md` — runtime enforcement
- [[CON-self-check-rule]] — post-write verification mirror of the same principle
- [[CON-verification-before-completion]] — evidence gate at the other end of the work
