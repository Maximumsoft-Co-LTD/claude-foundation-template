# /discovery
Workflow position: **START → /new-sprint**

Run a structured discovery session before any sprint planning.
Arguments: $ARGUMENTS
Format: `[disc-id] [name]`  — e.g. `disc-001 user-authentication`

This command ALWAYS conducts an interactive Q&A. Ask ONE question at a time and wait for the answer. Never fill in answers without the user's input. Never skip a question.

---

## Step 1 — Open the session

Say:
> "Starting discovery for **[name]** (`[disc-id]`). I'll ask 8 questions one at a time. Answer as much or as little as you know — unknowns are fine, we'll mark them."

---

## Step 2 — Ask these 8 questions one at a time

**Q1 — Problem**
> "What problem are we solving? Who experiences it, how often, and what happens when it's not solved?"

**Q2 — Users & Stakeholders**
> "Who are the primary users affected? Any other teams, systems, or stakeholders involved?"

**Q3 — Goals & Success**
> "What does success look like when this ships? How will we measure it?"

**Q4 — Constraints**
> "Any hard limits? (tech stack, deadline, budget, compliance, design system, existing integrations)"

**Q5 — Context & Background**
> "Any relevant history? Previous attempts, related systems, or decisions already made?"

**Q6 — Approaches**
> "What solutions have been considered? What are the trade-offs? Even rough ideas count."

**Q7 — Unknowns & Open Questions**
> "What do we NOT know yet that could affect the solution? What needs a decision from someone else?"

**Q8 — Risks & Scope**
> "What are the biggest risks? And roughly — is this a 1-sprint feature, multi-sprint, or larger?"

---

## Step 3 — Confirm summary

Show a compact summary and ask: "Does this look right before I write the doc?"

```
Problem:      [one line]
Users:        [one line]
Goals:        [one line]
Constraints:  [one line]
Approach:     [chosen / TBD]
Unknowns:     [N] open questions
Risks:        [N] identified
Scope:        [estimate]
```

Wait for confirmation or corrections before proceeding.

---

## Step 4 — Write the discovery document

1. Create `docs/discovery/[disc-id]-[name].md` from `docs/DISCOVERY-TEMPLATE.md`.
2. Fill every section from the answers. Write `TBD — needs input` for anything unanswered.
3. For Section 6 (Approaches): structure at least 2 options. If only one was mentioned, add a placeholder Option B.
4. For Section 7 (Unknowns): mark each as `- [ ]` checkbox.
5. For Section 11 (Next Steps): always include "When ready → run `/new-sprint [sprint-id] \"[epic description]\"`".

---

## Step 5 — Update BACKLOG.md

Add to the **Discovery Backlog** section in `docs/BACKLOG.md`:
- Status: `discovery` if open questions remain, `backlog` if all resolved.

---

## Step 6 — Output

```
✓ Discovery doc: docs/discovery/[disc-id]-[name].md
  Open questions: [N] — resolve before sprint planning
  Status: discovery / backlog

Next step:
  When all questions are resolved and approach is approved →
  /new-sprint [sprint-id] "[epic description]"
```
