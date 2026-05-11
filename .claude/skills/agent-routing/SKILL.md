---
name: agent-routing
description: Pick the model (haiku/sonnet/opus), subagent_type (Explore/general-purpose/Plan/code-simplifier), isolation (worktree y/n), and parallel flags (run_in_background, name) for every spawned Agent — invoke before any Agent() call that costs more than a one-shot tool use. Kills "Opus for grep" waste and "Haiku for architecture" under-tooling.
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git log:*)
---

# agent-routing

Workflow position: **invoked from /run-tasks and /run-tasks-p before any Agent() call — produces the Agent invocation block**

Stops over-engineering and under-tooling. Routes each task to the cheapest model that can do the job, with the right isolation level, type, and parallel-flag set.

Arguments: `[task description or task-id]` (one invocation per agent to spawn)

---

## When to invoke

- `/run-tasks` step that decides per-task agent config
- `/run-tasks-p` ditto for headless agents
- Anywhere the parent is about to spawn ≥ 2 agents in parallel
- Manual agent spawn for any non-trivial subtask (multi-file edit, codebase-wide survey, design pass)

Skip:
- Single-tool one-shot (just call the tool, don't spawn an Agent)
- Trivial lookup that one `Grep` + one `Read` already answers
- Continuing an existing spawned agent — use `SendMessage` with the agent's name, not a new Agent() call

Companion skills (don't duplicate their work):
- **`plan-driven-delivery`** — owns the requirement contract; `agent-routing` owns the spawn config only.
- **`.claude/rules/parallel-work.md`** — the split unit is **one user story per agent, never one layer per agent**. If the proposed task spans > 1 story or is split by layer (FE agent + BE agent for same task), route back and split the task first.

---

## Step 1 — Classify the work

Pick exactly one row:

| Class | Definition | Example |
|---|---|---|
| **lookup** | "Find X in the codebase, return file:line" | "Where is `authMiddleware` defined?" |
| **exploration** | "Survey area Y and summarize" | "How does the auth flow work end-to-end?" |
| **mechanical** | "Apply pattern P to N files; rules deterministic" | "Rename `userId` to `accountId` across repo" |
| **implementation** | "Build feature against requirement doc; involves design judgment" | "Implement SP3-T012 export endpoint" |
| **architecture** | "Design or critique an architecture; tradeoff-heavy" | "Should we move from monolith to microservices?" |
| **review** | "Read diff, find issues against rubric" | Code review on a PR |

If torn between two → pick the more expensive class only if the work has irreversible cost (architecture, prod-touching).

---

## Step 2 — Route the model

| Class | Model | Why |
|---|---|---|
| lookup | **Haiku** | Fast, cheap; reading + matching only |
| exploration | **Haiku** or **Sonnet** | Haiku for breadth scan, Sonnet if synthesis needed |
| mechanical | **Haiku** or **Sonnet** | Haiku if rule is regex-clean; Sonnet if context-aware |
| implementation | **Sonnet** | Sweet spot for code change with judgment |
| architecture | **Opus** | Tradeoff space, long-horizon decisions |
| review | **Sonnet** (Opus only for critical) | Most reviews don't need Opus |

Override rule: if budget is tight, downgrade by one tier. If quality bar is "ship-blocking critical," upgrade by one tier. Never two tiers.

Anti-pattern: Opus for "lookup which file has X" — pure waste.

---

## Step 3 — Pick the agent type

Available `subagent_type` values in this harness:

| Type | Use for | Edits files? |
|---|---|---|
| `Explore` | Read-only search across codebase, file-pattern lookup, "where is X" | no |
| `general-purpose` | Default — research + multi-step + edits | yes |
| `Plan` | Architecture / design plans, tradeoff analysis | no |
| `code-simplifier` | Refactor recently-modified code for clarity, preserving behavior | yes |
| `claude-code-guide` | Q&A about Claude Code / Anthropic SDK / API features (not the user's repo) | no |
| `statusline-setup` | Configure the user's status line setting | yes (settings) |

Routing:

| Class | Agent type |
|---|---|
| lookup | `Explore` |
| exploration | `Explore` if breadth > depth, `general-purpose` if depth |
| mechanical | `general-purpose` (or `code-simplifier` if the goal is clarity/consistency on already-written code) |
| implementation | `general-purpose` |
| architecture | `Plan` |
| review | `general-purpose` |

If unsure between `Explore` and `general-purpose`: pick `Explore` when no edits are required — its read-only sandbox prevents drift, and it returns excerpts instead of whole files (cheaper).

---

## Step 4 — Decide isolation

`isolation: "worktree"` creates a separate git worktree for the agent.

Use worktree when:
- Agent will make file edits AND
- Agent runs in parallel with other agents/work AND
- Edits are non-trivial enough that conflicts matter

Skip worktree when:
- Read-only agent (`Explore`)
- Quick mechanical change with no parallel work
- Single-agent run

---

## Step 5 — Set allowed-tools (least privilege)

Match tool surface to the class:

| Class | Tools |
|---|---|
| lookup | `Read, Grep, Glob` |
| exploration | `Read, Grep, Glob, WebFetch (if external)` |
| mechanical | `Read, Edit, Glob, Bash(specific commands)` |
| implementation | `Read, Edit, Write, Bash(*test*, *build*, *lint*)` |
| architecture | `Read, Grep, Glob` (planning, no edit) |
| review | `Read, Grep, Glob, Bash(git diff:*)` |

Prefer enumerating specific Bash commands over `Bash(*)`.

---

## Step 6 — Parallel flags (`name`, `run_in_background`)

These two Agent params turn a one-shot spawn into something the parent can coordinate with later. Set them when they earn their keep, omit them otherwise.

| Param | Set when | Skip when |
|---|---|---|
| `name` | Parent may want to continue the agent via `SendMessage`, OR multiple agents run in parallel and the user will see status lines | Single spawn the parent waits on, then discards |
| `run_in_background: true` | Parent has genuinely independent work to do while the agent runs (long build, parallel investigation) | Parent needs the result before it can proceed — keep it foreground |

Foreground is the safe default. Background without independent work just delays the result without saving wall-clock.

---

## Step 7 — Assemble the routing decision

Produce the routing block (used by Step 8 / caller):

```
agent-routing: [task / task-id]
Class:      [class]
Model:      [haiku / sonnet / opus]
Type:       [Explore / general-purpose / Plan / code-simplifier / ...]
Isolation:  [none / worktree]
Tools:      [Read, Grep, ...]
Parallel:   [foreground | background], name=[name or omit]

Reasoning (≤ 3 lines):
- [why this class]
- [why this model — what about the work demands it]
- [why this isolation + parallel flags]
```

---

## Output (manual mode)

Emit the full Agent call block and end with the standard 2-option completion message per `.claude/rules/completion-format.md`:

```
Agent({
  description: "[3–5 word task description]",
  subagent_type: "[type]",
  model: "[haiku|sonnet|opus]",
  name: "[name]",                        // omit if not needed
  prompt: "[self-contained brief — what to do, what's already known, what to report back, length cap]",
  isolation: "worktree",                 // omit if not needed
  run_in_background: true                // omit if foreground
})
```

```
Next: choose one
A) Request changes — describe what to revise
B) Continue to Agent() spawn
```

### Worked example — "find every callsite of `authMiddleware`"

```
agent-routing: lookup-authMiddleware-callsites
Class:      lookup
Model:      haiku
Type:       Explore
Isolation:  none
Tools:      Read, Grep, Glob
Parallel:   foreground, no name

Reasoning:
- lookup → cheapest tier; reading + matching only
- haiku → grep + read, no synthesis; Sonnet would be waste
- no worktree, no name → read-only, single spawn, parent waits on result

Agent call:

Agent({
  description: "Find authMiddleware callsites",
  subagent_type: "Explore",
  model: "haiku",
  prompt: "Find every file that imports or calls `authMiddleware`. Report as a list of `path:line — short context`. Search broadly across the repo (routes, middleware chains, tests). Under 100 words."
})
```

---

## Step 8 — Anti-pattern guards (refuse to route)

If any of these are true, STOP and flag instead of producing the block:

| Guard | Refusal message |
|---|---|
| Task is < 5 min of work | "Don't spawn — do it inline" |
| Task description has no clear deliverable | "Refine the prompt before spawning — agent will wander" |
| Task spans > 1 user story | "Split per parallel-work.md rule (one task per agent), then re-route" |
| Task needs human confirmation mid-flight | "Don't spawn — keep in main session for the confirmation point" |
| Opus requested for lookup/mechanical | "Downgrade to Haiku/Sonnet — Opus is cost waste here" |
| `run_in_background: true` with no independent parent work | "Use foreground — background only saves wall-clock if the parent does other work" |

---

## Anti-patterns

- ❌ Opus everywhere "to be safe" — burns budget on trivial work
- ❌ Haiku for architecture — under-tooled, will produce shallow plans
- ❌ Worktree for read-only agents — pointless overhead
- ❌ `Bash(*)` everywhere — defeats permission system
- ❌ Skipping the prompt brief and giving "do task X" — agent has no context
- ❌ `run_in_background: true` then immediately blocking on the result — defeats the purpose
- ❌ New Agent() call to continue prior work — use `SendMessage` with the agent's `name` instead

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: full reasoning + Agent call block.
- **Autopilot mode**: emit status line + return Agent call block to caller. Never blocks.
- Flag `?` if the task description spans > 1 user story (per `.claude/rules/parallel-work.md` — cannot auto-split) or if the class is ambiguous between `architecture` and `implementation` (different models).

### Output (autopilot status line — required)

`> agent-routing: [class] → [model] / [type]  [✓|?]`

Example: `> agent-routing: implementation → sonnet / general-purpose  ✓`

---

## Why this exists

Each Agent() call costs time (spawn overhead) and money (token usage scales with model). Default everywhere = default badly. This skill makes the routing decision explicit, cheap to verify, and consistent across the team.
