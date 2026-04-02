# /brainstorm
Workflow position: **START → /new-sprint**

Conversational discovery via the superpowers:brainstorming skill. An alternative to `/discovery` for open-ended ideation — explores user intent, requirements, and design through natural dialogue before producing a discovery doc.

**When to choose this over `/discovery`:**
- Idea is rough and needs shaping before structured planning
- You want one-question-at-a-time exploration with visual companion support
- You want 2–3 approach proposals with trade-offs before committing

**When to choose `/discovery` instead:**
- Problem is well-understood and you want to fill the 10-topic structured template directly
- You already have constraints, users, and goals defined

Arguments: `[disc-id] [name]`  — e.g. `disc-001 payment-notifications`

---

## Step 0 — Check brain for past lessons

If `brain/BRAIN-INDEX.md` exists:
- Read `brain/00-MOC/MOC-Lessons.md` — any lesson tagged with keywords from `[name]`? Note it.
- Read `brain/00-MOC/MOC-Decisions.md` — any decision already made in this problem domain? Note it.
- Surface past failure modes and prior decisions upfront — they inform the brainstorming questions.

Skip if brain doesn't exist yet.

---

## Step 1 — Invoke superpowers:brainstorming

<HARD-GATE>
Do NOT write any discovery doc, scaffold any files, or suggest `/new-sprint` until the brainstorming skill has presented a design and the user has approved it.
</HARD-GATE>

Invoke the brainstorming skill:
```
Skill("superpowers:brainstorming")
```

**Template overrides to apply during the skill:**

1. **Save path** — when the skill says "save to `docs/superpowers/specs/...`", save to `docs/discovery/[disc-id]-[name].md` instead. Use the discovery template (`docs/templates/DISCOVERY-TEMPLATE.md`) as the base structure if it exists.

2. **Transition** — when the skill says "invoke writing-plans", do NOT invoke writing-plans. Instead, transition to `/new-sprint` (see Step 2 below).

3. **Brain context** — prepend any brain notes from Step 0 to the project context the skill reads.

---

## Step 2 — After spec approval: update backlog

Once the brainstorming skill has written and committed the spec:

1. Update `docs/BACKLOG.md` — add to **Discovery Backlog** section:
   - Status: `discovery` if open questions remain · `backlog` if all resolved.

2. Update the discovery doc's **Next Steps** section to include:
   `When ready → /new-sprint [sprint-id] "[epic description]"`

---

## Output

```
✓ docs/discovery/[disc-id]-[name].md
  Open questions: [N]  |  Status: discovery / backlog

Next: resolve open questions → /new-sprint [sprint-id] "[epic description]"
```
