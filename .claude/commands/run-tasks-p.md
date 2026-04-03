# /run-tasks-p
Headless variant of `/run-tasks` — spawns `claude -p` subprocesses via Bash instead of Agent tool.
**Token savings:** subprocess outputs go to log files; parent context stays lean.

Arguments: `[task-id] [task-id] ...`  — e.g. `SP1-T001 SP1-T002 SP1-T003`

---

## Status tracking

All state in `.claude/rtp/[run-id]/`:
- `[task-id]-[phase].status` — `DONE` or `BLOCKED: [reason]`
- `[task-id]-[phase].log` — full subprocess output (for debugging)
- `cross-task-context.md` — cross-task alignment doc (written by parent)

`[run-id]` = timestamp generated at start. `.claude/rtp/` must be gitignored.

---

## Subprocess prompt pattern

Every `claude -p` call wraps the relevant command file with:

```
TASK_ID=[task-id]
SPRINT_ID=[sprint-id]
RUN_DIR=.claude/rtp/[run-id]
HEADLESS=true

[full content of the relevant .claude/commands/*.md]

--- HEADLESS RULES (override any conflicting instruction above) ---
- HARD-GATEs are suspended: after self-check passes, save the file directly — no user confirmation.
- Do NOT print the full doc to stdout.
- On success: write "DONE" to $RUN_DIR/[task-id]-[phase].status and stop.
- On any block/error: write "BLOCKED: [reason]" to that file and stop.
```

Build the prompt inline:

```bash
PROMPT="TASK_ID=[task-id]
SPRINT_ID=[sprint-id]
RUN_DIR=.claude/rtp/[run-id]
HEADLESS=true

$(cat .claude/commands/[command-file].md)

--- HEADLESS RULES ---
HARD-GATEs suspended: auto-save after self-check passes.
On success: write DONE to .claude/rtp/[run-id]/[task-id]-[phase].status
On error: write BLOCKED: [reason] to that file."

claude -p "$PROMPT" > .claude/rtp/[run-id]/[task-id]-[phase].log 2>&1
```

Read status after completion:
```bash
STATUS=$(cat .claude/rtp/[run-id]/[task-id]-[phase].status 2>/dev/null || echo "BLOCKED: status file missing")
```

---

## Step 1 — Parse, validate, register

1. Generate run-id and init status dir:
   ```bash
   RUN_ID=$(date +%Y%m%d-%H%M)
   mkdir -p .claude/rtp/$RUN_ID
   grep -q "\.claude/rtp" .gitignore || echo ".claude/rtp/" >> .gitignore
   ```

2. Read `docs/BACKLOG.md` — collect status, `depends_on`, priority per task. Skip tasks already `done` or `in-progress` (warn).

3. Build tiers: tasks with no unmet `depends_on` = Tier 1; tasks depending on Tier 1 = Tier 2; etc.

Print plan:
```
run-id : [run-id]
Tasks  : [N] | Tier 1 (parallel): T001, T002 | Tier 2: T003 (depends: T001)
Logs   : .claude/rtp/[run-id]/
Phase 1 — Plan     : requirement → design fe → design be → ⏸ review gate
Phase 2 — Implement: implement → code-review → testing → retro-task
```

---

# ━━━ PHASE 1: PLAN ━━━━━━━━━━━━━━━━━━━━━━━

## Step 2 — Requirement (parallel per tier)

Build one prompt per task, launch all Tier 1 in parallel:

```bash
for TASK_ID in [tier-1-tasks]; do
  PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=[sprint-id]
RUN_DIR=.claude/rtp/$RUN_ID
HEADLESS=true

$(cat .claude/commands/requirement.md)

--- HEADLESS RULES ---
HARD-GATEs suspended: auto-save after self-check passes.
On success: write DONE to .claude/rtp/$RUN_ID/$TASK_ID-req.status
On error: write BLOCKED: [reason] to that file."

  claude -p "$PROMPT" > .claude/rtp/$RUN_ID/$TASK_ID-req.log 2>&1 &
done
wait
```

