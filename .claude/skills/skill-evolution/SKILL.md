---
description: Detect repeated friction patterns from sprint and propose new skills or update existing ones — with overlap detector to prevent skill bloat
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(ls:*), Bash(grep:*), Bash(git log:*), Bash(git diff:*)
disable-model-invocation: false
---

# skill-evolution

Workflow position: **last step of /retro-sprint — runs once per sprint, proposes skill changes, requires user confirm**

The meta-skill that lets the skill catalog grow with the project without bloating. Detects "we did the same thing manually 3 times this sprint" and turns it into a skill (or updates an existing one).

Arguments: `[sprint-id]`

---

## When to invoke

- `/retro-sprint` final step (mandatory)
- Manually after a notable cross-task pattern was solved ad-hoc

Skip:
- Mid-sprint (data is incomplete)
- Sprints with < 3 tasks (not enough signal)

---

## Step 1 — Gather friction signals

Read in this order:

1. `docs/sprints/[sprint-id]/[sprint-id]-retro.md` — explicit pain logged
2. `docs/sprints/[sprint-id]/*/[task-id]-retro.md` — per-task retros
3. `git log --grep='fix' --oneline` for the sprint range — "fix" commits often hide repeated bugs
4. `brain/04-lessons/` — new LES notes filed this sprint

Build a friction list:

```
| # | Friction | Frequency this sprint | Tasks affected |
|---|----------|----------------------|----------------|
| 1 | "ลืม run mongo seed before e2e" | 4 times | T012, T015, T018, T020 |
| 2 | "type drift between Vue composable and Go handler" | 2 times | T015, T019 |
| 3 | "took 30 min figuring out which port to use" | 3 times | T012, T015, T020 |
```

Threshold: a friction must appear **≥ 2 times across ≥ 2 tasks** to qualify.

---

## Step 2 — Match against existing skills

For each friction, check:

```bash
# Does an existing skill already address this?
grep -rli "[friction keyword]" .claude/skills/ --exclude-dir=_archive
```

Possible outcomes per friction:

| Match result | Action |
|---|---|
| **Exact skill exists, was used** → friction is despite the skill | UPDATE skill (something is missing) |
| **Exact skill exists, NOT used** | UPDATE caller command to invoke it (wiring problem, not skill problem) |
| **Partial match** (50–80% related) | UPDATE existing skill to expand scope OR explicit decision to keep separate |
| **No match** | PROPOSE new skill |

---

## Step 3 — Overlap detector (BEFORE proposing new)

For any candidate new skill, compute description similarity against existing 17:

```
For each existing skill:
  overlap_score = words_in_common(new.description, existing.description) / total_words
  if overlap_score > 0.5:
    flag for merge consideration
```

Manual rule of thumb (the score is just a hint):
- Same verb + same object → merge with existing
- Same domain (Mongo, Go, Vue) but different action → can be separate
- Cross-cutting (logging, auth) → usually a rule, not a skill

If overlap > 50% → **do not propose new**. Update the closest existing skill instead.

---

## Step 4 — Propose changes (one block per change)

```
### Proposal A — UPDATE local-run

Friction:        "ลืม run mongo seed before e2e" (4× this sprint)
Reason:          local-run runs but seed step is optional and gets skipped
Change:          Make Step 6 (Seed) mandatory unless --no-seed flag passed
Diff preview:
  - Step 6 — Seed (if applicable)
  + Step 6 — Seed (mandatory unless `--no-seed`)

### Proposal B — NEW skill: socket-debug

Friction:        "socket events firing twice / not firing" (3× this sprint)
Reason:          No existing skill covers socket-specific failure modes
Overlap check:   debug skill is general; socket has specific patterns (rooms, namespaces, reconnect, ack)
Scope:           ≤ 150 lines — reproduce → check namespace → check room → check reconnect handler → check ack
Invoked from:    /debug, /issue (when symptom mentions socket)
```

Aim: ≤ 3 proposals per sprint. More = noise. Triage by friction frequency × tasks affected.

---

## Step 5 — Decision via ask-choice

For each proposal:

```
Invoke Skill("ask-choice") with:
  question: "Apply Proposal [letter]?"
  options:
    A) Yes — apply now (this skill writes the diff)
    B) Defer to next sprint (open follow-up note)
    C) Reject — friction was one-off, not pattern (explain why)
```

User must answer for every proposal. Default is B (safer).

---

## Step 6 — Apply approved changes

For each "A) Yes" proposal:

**If UPDATE existing skill:**
- Read current SKILL.md
- Edit precisely the section that needs change
- Run self-check (per `.claude/rules/self-check.md`)
- Commit message: `SP[N] chore(skills): update [skill-name] — [1-line reason]`

**If NEW skill:**
- Create folder `.claude/skills/[name]/`
- Write `SKILL.md` with frontmatter + body
- Add a one-line entry to a manifest if the project keeps one
- Commit message: `SP[N] chore(skills): add [name] — [1-line reason]`

Never apply changes silently — always within one of the proposals user approved.

---

## Step 7 — Wire to a command (if new skill)

A new skill with no caller is dead weight. Identify which command(s) should invoke it:

```
Invoke Skill("ask-choice") with:
  question: "Wire [new skill] into which command(s)?"
  options:
    A) /implement   B) /code-review   C) /debug   D) Don't wire yet (manual only)
```

If user picks a command → make a follow-up TODO ("update /[command] to invoke [new skill]") in the retro doc. Wiring itself is done by the user or in a follow-up sprint, not auto.

---

## Step 8 — Log evolution

Append to `docs/sprints/[sprint-id]/[sprint-id]-retro.md`:

```markdown
## Skill evolution ([YYYY-MM-DD])

Friction signals: [N]
Proposals: [N]
Applied: [N]
Deferred: [N]
Rejected: [N]

### Applied
- UPDATE local-run — mandatory seed (commit [sha])
- NEW socket-debug — wire to /debug, /issue (TODO)

### Deferred
- ...

### Rejected
- ...
```

Also write a LES via brain-capture if the friction itself is interesting beyond the skill change.

---

## Output

```
skill-evolution: [sprint-id]
Friction signals: [N]   Proposals: [N]
Applied: [N]   Deferred: [N]   Rejected: [N]

Catalog now: [total skills count] skills
Wiring TODOs: [N] (logged in retro doc)

Next: /retro-sprint complete → /next-task or close sprint
```

---

## Anti-patterns

- ❌ Proposing a skill from a 1-off friction — wait for the pattern
- ❌ Skipping overlap check — leads to 3 skills doing the same thing
- ❌ "Just write all 5 proposals" — triage to ≤ 3 to keep quality high
- ❌ Wiring decisions made by the model alone — always confirm with user
- ❌ Updating skills silently between sprints — every change goes through this flow

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: full proposal + ask-choice per change.
- **Autopilot mode**: same — every proposal is an `ask-choice` (proposals are by definition decisions). Orchestrator batches up to 4 in one call.

## Output (autopilot status line — required)

`> skill-evolution: [N] proposals ([N] update, [N] new)  [⏳|✓|?]`

Example: `> skill-evolution: 2 proposals (1 update local-run, 1 new socket-debug)  ?`

---

## Why this exists

A static skill set decays. A skill set that grows on every retro keeps pace with what the project actually does. The overlap detector + ≤ 3 proposals/sprint cap keeps the catalog from becoming the next thing nobody understands.
