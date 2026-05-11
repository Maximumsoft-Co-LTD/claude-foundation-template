---
name: Metric Instrumentation Rules
description: Enforces 3 hard gates so every Success Metric has a measurable artifact at sprint definition, requirement, and retro time.
scope: universal
---

# Metric Instrumentation Rules

**Every Success Metric in a sprint overview MUST trace to a concrete instrumentation artifact at `/requirement` time and to an actual measured value at `/retro-sprint` time.**

A target without instrumentation is a wish. A retro that says "metric: not measured" is a sprint that didn't fully ship.

## The 3 hard gates

### Gate 1 — `/new-sprint` (definition)

The `## Success Metrics` table must have all three columns filled for every row:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time-to-ticket (median) | ≤ 90s | session-start → ticket-display timestamps in `audit_log` |

The **Measurement** column is not free-text. It MUST name:
- A **data source** (table/log/event/Prometheus metric/structured log line), AND
- A **query or aggregation** (or "manual count" only for one-shot metrics), AND
- A **collection point** that is part of the implementation (a task ID or component owns this row)

**Block conditions:**
- ❌ Measurement = "manual check" without a defined artifact → REJECT (it will be skipped)
- ❌ Measurement names a system that doesn't exist yet AND no task in the sprint plans to add it → REJECT (define an instrumentation task or remove the metric)
- ❌ Measurement = "TBD" / blank → REJECT
- ✅ Measurement names a concrete log line / DB column / event name and at least one task plans to emit it

### Gate 2 — `/requirement` (propagation)

For each Success Metric whose Measurement column references THIS task:
- The task's `## Implementation Plan` MUST include at least one row that produces the artifact (write the log line, add the column, fire the event).
- The task's `## Acceptance Criteria` MUST include an AC asserting the artifact is emitted (e.g. "AC-N: on successful booking, an `audit_log` row with `event=ticket_issued` and `ts` is written").
- The task's `## TDD Test Plan` MUST include a test row verifying the emission (per `.claude/rules/testing.md` — instrumentation is real behavior, not a comment).

If a metric's Measurement points at this task but the task has no AC for the artifact → STOP, fix the requirement doc before proceeding to `/implement`.

### Gate 3 — `/retro-sprint` (verification)

Step 3 (Evaluate sprint goals and success metrics) MUST produce a row per Success Metric with:

| Metric | Target | Actual | Source artifact | Verdict |
|--------|--------|--------|-----------------|---------|
| Time-to-ticket (median) | ≤ 90s | 73s | `audit_log` query: `SELECT median(...) FROM ...` | ✓ |

**Block conditions:**
- ❌ Actual = "not measured" / "n/a" → automatic Action Item: "Add instrumentation in next sprint" + flag the Definition-of-Done as not met
- ❌ Source artifact is named but the actual was reported without running the query → re-run the query, paste the result
- ✅ Actual + named source + verdict (✓ / ✗ / partial) — DoD line passes

## Why all three gates

A metric only delivers value if the loop closes: target → instrumentation in code → query → actual. Skipping any gate leaks one of the three:

| Gate skipped | What leaks | Symptom |
|---|---|---|
| Gate 1 | The metric is unmeasurable from day 1 | Retro says "we forgot to log this" |
| Gate 2 | The metric has a target and a source name, but the source is never written | Retro query returns 0 rows |
| Gate 3 | The metric was instrumented but never read | Sprint closes "done" without knowing if we hit the target |

## Anti-patterns

- ❌ "We'll figure out how to measure it later" — Gate 1 blocks this
- ❌ "Just count manually for now" — only acceptable as a one-shot for v1; must be replaced with an artifact in next sprint (record this as a known debt in the metric's row)
- ❌ Pasting the SQL query into the retro without running it — Gate 3 requires the actual number
- ❌ Treating instrumentation as ceremony — if a metric has no artifact, the metric is wrong (delete it) or the task is wrong (add the AC)

## Stack-aware default measurement points

When designing instrumentation, prefer these channels (in order):

1. **Audit log row** — append-only, queryable, already required by many flows (per `PAT-008-audit-in-transaction`)
2. **Structured log line** — JSON, single-line, prefixed with the metric name (e.g. `event=ticket_issued duration_ms=730`)
3. **DB column on the relevant entity** — when the metric is a property of the entity itself (e.g. `bookings.created_at`)
4. **Counter/histogram** — Prometheus-style, only if the project already runs metrics infra (otherwise this is overkill for v1 sprints)

A metric's Measurement column should pick ONE channel and stick to it. Mixing channels for the same metric makes the retro query awkward.
