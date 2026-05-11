# /discovery
Workflow position: **START → /new-sprint**

Run a structured discovery session before any sprint planning.

**Alternative:** use `/brainstorm` for conversational superpowers-style discovery (one question at a time, visual companion, 2–3 approach proposals).

Arguments: `[disc-id] [name]`  — e.g. `disc-001 user-authentication`

---

> **See worked example:** `.claude/examples/example-discovery.md` — a filled-in single-epic OAuth integration discovery, useful as a sanity check when filling the template.

## Step 0 — Check brain for past lessons (scoped)

Skip entirely if `brain/BRAIN-INDEX.md` does not exist.

Otherwise, follow the access protocol in `.claude/rules/brain.md` — open MOCs **only** when relevant to `[name]`:

- Search `brain/BRAIN-INDEX.md` for entries whose title or tags overlap with the keywords in `[name]`.
- If a match points to `MOC-Lessons.md` → open it; otherwise skip Lessons.
- If a match points to `MOC-Decisions.md` → open it; otherwise skip Decisions.
- Never open both MOCs unconditionally.

These inform Step 2 questions: don't re-ask what's already decided; do surface past failure modes.

---

## Step 1 — Pick scenario + create doc

1. **Detect scenario type** from the user's input. Default to `new-feature` when unclear; ask only if the choice would change the prompts materially.
   - `new-feature` — a user-facing capability that doesn't exist yet
   - `refactor` — restructuring code with behavior preserved
   - `bug-investigation` — recurring or multi-system bug worth its own epic
   - `integration` — connecting to an external system / vendor / API
2. Create `docs/discovery/[disc-id]-[name].md` from `docs/templates/DISCOVERY-TEMPLATE.md` with all sections set to `TBD`. Set the doc metadata `Scenario: [type]`.
3. Read the matching scenario prompt template — `docs/templates/discovery-scenarios/[NEW-FEATURE|REFACTOR|BUG-INVESTIGATION|INTEGRATION].md` — and use its scenario-specific prompts when running Step 2 (gap-asking) and Step 3 (filling). The 10 topic structure stays the same; the prompts inside each topic come from the scenario template.

---

## Step 2 — Progressive interview (structured multi-choice)

