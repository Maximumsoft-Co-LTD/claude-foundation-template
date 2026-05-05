# Discovery — Bug Investigation (epic-scale)

For when a bug is large enough to need its own epic — recurring incident, multi-system failure, or a class of bugs needing a coordinated fix. For single-task bugs use `/issue` or `/debug`, not `/discovery`.

Scenario-specific prompts for the 10 discovery topics. Use alongside `DISCOVERY-TEMPLATE.md`.

## 1 · Problem
- Symptom one user/operator can describe in one sentence.
- Frequency, blast radius, severity (data loss / availability / performance / cosmetic).
- First sighting: when was it noticed, what changed in that window?

## 2 · Users & Stakeholders
- Users encountering the bug (who, role, region, plan tier).
- On-call / support load this is generating.

## 3 · Goals & Success
- "Bug no longer reproducible under [precise condition]."
- A regression test exists that fails before the fix and passes after — and is run in CI.
- A post-incident lesson is captured as a brain `LES-` note.

## 4 · As-Is Behavior
- Reproduction steps that work consistently. If intermittent, observed pattern.
- The exact incorrect output / state, with evidence (logs, traces, screenshots).

## 5 · To-Be Behavior
- Correct output / state, sourced from spec / design doc / user expectation.
- For each error path: what *should* the system do?

## 6 · Context & Background
- Related past bugs (link `LES-` notes if any).
- Ownership: which team owns the affected component.

## 7 · Constraints
- **Hot vs cold fix** — does this need a patch release, or wait for the next train?
- Backwards compatibility for clients during the fix window.
- Data fix requirement (corrupt rows, queue items, etc.).

## 8 · Approaches
- Fix at source vs. workaround at boundary.
- Single point fix vs. systemic fix (eliminating the class of bug).
- Trade-offs: time-to-recovery, risk of new regressions, maintenance burden.

## 9 · Unknowns & Open Questions
- What instrumentation is missing to confirm root cause?
- Are there silent variants of this bug we haven't seen in tickets yet?

## 10 · Risks & Scope
- **Regression risk** — what could the fix break?
- **Data correction** — does any data already in production need a backfill?
- Sprint count. Most bug-investigation epics fit in one sprint; multi-sprint indicates the fix is also a refactor.
