#!/bin/bash
# run-task.sh — Run full workflow for a single task via claude -p
# Usage: ./scripts/run-task.sh SP1-T001 [logs-dir]

set -e

TASK_ID=${1:?"Usage: ./scripts/run-task.sh [task-id]  e.g. SP1-T001"}
LOGS_DIR="${2:-logs}"

mkdir -p "$LOGS_DIR"

STATUS_FILE="$LOGS_DIR/${TASK_ID}.status"
LOG_FILE="$LOGS_DIR/${TASK_ID}.log"

TASK_START=$(date +%s)

write_status() {
  local STEP=$1
  local PHASE=$2
  local STATUS=$3
  printf "STEP=%s\nPHASE=%s\nSTATUS=%s\nSTART=%s\nUPDATED=%s\n" \
    "$STEP" "$PHASE" "$STATUS" "$TASK_START" "$(date +%s)" > "$STATUS_FILE"
}

run_step() {
  local STEP=$1
  local PHASE=$2
  local CMD=$3

  write_status "$STEP" "$PHASE" "running"

  if ! claude -p --dangerously-skip-permissions "$CMD" >> "$LOG_FILE" 2>&1; then
    write_status "$STEP" "$PHASE" "failed"
    exit 1
  fi
}

write_status "0/7" "starting" "running"

run_step "1/7" "fe-design"   "/fe-design $TASK_ID"
run_step "2/7" "be-design"   "/be-design $TASK_ID"
run_step "3/7" "implement"   "/implement $TASK_ID"
run_step "4/7" "code-review" "/code-review $TASK_ID"
run_step "5/7" "testing"     "/testing $TASK_ID"
run_step "6/7" "retro-task"  "/retro-task $TASK_ID"
run_step "7/7" "git-commit"  "/git-commit $TASK_ID"

write_status "7/7" "git-commit" "done"