Walk the 10 topics below as a **structured interview**: one focused `AskUserQuestion` call per gap, each with 2-4 inferred options, progressive (each question's options informed by previous answers and codebase scan).

### Sufficiency bar — when to stop

The interview ends when the discovery doc is **detailed enough for `/requirement` to produce a concrete Implementation Plan** (NOT when implementation itself is fully specified — that is `/requirement`'s job).

Concretely, stop only when ALL of these are true:

- Every of the 10 topics is either **answered** or **confidently inferred** from prior answers / codebase / brain.
- The **Problem Statement** names who, what, and why with no hand-waving.
- **At least 2 candidate approaches** can be written with real Pros / Cons (not placeholders).
- **Constraints** the picked approach must respect are explicit (stack, deadline, compliance, design system).
- **Scope Estimate** is decisive enough to pick single-epic vs multi-epic, with the boundary between in-scope and out-of-scope drawn.
- **Open Questions** that remain are tagged `blocking-for-planning` or `carry-forward-to-/requirement` — no untagged unknowns.

If any of the above is still vague → **ask another question** (drill-down follow-up on the weakest topic, see "Follow-up drill-downs" below). No fixed cap on question count — ask as many as needed to clear the bar.

If everything in the bar is already satisfied from input alone → skip the interview entirely and go to Step 3.

### The 10 topics

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

### Per-topic decision

For each topic, in order 1 → 10:
- **Already answered by user's args or codebase scan** → skip, record the inferred value in the doc.
- **Already implied by an earlier topic's answer** → skip, record the propagated value.
- **Gap remains** → run ONE `AskUserQuestion` call (see Interview rules below).

### Follow-up drill-downs (within a topic)

After a topic's primary answer, if the answer is still too coarse to clear the Sufficiency Bar → run another `AskUserQuestion` on that same topic to drill in. Examples that warrant a follow-up:

- Problem answer = "users are slow" → drill: which step, how slow, how often?
- Users answer = "internal team" → drill: which team, how many people, frequency of use?
- Approaches answer = "use library X" → drill: which integration mode (sidecar vs embedded vs proxy)?
- Constraints answer = "must respect existing auth" → drill: which roles, which endpoints, hard or soft?

A topic may take 1–4 questions. Stop drilling the moment that topic alone wouldn't hold back `/requirement` from writing its Implementation Plan.

### Interview rules

- **One question = one `AskUserQuestion` call.** Do not batch multiple topics or follow-ups into a single call — later options must be informed by earlier answers.
- **2-4 concrete options per question.** Options come from: codebase scan, scenario template prompts (`docs/templates/discovery-scenarios/...`), prior topic answers, brain lessons from Step 0. No placeholders like "TBD" or "Some users".
- **First option is the recommendation** when one is clearly stronger — append ` (Recommended)` to the label. Otherwise list options in a natural order (most-likely-first).
- **Use `description` to surface tradeoffs** — one sentence per option naming what changes if the user picks it.
- **Use `preview` for diagrams/code/mockups** when the choice is structural (e.g. options for the To-Be journey can include a small ASCII flow per option).
- **Skip "Other"** — the harness adds it automatically; do not list it manually.
- **Record the answer in the doc immediately** after each question, in the matching section. Move to the next gap or drill-down.

### Preamble (before the first question)

Print once, before the first `AskUserQuestion`:

> *Created `docs/discovery/[disc-id]-[name].md`. Inferred from input: [list topics with inferred values, 1 line each]. Starting interview — one topic at a time, asking until the doc is detailed enough for `/requirement`. Pending topics: [list].*

Do NOT promise a specific question count — follow-ups may extend it. Quality of the resulting spec > number of questions asked.

### Why not batch all gaps into one message

The old batched-gap pattern asked the user to write prose for every unanswered topic at once. That trains minimal-effort answers ("idk", "see above") and forces the user to think about all 10 topics simultaneously. Progressive multi-choice flips the cost: the AI commits to inferences (visible as the recommended option), the user clicks to confirm or override in one tap, and each answer narrows the option space for the next question. Follow-up drill-downs are cheap (one more click) but indispensable when an answer is still too coarse to feed `/requirement`.

---

## Step 2b — Confidence Gate

Assess confidence that you can fill the discovery doc completely and accurately based on the user's input and answers so far.

Key dimensions:
- Problem statement understood — who, what, why, how often?
- Users and stakeholders identified?
- Constraints and hard limits known?
- Enough information to propose at least 2 concrete approaches?
- Risks and scope realistic to assess?

**>= 90%** → proceed to Step 3.
**< 90%** → **STOP.** State what you know, what you don't, and what you need. Ask targeted follow-up questions. Do NOT fill the doc with guesses. See `.claude/rules/confidence-gate.md` for output format and anti-gaming rules.

---

## Step 3 — Fill the doc

1. Fill every section from user's answers. Write `TBD — needs input` for anything unanswered.
2. Proposed Approaches section: structure at least 2 options. If only one mentioned, add placeholder Option B.
   Each option must have: **Description**, **Pros**, **Cons**, **Recommended** (yes/no with reason).
3. Unknowns & Open Questions section: mark each as `- [ ]` checkbox.
   - Tag each question as either `blocking-for-planning` or `carry-forward-to-/requirement`.
   - `blocking-for-planning` means `/new-sprint` should not commit to task breakdown until answered.
   - `carry-forward-to-/requirement` means the sprint can be planned, but the owning task must resolve it before implementation.
4. **Epic Breakdown section** (apply `.claude/rules/discovery-epic-mapping.md`): inspect Scope Estimate → `Estimated sprints`.
   - **= 1 sprint** → leave the Epic Breakdown table empty.
   - **> 1 sprint** → enumerate each epic as a row (E1, E2, ...). Each row: title, one-line scope, `Depends On` (another epic's ID or `—`), priority. Order by dependency (E1 has no epic deps; E2 may depend on E1, etc.). Also fill **Shared entities / cross-epic concerns** with anything used by more than one epic — ownership goes to the first epic that introduces each.
5. Next Steps section:
   - **Single-epic** → `"/new-sprint [sprint-id] \"[epic description]\""`.
   - **Multi-epic** → one line per epic row in Epic Breakdown, in dependency order, with sequential `[sprint-id]`s (SP[N], SP[N+1], ...).
6. Add a short **Definition of Ready for /new-sprint** note:
   - chosen approach,
   - known scope boundary,
   - blockers still open,
   - questions intentionally deferred to `/requirement`.

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
- Proceed to Step 3c.

---

## Step 3c — DDD bounded contexts (conditional)

Invoke `ddd` in `discovery` mode when ANY of:
- Scope Estimate > 1 sprint (multi-epic discovery), OR
- Problem statement names ≥ 2 distinct stakeholder roles, OR
- Epic Breakdown lists shared concepts between epics.

Otherwise skip and proceed to Step 4 — single-team utility discoveries do not need a bounded-context exercise.

The skill identifies candidate bounded contexts from the problem statement, classifies each as core/supporting/generic, and lists shared concepts with their owning context + integration pattern. Output is appended as a `## Bounded Contexts (DDD)` section before "Definition of Ready for /new-sprint" — `/new-sprint` Step 3 hard-gate uses this list to verify each task has a single owning context.

If the skill flags any context as `generic` that the team plans to build in-house, treat as a Critical finding — recommend an OTS solution before proceeding.

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
- [ ] Each open question is labeled `blocking-for-planning` or `carry-forward-to-/requirement`.
- [ ] If Scope Estimate > 1 sprint → Epic Breakdown has ≥ 2 rows and Next Steps lists one `/new-sprint` per epic in dependency order.
- [ ] If Scope Estimate = 1 sprint → Epic Breakdown is empty and Next Steps has a single `/new-sprint` invocation.

Fix any issue found. Re-read the affected section to confirm the fix before proceeding.

---

## Output

```
✓ docs/discovery/[disc-id]-[name].md
  Open questions: [N]  |  Status: discovery / backlog

Next: resolve open questions → /new-sprint [sprint-id] "[epic description]"
```
