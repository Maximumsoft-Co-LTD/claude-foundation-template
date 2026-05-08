---
name: solution-options
description: For any non-trivial decision, generate 2–3 viable approaches with tradeoff matrix and a recommended default — pairs with ask-choice
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git diff:*)
---

# solution-options

Workflow position: **invoke before any architectural / implementation / refactor decision that has > 1 reasonable path**

Stops "I'll just pick one and hope" failure mode. Forces explicit tradeoff thinking before code.

Arguments: `[problem statement]` or `[task-id]`

---

## When to invoke

- `/discovery` Step 3 — proposing how to solve the discovered problem
- `/issue` — choosing a fix strategy
- `/code-review` — proposing a refactor
- `/requirement` — picking architecture (auth flow, state shape, persistence model)
- Any time before answering "how should we...?" with one option

Skip:
- Decision is forced (only 1 way works)
- Decision was already made in `/discovery` or a DEC note in brain — go re-read, don't re-decide

---

## Step 1 — Check brain first

Before generating options, look for prior decisions:

```bash
# Search for matching DEC note
grep -rli "[problem keyword]" brain/02-decisions/ 2>/dev/null
```

If a relevant DEC exists → cite it and use that choice. Don't re-litigate.

---

## Step 2 — Generate 2–3 options

For each option, produce this block:

```
### Option [N]: [name in ≤ 6 words]

**What it is:** [1–2 sentences, concrete]

**How it works:**
- [step 1]
- [step 2]
- [step 3]

**Pros:**
- [concrete benefit, not "simpler"]
- [...]

**Cons:**
- [concrete cost — time, lock-in, risk]
- [...]

**Effort:** [S = < 2hr / M = ≤ 1 day / L = > 1 day]
**Reversibility:** [easy / medium / hard]
**Risk:** [low / medium / high — and why]
```

Rules:
- Minimum 2 options. Maximum 3. (Beyond 3 is paralysis.)
- Every option must be **viable** — no straw-man "do nothing if we want to fail"
- At least one option must be the **simpler** path (often the right answer)
- At least one must be the **safer** path (might overlap with simpler)

---

## Step 3 — Tradeoff matrix

Compress into a single table:

| Dimension | Opt 1 | Opt 2 | Opt 3 |
|---|---|---|---|
| Effort | S | M | L |
| Reversibility | easy | medium | hard |
| Risk | low | medium | high |
| Lock-in | none | medium | high |
| Performance | OK | better | best |
| Maintenance cost | low | low | medium |

Pick dimensions that actually matter for THIS decision. Don't pad.

---

## Step 4 — Recommend a default

State your pick + 1-line reason:

```
**Recommended:** Option [N]
**Why:** [≤ 20 words — the deciding factor, not a summary of all pros]
```

Anti-pattern: "Option 2 because it has many pros" → that's not a reason, list the ONE deciding factor.

---

## Step 5 — Hand off to ask-choice (if user input needed)

If the decision affects requirements, architecture, or user-visible behavior:

**Manual mode:**

```
Invoke Skill("ask-choice") to confirm the recommendation with the user.
```

**Autopilot mode:** do NOT invoke `ask-choice` directly. Emit `?` in the status line and return so the orchestrator can batch ambiguities (per `.claude/rules/autonomous-mode.md`).

If the decision is purely technical and reversible, proceed with the recommended option without asking.

Threshold:
- **Ask** if: schema change, new dependency, public API shape, breaking behavior
- **Don't ask** if: variable naming, file split, internal helper extraction

---

## Step 6 — Persist (if architectural)

If this decision affects future work, write a DEC note via `brain-capture`:

```
Invoke Skill("brain-capture") with type=DEC for this decision.
```

This prevents re-litigating the same choice in 3 sprints.

---

## Output

```
Problem: [1-line restatement]
Options: [N]
Tradeoff matrix: [paste]

Recommended: Option [N] — [reason]
Asking user: yes / no
DEC note: [filed / skipped because reversible]
```

---

## Anti-patterns

- ❌ Single option dressed as "options" — that's not a choice, that's a plan
- ❌ All options have the same effort/risk — you didn't think across the space
- ❌ Recommendation without a deciding factor — copy-paste of pros
- ❌ Skipping brain check — re-deciding what was already decided

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: present options + recommendation + (optionally) hand off to `ask-choice`.
- **Autopilot mode**: if recommendation is high-confidence and reversible → proceed silently with rec; flag `?` and let orchestrator batch otherwise. Architectural / breaking-change decisions ALWAYS flag `?` regardless of confidence.

## Output (autopilot status line — required)

`> solution-options: [N] options, rec=[Opt N]  [✓|?]`

Example: `> solution-options: 3 options, rec=Opt 2 (Redis cache)  ?`

---

## Why this exists

Picking one approach without considering alternatives is how teams end up with the wrong architecture they can't undo. Forcing 2–3 options + matrix takes 5 minutes and prevents days of rework.
