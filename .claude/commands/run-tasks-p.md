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

4. Set `MAX_PARALLEL=4`. If total tasks > 8, set `MAX_PARALLEL=3`. Use `xargs -P $MAX_PARALLEL` or a semaphore loop — never launch all subprocesses at once.

5. Build shared context files (parent session — read once, reuse everywhere):

   **Sprint Snapshot** — write to file to avoid shell escaping issues:
   ```bash
   SNAPSHOT_FILE=".claude/rtp/$RUN_ID/sprint-snapshot.md"
   OVERVIEW="docs/sprints/[sprint-id]/[sprint-id]-overview.md"
   DISCOVERY=$(ls docs/discovery/*.md 2>/dev/null | tail -1)
   > "$SNAPSHOT_FILE"
   [ -f "$OVERVIEW" ]  && cat "$OVERVIEW" >> "$SNAPSHOT_FILE" && echo "" >> "$SNAPSHOT_FILE"
   [ -n "$DISCOVERY" ] && cat "$DISCOVERY" >> "$SNAPSHOT_FILE" && echo "" >> "$SNAPSHOT_FILE"
   grep -E "$(echo $TASK_IDS | tr ' ' '|')" docs/BACKLOG.md >> "$SNAPSHOT_FILE" 2>/dev/null || true
   ```

   **Codebase Manifest** — write to file once, inject into implementation agents:
   ```bash
   MANIFEST_FILE=".claude/rtp/$RUN_ID/codebase-manifest.md"
   > "$MANIFEST_FILE"
   echo "## Directory Tree" >> "$MANIFEST_FILE"
   ls -la src/ app/ pkg/ 2>/dev/null | head -60 >> "$MANIFEST_FILE"
   echo "## Package Config" >> "$MANIFEST_FILE"
   for f in package.json go.mod pyproject.toml Cargo.toml; do
     [ -f "$f" ] && echo "=== $f ===" >> "$MANIFEST_FILE" && cat "$f" >> "$MANIFEST_FILE"
   done
   echo "## Shared Types" >> "$MANIFEST_FILE"
   find src/ -name "types.*" -o -name "*.d.ts" -o -name "interfaces.*" 2>/dev/null | head -5 | xargs cat 2>/dev/null >> "$MANIFEST_FILE" || true
   echo "## DB Schema" >> "$MANIFEST_FILE"
   find . -name "schema.*" -not -path "*/node_modules/*" 2>/dev/null | head -1 | xargs cat 2>/dev/null >> "$MANIFEST_FILE" || true
   echo "## Test Config" >> "$MANIFEST_FILE"
   for f in jest.config.js jest.config.ts vitest.config.ts pytest.ini; do
     [ -f "$f" ] && cat "$f" >> "$MANIFEST_FILE"
   done
   ```

   **Scrum Hierarchy** — write to file once, inject into every subprocess prompt:
   ```bash
   HIERARCHY_FILE=".claude/rtp/$RUN_ID/scrum-hierarchy.md"
   cat > "$HIERARCHY_FILE" <<'EOF'
   --- SCRUM HIERARCHY ---
   Sprint (SP[N])               = Scrum Epic — business theme, not deployable alone
   Task (SP[N]-T[NNN])          = Scrum Story — vertical slice (FE+BE+data), user-facing, deployable
   Scope Overview bullet        = feature-area summary inside the story (not a story)
   Implementation Plan row      = Scrum engineering task — layer-level work, NOT user-facing
   Implementation Plan checkbox = Scrum Subtask — atomic 2–5 min action
   You are working on a Story. Never expand scope beyond the ACs. Never treat Implementation Plan rows as stories.
   ---
   EOF
   ```

   **Section extractor** — helper function to reduce injection size. Handles both `# ` and `## ` headings and stops at any same-or-higher-level heading:
   ```bash
   # extract_section FILE "Section Name" — returns section content or full file if small
   # Section name may match a level-1 (# Foo) or level-2 (## Foo) heading; the
   # extractor records the level of the matched heading and stops at the next
   # heading of equal or shallower depth.
   extract_section() {
     local FILE=$1
     local SECTION=$2
     local CONTENT
     CONTENT=$(cat "$FILE" 2>/dev/null) || { echo "(file not found: $FILE)"; return; }
     local CHAR_COUNT=${#CONTENT}
     if [ "$CHAR_COUNT" -le 6000 ]; then
       echo "$CONTENT"
     else
       awk -v sec="$SECTION" '
         !found && match($0, "^(#+) " sec, m) { found=1; lvl=length(m[1]); print; next }
         found && match($0, "^(#+) ", m) {
           if (length(m[1]) <= lvl) exit
         }
         found { print }
       ' "$FILE"
     fi
   }
   ```

   Inject sprint snapshot via `$(cat $SNAPSHOT_FILE)` and manifest via `$(cat $MANIFEST_FILE)` — never use shell variables for large content.