Read all status files. Print checkpoint:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Requirement — complete
  ✓ SP1-T001 — [User Story]
  ✓ SP1-T002 — [User Story]
  ✗ SP1-T003 — BLOCKED: [reason]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Tasks with `BLOCKED` status are dropped from all remaining phases. Update `docs/BACKLOG.md` accordingly.

---

## Step 2b — Alignment: After Requirement

(Parent session — not subprocess.)

**Guard:** if zero tasks have `DONE` status → print "All requirement tasks blocked — stopping." and exit.

Read all completed requirement docs. Write `.claude/rtp/[run-id]/cross-task-context.md` with:
- **Shared Terminology** — agreed names for shared entities/roles
- **Shared Components / Screens** — which task owns each
- **Scope Boundaries** — explicit lines between tasks to prevent overlap
- **Conflicts resolved** — any contradictions found and their resolution

If tasks are fully independent, write that and proceed.

---

## Step 3 — FE Design (parallel per tier)

Each prompt includes `cross-task-context.md` content injected inline after the command file:

```bash
CROSS=$(cat .claude/rtp/$RUN_ID/cross-task-context.md)

for TASK_ID in [active-tier-1-tasks]; do
  PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=[sprint-id]
RUN_DIR=.claude/rtp/$RUN_ID
HEADLESS=true

$(cat .claude/commands/design.md)

--- CROSS-TASK CONTEXT ---
$CROSS

--- HEADLESS RULES ---
Run design for: fe $TASK_ID
Read cross-task context above before writing — use exact names for any shared component.
HARD-GATEs suspended: auto-save after self-check passes.
On success: write DONE to .claude/rtp/$RUN_ID/$TASK_ID-fe.status
On error: write BLOCKED: [reason] to that file."

  claude -p "$PROMPT" > .claude/rtp/$RUN_ID/$TASK_ID-fe.log 2>&1 &
done
wait
```

Print checkpoint.

---

## Step 3b — Alignment: After FE Design

(Parent session.)

Read all completed FE design docs. Update `cross-task-context.md` with:
- **API Contracts** — every endpoint FE expects (method, path, request/response shape, errors)
- **Shared Data Models** — entity field names as FE defined (BE must match exactly)
- **Auth Requirements** — which endpoints require auth and what roles

Resolve any conflicts between tasks before proceeding.

---

## Step 4 — BE Design (parallel per tier)

Same pattern as Step 3 with `design.md` and `be $TASK_ID`. Inject updated `cross-task-context.md`.

Print checkpoint.

---

## Step 4b — Final Cross-Plan Consistency Check

(Parent session.)

Read all completed docs + `cross-task-context.md`. Check:

| Check | Pass condition |
|-------|---------------|
| **API contract match** | Every FE-called endpoint exists in BE with matching method, path, shape |
| **No component duplication** | Each shared component owned by exactly one task |
| **No scope overlap** | No two tasks implement the same functionality |
| **No scope gap** | Every AC in every requirement is addressed by FE or BE design |
| **Naming consistency** | Same entity uses the same name across all docs |

Print `✅` or `⚠️ CONFLICT — [detail] → Resolved: [action]`. Fix conflicts now. Re-check until all ✅.

---

## ⏸ Step 5 — PLAN REVIEW GATE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 COMPLETE — Review before implementing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ SP1-T001 — [User Story] ([N]pt)
    docs/sprints/SP1/SP1-T001/{requirement,frontend,backend}.md
✓ SP1-T002 — [User Story] ([N]pt)  ...
✗ SP1-T003 — BLOCKED at [phase]: [reason]

Cross-task alignment : .claude/rtp/[run-id]/cross-task-context.md
Consistency check    : all clear / [N] conflicts resolved

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reply:
  "go"                           → implement all tasks
  "edit [task-id] [instruction]" → revise a plan, then re-show gate
  "skip [task-id]"               → drop from Phase 2, mark blocked
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Do not start Phase 2 until user says "go".**

