#!/bin/bash
# run-tasks-parallel.sh — Run multiple tasks in parallel with dependency ordering
# Usage: ./scripts/run-tasks-parallel.sh SP1-T001 SP1-T002 SP1-T003

TASK_IDS=("$@")
BACKLOG="docs/BACKLOG.md"

if [ ${#TASK_IDS[@]} -eq 0 ]; then
  echo "Usage: ./scripts/run-tasks-parallel.sh [task-id] [task-id] ..."
  echo "  e.g. ./scripts/run-tasks-parallel.sh SP1-T001 SP1-T002"
  exit 1
fi

LOGS_DIR="logs"
mkdir -p "$LOGS_DIR"

# ── Colors ────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# ── Dependency helpers ─────────────────────────────────────

# Get depends_on value for a task from BACKLOG.md
# Returns comma-separated task IDs, or empty string if none
get_depends_on() {
  local TASK_ID=$1
  local DEP
  DEP=$(grep "^| ${TASK_ID} " "$BACKLOG" 2>/dev/null \
    | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $4); print $4}')
  if [[ "$DEP" == "-" || "$DEP" == "—" || -z "$DEP" ]]; then
    echo ""
  else
    echo "$DEP"
  fi
}

# Check if a task ID is in the input list
in_task_list() {
  local TARGET=$1
  for T in "${TASK_IDS[@]}"; do
    [[ "$T" == "$TARGET" ]] && return 0
  done
  return 1
}

# Assign tiers via iterative relaxation (handles chains like T1→T2→T3)
# Prints "<tier> <task-id>" lines
build_tiers() {
  declare -A tier

  # Initialise all tasks to tier 1
  for T in "${TASK_IDS[@]}"; do
    tier[$T]=1
  done

  # Relax up to N times (handles dependency chains up to N deep)
  local MAX_PASS=${#TASK_IDS[@]}
  for (( pass=0; pass<MAX_PASS; pass++ )); do
    for T in "${TASK_IDS[@]}"; do
      local RAW_DEPS
      RAW_DEPS=$(get_depends_on "$T")
      [[ -z "$RAW_DEPS" ]] && continue

      # Split comma-separated deps
      IFS=',' read -ra DEP_LIST <<< "$RAW_DEPS"
      for DEP in "${DEP_LIST[@]}"; do
        DEP=$(echo "$DEP" | tr -d ' ')
        [[ -z "$DEP" ]] && continue

        # Only consider deps that are also in our run list
        if in_task_list "$DEP"; then
          local DEP_TIER=${tier[$DEP]:-1}
          local NEEDED=$(( DEP_TIER + 1 ))
          if (( NEEDED > tier[$T] )); then
            tier[$T]=$NEEDED
          fi
        fi
      done
    done
  done

  # Output sorted tier assignments
  for T in "${TASK_IDS[@]}"; do
    echo "${tier[$T]} $T"
  done
}

# ── Status/log helpers ─────────────────────────────────────

format_elapsed() {
  local START=$1
  local NOW=$(date +%s)
  local ELAPSED=$((NOW - START))
  printf "%d:%02d" $((ELAPSED / 60)) $((ELAPSED % 60))
}

read_status_field() {
  local FILE=$1
  local FIELD=$2
  grep "^${FIELD}=" "$FILE" 2>/dev/null | cut -d= -f2
}

last_log_line() {
  local FILE=$1
  local LINE
  LINE=$(grep -v '^$' "$FILE" 2>/dev/null | tail -1 | sed 's/\x1b\[[0-9;]*m//g' | cut -c1-60)
  echo "$LINE"
}

# ── Monitor ───────────────────────────────────────────────

draw_monitor() {
  local TASKS=("$@")

  printf "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  printf "${BOLD}  %-14s %-18s %-11s %s${NC}\n" "TASK" "PHASE" "STATUS" "ELAPSED"
  printf "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

  for TASK_ID in "${TASKS[@]}"; do
    local STATUS_FILE="$LOGS_DIR/${TASK_ID}.status"
    local LOG_FILE="$LOGS_DIR/${TASK_ID}.log"

    if [[ ! -f "$STATUS_FILE" ]]; then
      printf "  \033[2K${DIM}%-14s %-18s %-11s %s${NC}\n" \
        "$TASK_ID" "-" "waiting" "-"
      printf "  \033[2K${DIM}  └─ not started${NC}\n"
      continue
    fi

    local STEP PHASE STATUS START ELAPSED LAST_LINE
    STEP=$(read_status_field "$STATUS_FILE" STEP)
    PHASE=$(read_status_field "$STATUS_FILE" PHASE)
    STATUS=$(read_status_field "$STATUS_FILE" STATUS)
    START=$(read_status_field "$STATUS_FILE" START)
    ELAPSED=$(format_elapsed "$START")
    LAST_LINE=$(last_log_line "$LOG_FILE")

    case $STATUS in
      running)
        printf "  \033[2K${CYAN}%-14s${NC} ${YELLOW}%-18s${NC} ${YELLOW}%-11s${NC} %s\n" \
          "$TASK_ID" "[$STEP] $PHASE" "running…" "$ELAPSED"
        printf "  \033[2K  ${DIM}└─ %s${NC}\n" "${LAST_LINE:-(waiting for output...)}"
        ;;
      done)
        printf "  \033[2K${GREEN}%-14s${NC} ${GREEN}%-18s${NC} ${GREEN}%-11s${NC} %s\n" \
          "$TASK_ID" "complete" "✓ done" "$ELAPSED"
        printf "  \033[2K  ${DIM}└─ all phases passed${NC}\n"
        ;;
      failed)
        printf "  \033[2K${RED}%-14s${NC} ${RED}%-18s${NC} ${RED}%-11s${NC} %s\n" \
          "$TASK_ID" "[$STEP] $PHASE" "✗ failed" "$ELAPSED"
        printf "  \033[2K  ${DIM}└─ see logs/${TASK_ID}.log${NC}\n"
        ;;
    esac
  done

  printf "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  printf "  ${DIM}Ctrl+C to stop all  •  tail -f logs/[task-id].log to inspect${NC}\n"
}