Print plan:
```
run-id : [run-id]
Tasks  : [N] | Tier 1 (parallel): T001, T002 | Tier 2: T003 (depends: T001)
Logs   : .claude/rtp/[run-id]/
Phase 1 — Plan     : requirement (unified: story + FE design + BE design + Implementation Plan) → ⏸ review gate
Phase 2 — Implement: implement → code-review → testing → retro-task
```

---

# ━━━ PHASE 1: PLAN ━━━━━━━━━━━━━━━━━━━━━━━

## Step 2 — Requirement (parallel per tier)

Build one prompt per task, launch all Tier 1 in parallel:

```bash
run_requirement() {
  local TASK_ID=$1
  PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=[sprint-id]
RUN_DIR=.claude/rtp/$RUN_ID
HEADLESS=true

$(cat $HIERARCHY_FILE)

--- SPRINT CONTEXT ---
$(cat $SNAPSHOT_FILE)
---

$(cat .claude/commands/requirement.md)

--- HEADLESS RULES ---
HARD-GATEs suspended: auto-save after self-check passes.
On success: write DONE to .claude/rtp/$RUN_ID/$TASK_ID-req.status
On error: write BLOCKED: [reason] to that file."

  claude -p "$PROMPT" > .claude/rtp/$RUN_ID/$TASK_ID-req.log 2>&1
}

# Launch in batches of MAX_PARALLEL
ACTIVE=0
for TASK_ID in [tier-1-tasks]; do
  run_requirement "$TASK_ID" &
  ACTIVE=$((ACTIVE+1))
  if [ $ACTIVE -ge $MAX_PARALLEL ]; then
    wait
    ACTIVE=0
  fi
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

## Step 2b — Cross-task alignment (unified)

(Parent session — not subprocess.)

**Guard:** if zero tasks have `DONE` status → print "All requirement tasks blocked — stopping." and exit.

Read all completed requirement docs (the unified doc contains story + FE design + BE design + Implementation Plan). Write `.claude/rtp/[run-id]/cross-task-context.md` with:
- **Shared Terminology** — agreed names for shared entities/roles
- **Shared Components / Screens** — which task owns each
- **API Contracts** — every endpoint either FE consumes or BE exposes (method, path, request/response shape, errors). If two tasks touch the same endpoint, note the owner.
- **Shared Data Models** — entity field names agreed across tasks
- **Auth Requirements** — which endpoints require auth and what roles
- **Scope Boundaries** — explicit lines between tasks to prevent overlap
- **Conflicts resolved** — any contradictions found and their resolution

If tasks are fully independent, write that and proceed. If two tasks define conflicting shapes for the same endpoint → resolve now by editing the relevant requirement doc(s).

---

## Step 2c — Final Cross-Plan Consistency Check

(Parent session.)

Read all completed requirement docs + `cross-task-context.md`. Check:

| Check | Pass condition |
|-------|----------------|
| **API contract match (intra-task)** | Every FE `## API Contracts Consumed` row has a matching endpoint in the same doc's `## API Endpoints` (method, path, shape) |
| **API contract match (cross-task)** | Shared endpoints across tasks are defined by exactly one owner, matched by consumers |
| **No component duplication** | Each shared component owned by exactly one task |
| **No scope overlap** | No two tasks implement the same functionality |
| **No scope gap** | Every AC in every requirement is addressed in the doc's FE or BE design and Implementation Plan |
| **Naming consistency** | Same entity uses the same name across all docs |
| **Story point depth** | Each requirement doc contains the sections required for its point level (per /requirement Step 1 table) |

Print `✅` or `⚠️ CONFLICT — [detail] → Resolved: [action]`. Fix conflicts now. Re-check until all ✅.

---

## ⏸ Step 3 — PLAN REVIEW GATE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 COMPLETE — Review before implementing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ SP1-T001 — [User Story] ([N]pt, [fullstack/fe-only/be-only/infra])
    docs/sprints/SP1/SP1-T001/SP1-T001-requirement.md
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

## Step 4 — Implement (parallel per tier)

3-subprocess pipeline per task. For multi-task tiers, each pipeline runs as a group in background.