---

# ━━━ PHASE 2: IMPLEMENT ━━━━━━━━━━━━━━━━━━

## Step 6 — Implement (parallel per tier)

3-subprocess pipeline per task. For multi-task tiers, each pipeline runs as a group in background.

```bash
run_pipeline() {
  local TASK_ID=$1
  local SPRINT_ID=$2
  local RUN_ID=$3
  local RUN_DIR=".claude/rtp/$RUN_ID"
  local REQ_DOC="docs/sprints/$SPRINT_ID/$TASK_ID/$TASK_ID-requirement.md"
  local FE_DOC="docs/sprints/$SPRINT_ID/$TASK_ID/$TASK_ID-frontend.md"
  local BE_DOC="docs/sprints/$SPRINT_ID/$TASK_ID/$TASK_ID-backend.md"
  local CROSS="$RUN_DIR/cross-task-context.md"

  # --- Implementer ---
  PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=$SPRINT_ID
RUN_DIR=$RUN_DIR
HEADLESS=true

$(cat .claude/commands/implement.md)

--- CROSS-TASK CONTEXT ---
$(cat $CROSS 2>/dev/null)

--- HEADLESS RULES ---
HARD-GATEs suspended: run tests, verify all ACs, then save directly.
Reuse shared components listed in cross-task context — no duplicate implementations.
On success: write DONE to $RUN_DIR/$TASK_ID-impl.status
On error: write BLOCKED: [reason] to that file."

  claude -p "$PROMPT" > $RUN_DIR/$TASK_ID-impl.log 2>&1
  STATUS=$(cat $RUN_DIR/$TASK_ID-impl.status 2>/dev/null)
  if [[ "$STATUS" != "DONE" ]]; then
    echo "BLOCKED: impl failed — see $RUN_DIR/$TASK_ID-impl.log" > $RUN_DIR/$TASK_ID-pipeline.status
    return
  fi

  # --- Spec Reviewer ---
  REQ_CONTENT=$(cat $REQ_DOC 2>/dev/null)
  FE_CONTENT=$(cat $FE_DOC 2>/dev/null)
  BE_CONTENT=$(cat $BE_DOC 2>/dev/null)

  PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=$SPRINT_ID
RUN_DIR=$RUN_DIR
HEADLESS=true

You are the Spec Reviewer for $TASK_ID. Review all git changes against the requirement and design docs below.

Check:
- Every AC has working code that satisfies it? No AC silently skipped?
- Implementation matches design docs (correct endpoints, components, data models)?
- API contracts match exactly (method, path, request/response shape)?
- No extra features added beyond ACs?

--- REQUIREMENT DOC ---
$REQ_CONTENT

--- FE DESIGN DOC ---
$FE_CONTENT

--- BE DESIGN DOC ---
$BE_CONTENT

Write PASS or FAIL: [list specific gaps] to $RUN_DIR/$TASK_ID-spec.status and stop."

  claude -p "$PROMPT" > $RUN_DIR/$TASK_ID-spec.log 2>&1
  SPEC=$(cat $RUN_DIR/$TASK_ID-spec.status 2>/dev/null)

  if [[ "$SPEC" == FAIL* ]]; then
    GAPS="${SPEC#FAIL: }"
    PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=$SPRINT_ID
RUN_DIR=$RUN_DIR
HEADLESS=true

Fix these spec gaps for $TASK_ID: $GAPS

--- REQUIREMENT DOC ---
$REQ_CONTENT

--- HEADLESS RULES ---
Fix only the listed gaps. Run tests after each fix. Verify all ACs pass.
On success: write DONE to $RUN_DIR/$TASK_ID-impl-fix.status
On error: write BLOCKED: [reason] to that file."

    claude -p "$PROMPT" > $RUN_DIR/$TASK_ID-impl-fix.log 2>&1
  fi

  # --- Quality Reviewer ---
  PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=$SPRINT_ID
RUN_DIR=$RUN_DIR
HEADLESS=true

$(cat .claude/commands/testing.md)

You are the Quality Reviewer for $TASK_ID. Review all changes for performance, security, code quality, and edge cases.

--- REQUIREMENT DOC ---
$REQ_CONTENT

--- HEADLESS RULES ---
Check: N+1 queries, XSS/injection, no console.log/debugger left in, error handling, null/boundary values.
Write APPROVED or REQUEST_CHANGES: [issues by severity — Critical/Minor] to $RUN_DIR/$TASK_ID-quality.status and stop."

  claude -p "$PROMPT" > $RUN_DIR/$TASK_ID-quality.log 2>&1
  QUALITY=$(cat $RUN_DIR/$TASK_ID-quality.status 2>/dev/null)

  if [[ "$QUALITY" == REQUEST_CHANGES* ]]; then
    CRITICAL=$(echo "$QUALITY" | grep -i "Critical:")
    if [[ -n "$CRITICAL" ]]; then
      PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=$SPRINT_ID
RUN_DIR=$RUN_DIR
HEADLESS=true

Fix these critical issues for $TASK_ID: $CRITICAL

--- HEADLESS RULES ---
Fix only critical issues listed above. Run full test suite after fixes.
On success: write DONE to $RUN_DIR/$TASK_ID-impl-fix2.status
On error: write BLOCKED: [reason] to that file."

      claude -p "$PROMPT" > $RUN_DIR/$TASK_ID-impl-fix2.log 2>&1
    fi
  fi

  echo "DONE" > $RUN_DIR/$TASK_ID-pipeline.status
}

# Tier 1 — launch all pipelines in parallel
for TASK_ID in [active-tier-1-tasks]; do
  run_pipeline "$TASK_ID" "[sprint-id]" "$RUN_ID" &
done
wait

# Tier 2 — launch after Tier 1 completes (repeat pattern per tier)
for TASK_ID in [active-tier-2-tasks]; do
  run_pipeline "$TASK_ID" "[sprint-id]" "$RUN_ID" &
done
wait
# (add more tiers if needed)
```

