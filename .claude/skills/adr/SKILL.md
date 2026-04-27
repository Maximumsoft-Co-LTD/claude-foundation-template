---
description: Record an architectural decision with context, options considered, and rationale
allowed-tools: Read, Write, Bash(git log *), Bash(ls *)
disable-model-invocation: false
---

# /adr
Workflow position: **during /requirement (FE or BE design section) → START → continue requirement**

Capture a non-trivial architectural decision as an immutable record. Run when a design doc contains a decision that future engineers will question — "why X and not Y?"
Arguments: `[task-id] [short-title]`  — e.g. `SP1-T002 use-event-sourcing-for-orders`

---

## Step 1 — Determine next ADR number

```bash
ls docs/decisions/ 2>/dev/null | grep "^ADR-" | sort | tail -1
```

If `docs/decisions/` doesn't exist → create it. Next number = last ADR number + 1, starting at `ADR-001`.

Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` (Sections 3 and 4 — FE Design and BE Design) — identify the decision to record from context.

---

## Step 2 — Gather decision context

Ask (or infer from design doc):

1. **Context** — What situation forced this decision? What constraints applied?
2. **Options considered** — What were the realistic alternatives? (minimum 2)
3. **Decision** — What was chosen?
4. **Rationale** — Why this option over the others? What trade-offs were accepted?
5. **Consequences** — What becomes easier? What becomes harder? What is now ruled out?

---

## Step 3 — Write the ADR

Save to `docs/decisions/ADR-[NNN]-[short-title].md`:

```markdown
# ADR-[NNN]: [Short Title]

**Status:** Accepted
**Date:** [YYYY-MM-DD]
**Task:** [task-id]
**Deciders:** [names or roles]

---

## Context

[What situation, constraint, or problem drove this decision?
Include relevant technical and business context.]

## Options Considered

### Option A: [name]
[Description]
- Pros: ...
- Cons: ...

### Option B: [name]
[Description]
- Pros: ...
- Cons: ...

### Option C: [name] *(if applicable)*
[Description]

## Decision

**Chosen: Option [X] — [name]**

[1–2 sentences on why this option was chosen over the alternatives.]

## Rationale

[Deeper explanation of the trade-offs accepted, constraints that ruled out other options,
and any time/complexity/risk factors that influenced the choice.]

## Consequences

**Positive:**
- [What becomes easier or better]

**Negative / Trade-offs:**
- [What becomes harder or is now ruled out]

**Neutral / Follow-up:**
- [What will need revisiting; related ADRs to create later]

## References

- [task-id]-requirement.md (Sections 3 · Frontend Design / 4 · Backend Design)
- [Any external references, RFCs, articles that informed the decision]
```

---

## Step 4 — Link from requirement doc

In `[task-id]-requirement.md`, under the relevant `FE Design Decisions` or `BE Design Decisions` table (Sections 3 or 4), add a row:

```markdown
| Decision | Why | Alternatives Rejected |
|----------|-----|-----------------------|
| [Short title] | see [ADR-NNN](../../../decisions/ADR-NNN-short-title.md) | [one-line summary] |
```

---

## Output

```
✓ docs/decisions/ADR-[NNN]-[short-title].md
✓ [task-id]-requirement.md — Design Decisions row added in Section 3 or 4

Status: Accepted
Next: continue /requirement [task-id]
```

To supersede an existing ADR: update its `Status:` to `Superseded by ADR-[NNN]` and link to the new one.
