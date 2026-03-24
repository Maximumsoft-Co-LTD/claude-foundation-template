# /discovery
Workflow position: **START → /new-sprint**

Run a structured discovery session before any sprint planning.
Arguments: `[disc-id] [name]`  — e.g. `disc-001 user-authentication`

---

## Step 1 — Create doc immediately

Create `docs/discovery/[disc-id]-[name].md` from `docs/templates/DISCOVERY-TEMPLATE.md` with all sections set to `TBD`.

---

## Step 2 — Ask only about the gaps

Analyze the user's arguments. For each of the 10 topics below, decide: already answered → skip; partially answered → ask only the missing part; unknown → include.

1. **Problem** — What problem? Who experiences it, how often, what happens when unsolved?
2. **Users & Stakeholders** — Primary users? Other teams, systems, stakeholders?
3. **Goals & Success** — What does success look like? How will we measure it?
4. **As-Is Journey** — How do users currently handle this? Pain points?
5. **To-Be Journey** — How will users experience the solved flow end-to-end?
6. **Context & Background** — Previous attempts, related systems, decisions already made?
7. **Constraints** — Hard limits: tech stack, deadline, budget, compliance, design system?
8. **Approaches** — Solutions considered? Trade-offs? Even rough ideas count.
9. **Unknowns & Open Questions** — What don't we know yet that could affect the solution?
10. **Risks & Scope** — Biggest risks? Is this 1-sprint, multi-sprint, or larger?

Say: *"Created `docs/discovery/[disc-id]-[name].md`. Here's what I understood — fill in only the gaps:"*
Show what's inferred, then ask only unanswered questions in **one message**.
If everything is already clear → skip to Step 3.

Wait for user's answers.

---

## Step 3 — Fill the doc

1. Fill every section from user's answers. Write `TBD — needs input` for anything unanswered.
2. Section 8 (Approaches): structure at least 2 options. If only one mentioned, add placeholder Option B.
3. Section 10 (Unknowns): mark each as `- [ ]` checkbox.
4. Section 13 (Next Steps): always include "When ready → `/new-sprint [sprint-id] \"[epic description]\"`".

---

## Step 4 — Update BACKLOG.md

Add to the **Discovery Backlog** section:
- Status: `discovery` if open questions remain · `backlog` if all resolved.

---

## Output

```
✓ docs/discovery/[disc-id]-[name].md
  Open questions: [N]  |  Status: discovery / backlog

Next: resolve open questions → /new-sprint [sprint-id] "[epic description]"
```