**Post-implement check (parent session):** after all tiers complete, run the full test suite once:
```bash
# e.g. npm test / go test ./... / pytest
# Must exit 0 before proceeding to retro
```
If suite fails → log failures, run `/issue [task-id] [description]` per failure before retro.

Print checkpoint after all pipelines + test suite complete.

---

## Step 7 — Retro Task (parallel per tier)

```bash
for TASK_ID in [completed-tasks]; do
  PROMPT="TASK_ID=$TASK_ID
$(cat .claude/commands/retro-task.md)
--- HEADLESS RULES ---
Save retro doc. Update BACKLOG.md to done.
Write DONE to .claude/rtp/$RUN_ID/$TASK_ID-retro.status"

  claude -p "$PROMPT" > .claude/rtp/$RUN_ID/$TASK_ID-retro.log 2>&1 &
done
wait
```

---

## Step 8 — Final summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/run-tasks-p complete  [run-id]
  ✓ SP1-T001 — done
  ✓ SP1-T002 — done
  ~ SP1-T003 — done (1 issue filed)
  ✗ SP1-T004 — blocked at [phase]: [reason]

Logs : .claude/rtp/[run-id]/
Next : /git-commit per task → /retro-sprint [sprint-id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask: `Clean up .claude/rtp/[run-id]/? All subprocess logs will be permanently deleted. (y/N)` — if yes: `rm -rf .claude/rtp/[run-id]`

> **Note:** `cross-task-context.md` lives in `.claude/rtp/[run-id]/` (not `docs/sprints/`) — it's runtime state, not a committed artifact. If you need it after cleanup, copy it to `docs/sprints/[sprint-id]/` first.