all_finished() {
  local TASKS=("$@")
  for TASK_ID in "${TASKS[@]}"; do
    local STATUS_FILE="$LOGS_DIR/${TASK_ID}.status"
    local STATUS
    STATUS=$(read_status_field "$STATUS_FILE" STATUS)
    if [[ "$STATUS" != "done" && "$STATUS" != "failed" ]]; then
      return 1
    fi
  done
  return 0
}

any_failed() {
  local TASKS=("$@")
  for TASK_ID in "${TASKS[@]}"; do
    local STATUS
    STATUS=$(read_status_field "$LOGS_DIR/${TASK_ID}.status" STATUS)
    [[ "$STATUS" == "failed" ]] && return 0
  done
  return 1
}

# ── Stop handler ──────────────────────────────────────────

PIDS=()

stop_all() {
  echo ""
  printf "${YELLOW}${BOLD}Stopping all tasks…${NC}\n"

  for i in "${!TASK_IDS[@]}"; do
    local TASK_ID="${TASK_IDS[$i]}"
    local PID="${PIDS[$i]:-}"
    local STATUS
    STATUS=$(read_status_field "$LOGS_DIR/${TASK_ID}.status" STATUS 2>/dev/null)

    if [[ "$STATUS" == "done" || "$STATUS" == "failed" ]]; then
      printf "  ${DIM}%-14s already finished — skipped${NC}\n" "$TASK_ID"
      continue
    fi

    [[ -n "$PID" ]] && pkill -P "$PID" 2>/dev/null; kill "$PID" 2>/dev/null

    local STEP PHASE START
    STEP=$(read_status_field "$LOGS_DIR/${TASK_ID}.status" STEP)
    PHASE=$(read_status_field "$LOGS_DIR/${TASK_ID}.status" PHASE)
    START=$(read_status_field "$LOGS_DIR/${TASK_ID}.status" START)
    printf "STEP=%s\nPHASE=%s\nSTATUS=stopped\nSTART=%s\nUPDATED=%s\n" \
      "$STEP" "$PHASE" "$START" "$(date +%s)" > "$LOGS_DIR/${TASK_ID}.status"

    printf "  ${RED}%-14s stopped at [%s] %s${NC}\n" "$TASK_ID" "$STEP" "$PHASE"
  done

  tput cnorm
  echo ""
  printf "${DIM}Logs preserved in: $LOGS_DIR/${NC}\n"
  exit 1
}

