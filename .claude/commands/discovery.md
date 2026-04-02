# /discovery
Workflow position: **START → /new-sprint**

Run a structured discovery session before any sprint planning.

**Alternative:** use `/brainstorm` for conversational superpowers-style discovery (one question at a time, visual companion, 2–3 approach proposals).

Arguments: `[disc-id] [name]`  — e.g. `disc-001 user-authentication`

---

## Step 0 — Check brain for past lessons

If `brain/BRAIN-INDEX.md` exists:
- Read `brain/00-MOC/MOC-Lessons.md` — any lesson tagged with keywords from `[name]`? Note it.
- Read `brain/00-MOC/MOC-Decisions.md` — any decision already made in this problem domain? Note it.
- These inform Step 2 questions: don't re-ask what's already decided; do surface past failure modes.

Skip if brain doesn't exist yet.

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
   Each option must have: **Description**, **Pros**, **Cons**, **Recommended** (yes/no with reason).
3. Section 10 (Unknowns): mark each as `- [ ]` checkbox.
4. Section 13 (Next Steps): always include "When ready → `/new-sprint [sprint-id] \"[epic description]\"`".

---

## Step 3b — HARD-GATE: Approach Approval

<HARD-GATE>
DO NOT proceed to Step 4 or suggest `/new-sprint` until user has explicitly chosen an approach.
Exception: if user says "obvious" or "skip gate" → mark the single/recommended approach as selected and proceed.
</HARD-GATE>

Present the approaches as a numbered choice:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Discovery: [disc-id]-[name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Option 1: [Approach name]
  Pros: [...]   Cons: [...]

Option 2: [Approach name]
  Pros: [...]   Cons: [...]

Recommendation: Option [N] — [one-line reason]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Which approach? (pick number, suggest alternative, or "go with recommendation")
```

Wait for user's choice. Once chosen:
- Update Section 8 in the discovery doc — mark chosen option as `✓ SELECTED`, others as `✗ Not chosen`.
- Proceed to Step 4.

---

## Step 4 — Update BACKLOG.md

Add to the **Discovery Backlog** section:
- Status: `discovery` if open questions remain · `backlog` if all resolved.

---

## Self-check

Before reporting output, re-read `docs/discovery/[disc-id]-[name].md` in full and verify:
- [ ] All 10 topic sections are filled — no section left as `TBD` unless explicitly unanswerable.
- [ ] At least 2 options exist in Approaches section, each with Description / Pros / Cons / Recommended.
- [ ] One approach is marked `✓ SELECTED` — approach approval gate was completed.
- [ ] All open questions are formatted as `- [ ]` checkboxes.
- [ ] Next Steps section includes the `/new-sprint` instruction.

Fix any issue found. Re-read the affected section to confirm the fix before proceeding.

---

## Output

```
✓ docs/discovery/[disc-id]-[name].md
  Open questions: [N]  |  Status: discovery / backlog

Next: resolve open questions → /new-sprint [sprint-id] "[epic description]"
```
