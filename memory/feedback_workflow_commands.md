---
name: workflow command decisions
description: Which commands belong in the sprint workflow and which don't
type: feedback
---

`/plan-task` was removed from the workflow. `/new-sprint` already scaffolds all tasks, so `/plan-task` is redundant in the standard flow.

**Why:** User confirmed `/new-sprint` generates all sub-tasks — having `/plan-task` in the main flow was confusing and implied an extra step that isn't needed.

**How to apply:** The correct workflow is `/new-sprint` → tasks are ready. Do not suggest `/plan-task` as part of the standard flow.

---

`/implement` is a required step between `/be-design` and `/issue`. It is the command that writes failing tests and implements code following the FE + BE design docs.

**Why:** Previously "implement" was just a prose instruction in the `/be-design` output — not a proper command. Users need a real `/implement` command to trigger the implementation phase.

**How to apply:** Always include `/implement [task-id]` as the next step after `/be-design` completes.