trap 'stop_all' INT TERM

# ── Build tier plan ────────────────────────────────────────

echo ""
printf "${BOLD}Building dependency tiers…${NC}\n"

# Collect tier assignments: "<tier> <task-id>"
TIER_LINES=$(build_tiers)

# Find max tier
MAX_TIER=0
while IFS=' ' read -r TIER _TASK; do
  (( TIER > MAX_TIER )) && MAX_TIER=$TIER
done <<< "$TIER_LINES"

# Print plan
for (( T=1; T<=MAX_TIER; T++ )); do
  TIER_TASKS=()
  while IFS=' ' read -r TIER TASK; do
    [[ "$TIER" == "$T" ]] && TIER_TASKS+=("$TASK")
  done <<< "$TIER_LINES"
  printf "  Tier %d (parallel): %s\n" "$T" "${TIER_TASKS[*]}"
done
echo ""

# ── Run tier by tier ───────────────────────────────────────

draw_monitor "${TASK_IDS[@]}"
tput sc
MONITOR_ACTIVE=1

for (( CURRENT_TIER=1; CURRENT_TIER<=MAX_TIER; CURRENT_TIER++ )); do
  # Collect tasks for this tier
  TIER_TASKS=()
  while IFS=' ' read -r TIER TASK; do
    [[ "$TIER" == "$CURRENT_TIER" ]] && TIER_TASKS+=("$TASK")
  done <<< "$TIER_LINES"

  [[ ${#TIER_TASKS[@]} -eq 0 ]] && continue

  # Launch this tier in parallel
  TIER_PIDS=()
  for TASK_ID in "${TIER_TASKS[@]}"; do
    bash "$(dirname "$0")/run-task.sh" "$TASK_ID" "$LOGS_DIR" &
    TIER_PIDS+=($!)
    PIDS+=($!)
  done

  # Wait for all tasks in this tier to finish
  while ! all_finished "${TIER_TASKS[@]}"; do
    sleep 0.8
    tput rc
    tput ed
    draw_monitor "${TASK_IDS[@]}"
    tput sc
  done

  # Abort subsequent tiers if any task in this tier failed
  if any_failed "${TIER_TASKS[@]}"; then
    tput rc; tput ed
    draw_monitor "${TASK_IDS[@]}"
    echo ""
    printf "${RED}${BOLD}✗ Tier %d had failures — stopping remaining tiers${NC}\n" "$CURRENT_TIER"
    FAILED_TIERS=()
    for (( RT=CURRENT_TIER+1; RT<=MAX_TIER; RT++ )); do
      while IFS=' ' read -r TIER TASK; do
        [[ "$TIER" == "$RT" ]] && FAILED_TIERS+=("$TASK")
      done <<< "$TIER_LINES"
    done
    if [[ ${#FAILED_TIERS[@]} -gt 0 ]]; then
      printf "${DIM}Skipped (not started): %s${NC}\n" "${FAILED_TIERS[*]}"
    fi
    tput cnorm
    exit 1
  fi
done

# ── Final redraw + summary ─────────────────────────────────

tput rc
tput ed
draw_monitor "${TASK_IDS[@]}"

echo ""
FAILED=()
for TASK_ID in "${TASK_IDS[@]}"; do
  STATUS=$(read_status_field "$LOGS_DIR/${TASK_ID}.status" STATUS)
  [[ "$STATUS" == "failed" ]] && FAILED+=("$TASK_ID")
done

if [ ${#FAILED[@]} -eq 0 ]; then
  printf "${GREEN}${BOLD}✓ All tasks complete${NC}\n\n"
  printf "Next steps:\n"
  for ID in "${TASK_IDS[@]}"; do
    printf "  ${DIM}/git-commit ${ID}${NC}\n"
  done
else
  printf "${RED}${BOLD}✗ ${#FAILED[@]} task(s) failed:${NC}\n"
  for ID in "${FAILED[@]}"; do
    printf "  ${RED}$ID${NC} — ${DIM}tail -f logs/${ID}.log${NC}\n"
  done
  exit 1
fi
