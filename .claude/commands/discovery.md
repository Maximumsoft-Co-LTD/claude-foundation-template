# /discovery
Workflow position: **START → /new-sprint**

Run a structured discovery session before any sprint planning.
Arguments: $ARGUMENTS
Format: `[disc-id] [name]`  — e.g. `disc-001 user-authentication`

---

## Step 1 — Create the discovery document immediately

Before asking anything, create `docs/discovery/[disc-id]-[name].md` from `docs/templates/DISCOVERY-TEMPLATE.md` with all sections blank (filled with `TBD`).

---

## Step 2 — Ask all 8 questions at once in a single message

After creating the file, say:
> "Created `docs/discovery/[disc-id]-[name].md`. Please answer the following questions — skip anything you don't know yet, I'll mark those as TBD:"

Then list all 8 questions together in one message:

1. **Problem** — What problem are we solving? Who experiences it, how often, and what happens when it's not solved?
2. **Users & Stakeholders** — Who are the primary users affected? Any other teams, systems, or stakeholders involved?
3. **Goals & Success** — What does success look like when this ships? How will we measure it?
4. **Constraints** — Any hard limits? (tech stack, deadline, budget, compliance, design system, existing integrations)
5. **Context & Background** — Any relevant history? Previous attempts, related systems, or decisions already made?
6. **Approaches** — What solutions have been considered? What are the trade-offs? Even rough ideas count.
7. **Unknowns & Open Questions** — What do we NOT know yet that could affect the solution? What needs a decision from someone else?
8. **Risks & Scope** — What are the biggest risks? And roughly — is this a 1-sprint feature, multi-sprint, or larger?

Wait for the user's answers before proceeding.

---

## Step 3 — Update the discovery document with answers

1. Fill every section of the already-created file from the user's answers. Write `TBD — needs input` for anything unanswered.
2. For Section 6 (Approaches): structure at least 2 options. If only one was mentioned, add a placeholder Option B.
3. For Section 7 (Unknowns): mark each as `- [ ]` checkbox.
4. For Section 11 (Next Steps): always include "When ready → run `/new-sprint [sprint-id] \"[epic description]\"`".

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