```bash
run_pipeline() {
  local TASK_ID=$1
  local SPRINT_ID=$2
  local RUN_ID=$3
  local RUN_DIR=".claude/rtp/$RUN_ID"
  local REQ_DOC="docs/sprints/$SPRINT_ID/$TASK_ID/$TASK_ID-requirement.md"
  local CROSS="$RUN_DIR/cross-task-context.md"

  # Extract only needed sections per agent type — all from the ONE unified requirement doc
  local REQ_AC=$(extract_section "$REQ_DOC" "Acceptance Criteria")
  local REQ_SCOPE=$(extract_section "$REQ_DOC" "Scope Overview")
  local REQ_IMPL=$(extract_section "$REQ_DOC" "Implementation Plan")
  local REQ_FE_DESIGN=$(extract_section "$REQ_DOC" "Frontend Design" || extract_section "$REQ_DOC" "3 · Frontend Design")
  local REQ_BE_DESIGN=$(extract_section "$REQ_DOC" "Backend Design" || extract_section "$REQ_DOC" "4 · Backend Design")
  local REQ_FE_CONTRACTS=$(extract_section "$REQ_DOC" "API Contracts Consumed")
  local REQ_BE_ENDPOINTS=$(extract_section "$REQ_DOC" "API Endpoints")
  local REQ_CONTENT=$(cat $REQ_DOC 2>/dev/null)   # kept for spec reviewer fix prompt (small)
  local CROSS_CONTENT=$(cat $CROSS 2>/dev/null)

  # --- Implementer ---
  PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=$SPRINT_ID
RUN_DIR=$RUN_DIR
HEADLESS=true

$(cat $HIERARCHY_FILE)

--- SPRINT CONTEXT ---
$(cat $SNAPSHOT_FILE)
---
--- CODEBASE MANIFEST ---
$(cat $MANIFEST_FILE 2>/dev/null)
---
--- REQUIREMENT DOC: ACCEPTANCE CRITERIA ---
$REQ_AC
---
--- REQUIREMENT DOC: FRONTEND DESIGN ---
$REQ_FE_DESIGN
---
--- REQUIREMENT DOC: BACKEND DESIGN ---
$REQ_BE_DESIGN
---
--- REQUIREMENT DOC: SCOPE OVERVIEW ---
$REQ_SCOPE
---
--- REQUIREMENT DOC: IMPLEMENTATION PLAN ---
$REQ_IMPL
---
--- CROSS-TASK CONTEXT ---
$CROSS_CONTENT
---
$(cat .claude/commands/implement.md)

--- HEADLESS RULES ---
All context pre-loaded above — do NOT read the requirement doc again or explore codebase independently.
HARD-GATEs suspended: run tests, verify all ACs, then save directly.
Reuse shared components in cross-task context — no duplicate implementations.
On success: write DONE to $RUN_DIR/$TASK_ID-impl.status
On error: write BLOCKED: [reason] to that file."

  claude -p "$PROMPT" > $RUN_DIR/$TASK_ID-impl.log 2>&1
  STATUS=$(cat $RUN_DIR/$TASK_ID-impl.status 2>/dev/null)
  if [[ "$STATUS" != "DONE" ]]; then
    echo "BLOCKED: impl failed — see $RUN_DIR/$TASK_ID-impl.log" > $RUN_DIR/$TASK_ID-pipeline.status
    return
  fi

  # --- Spec Reviewer ---
  PROMPT="TASK_ID=$TASK_ID
SPRINT_ID=$SPRINT_ID
RUN_DIR=$RUN_DIR
HEADLESS=true

$(cat $HIERARCHY_FILE)

You are the Spec Reviewer for $TASK_ID. Review all git changes against the ACs and API contracts below.

Check:
- Every AC has working code? No AC silently skipped?
- API contracts matched exactly (method, path, request/response shape)?
- No extra features added beyond ACs?

--- REQUIREMENT DOC: ACCEPTANCE CRITERIA ---
$REQ_AC

--- REQUIREMENT DOC: FE API CONTRACTS CONSUMED ---
$REQ_FE_CONTRACTS

--- REQUIREMENT DOC: BE API ENDPOINTS ---
$REQ_BE_ENDPOINTS

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

$(cat $HIERARCHY_FILE)

--- REQUIREMENT: ACCEPTANCE CRITERIA ---
$REQ_AC
---
$(cat .claude/commands/testing.md)

You are the Quality Reviewer for $TASK_ID. Review all changes for performance, security, code quality, and edge cases.

--- HEADLESS RULES ---
All context pre-loaded above — do NOT read doc files independently.
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

## Step 5 — Retro Task (parallel per tier)

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

## Step 6 — Final summary

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

> **Note:** `.claude/rtp/[run-id]/` contains runtime state — `cross-task-context.md`, `sprint-snapshot.md`, `codebase-manifest.md`, and all status/log files. None are committed artifacts. If you need cross-task-context after cleanup, copy it to `docs/sprints/[sprint-id]/` first.
