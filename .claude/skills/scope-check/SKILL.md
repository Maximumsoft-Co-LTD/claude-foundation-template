---
name: scope-check
description: Restate task scope before any work — block until user confirms understanding, ACs, boundary cases, and time estimate
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Bash(ls:*)
---

# scope-check

**Workflow position: invoked from ANY workflow command that receives freeform user input — BLOCK until user confirms. Triggered at the start of `/discovery`, `/requirement`, `/implement`, `/issue`, `/debug`, and any direct freeform code request.**

Stops you from writing code on a guessed understanding. Forces a "I think you mean X — confirm?" round-trip when the task isn't crystal clear.

Arguments: `[task-id]` or freeform task description

---

## When to invoke

Trigger any of:
- User says "do X" but X has more than one reasonable interpretation
- Task touches > 1 layer (FE + BE, BE + DB, etc.)
- Acceptance criteria not written down anywhere
- Estimate feels uncertain (you can't say a number in seconds)

Skip when:
- User gave exact file:line + exact change
- Single-line edit with obvious intent (typo fix, rename of a clearly-scoped symbol)

Companion skills (responsibility split):
- **`prompt-understand`** — parse only; reads the prompt and fills a 5-field frame; never blocks, never writes docs.
- **`scope-check`** — commits to ACs + boundaries + estimate; BLOCKS until user confirms. Always run `prompt-understand` first; run `scope-check` only when ready to commit to the contract.

---

## Step 1 — Load context

Read in this order, stop when you have enough:

1. `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` (if task-id given)
2. The exact files the task names
3. `git diff main...HEAD` (what's already in flight on this branch)

Hard stop: do NOT read more than 5 files at this stage. If still unclear, that's evidence the requirement is the problem, not your reading.

---

## Step 2 — Restate (this is the contract)

Output this block verbatim — fill in every slot. No `TBD`. No `should probably`.

```
## Scope check — [task-id or short label]

**I understand the task as:**
[one paragraph, your interpretation in plain language]

**Acceptance Criteria (what "done" looks like):**
- AC1: [observable behavior, not implementation]
- AC2: ...
- AC3: ...

**Boundary cases I will test:**
- [exact-equals threshold, empty input, max-length, unicode, concurrent, ...]

**Out of scope (I will NOT do):**
- [thing user might assume but I'm excluding]
- [thing that looks related but isn't]

**Files I expect to touch:**
- [path/to/file.go]  — [what changes]
- [path/to/component.vue] — [what changes]

**Stack assumptions:**
- Backend: [Go / Python] — [framework if relevant]
- Frontend: [Vue3+Nuxt / Next] — [pages or components]
- Data: [MongoDB collection / Socket event name]

**Time estimate: [N] minutes**

**Confidence: [X]%**

Confirm to proceed, or correct me.
```

---

## Step 3 — Confidence gate

Confidence ≥ 90%? Yes → proceed to Step 4 (block and send). No → re-scope the unclear items or escalate via `ask-choice` before sending.

---

## Step 4 — Block

Post Step 2's output. **Stop. Wait.**

Do NOT start coding. Do NOT read more files. Do NOT "begin while waiting."

Resume only on explicit `confirm` / `yes` / `proceed` / corrections from user.

---

## Step 5 — Apply corrections

If user corrects:
1. Update the Restate block with their words (don't paraphrase)
2. Re-post the corrected block
3. Wait again

Loop until user says proceed.

---

## Step 6 — Persist (if task-id given)

After confirmation, append to `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`:

```markdown
## Scope-Check (confirmed [YYYY-MM-DD])
[paste the confirmed Restate block]
```

This becomes the source of truth for `/implement` and `/code-review`.

---

## Output (manual mode)

```
Scope locked: [task-id or label]
ACs: [N]  |  Boundaries: [N]  |  Estimate: [N] min  |  Confidence: [X]%
```

Then end with the standard 2-option completion message per `.claude/rules/completion-format.md`:

```
Next: choose one
A) Request changes — describe what to revise
B) Continue to /implement [task-id] (or vertical-slice if estimate > 90 min)
```

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode** (default): BLOCK as documented in steps above; wait for user confirmation.
- **Autopilot mode** (`AUTOPILOT=1`, set by `/dev`): emit canonical status line and return. Block ONLY on the 3 official conditions (ambiguity / destructive op / ui-verify fail). This skill flags `?` when confidence < 90% — orchestrator batches into `ask-choice`.

### Output (autopilot status line — required)

`> scope-check: [N] ACs, [N] boundaries, ~[N]min, conf [X]%  [✓|?]`

Examples:
- `> scope-check: 5 ACs, 3 boundaries, ~6h, conf 95%  ✓`
- `> scope-check: 4 ACs, ambig on AC3 (auth scope)  ?`

---

## Why this exists

Previous pain: "ตอนวางแผนต้องคอยเช็คว่าเข้าใจถูกไหม" — during planning, had to keep checking whether the understanding was correct. This skill makes the check **mandatory and structured**, not ad-hoc. One round-trip up-front beats three rounds of "no, I meant..." after code is written.
