---
name: agent-routing
description: Pick the right model (Haiku/Sonnet/Opus), agent type (Explore/general/Plan), and isolation (worktree y/n) for each spawned agent — kills "Opus for grep" waste
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git log:*)
---

# agent-routing

Workflow position: **invoked from /run-tasks and /run-tasks-p before any Agent() call — produces the Agent invocation block**

Stops over-engineering and under-tooling. Routes each task to the cheapest model that can do the job, with the right isolation level.

Arguments: `[task description or task-id]` (one invocation per agent to spawn)

---

## When to invoke

- `/run-tasks` step that decides per-task agent config
- `/run-tasks-p` ditto for headless agents
- Anywhere the parent is about to spawn ≥ 2 agents in parallel
- Manual agent spawn for a non-trivial subtask

Skip:
- Single-tool one-shot (just call the tool, don't spawn)
- Trivial lookup that `Bash` + `Read` already does

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

Available types in this harness:

| Type | Use for |
|---|---|
| `Explore` | Read-only search across codebase. NO edits. |
| `general-purpose` | Default — research + multi-step + can edit |
| `Plan` | Architecture / design plans, no code change |
| `claude-code-guide` | Q&A about Claude Code itself, not the user's repo |
| `statusline-setup` | Specific config tasks |

Routing:

| Class | Agent type |
|---|---|
| lookup | `Explore` |
| exploration | `Explore` if breadth > depth, `general-purpose` if depth |
| mechanical | `general-purpose` |
| implementation | `general-purpose` |
| architecture | `Plan` |
| review | `general-purpose` |

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

## Step 6 — Output the invocation block

```
### Agent block for: [task / task-id]

Class:       [lookup / exploration / ...]
Model:       [haiku / sonnet / opus]
Type:        [Explore / general-purpose / Plan / ...]
Isolation:   [none / worktree]
Tools:       [Read, Grep, ...]

Reasoning (≤ 3 lines):
- [why this class]
- [why this model — what about the work demands it]
- [why this isolation]

Agent call:

Agent({
  description: "[3–5 word task description]",
  subagent_type: "[type]",
  model: "[model]",
  prompt: "[self-contained brief — what to do, what's already known, what to report back, length cap]",
  isolation: "[worktree if applicable, omit otherwise]"
})
```

Caller takes this block and either runs `Agent()` directly or includes it in a parallel-spawn batch.

---

## Step 7 — Anti-pattern guards (refuse to route)

If any of these are true, STOP and flag instead of producing the block:

| Guard | Refusal message |
|---|---|
| Task is < 5 min of work | "Don't spawn — do it inline" |
| Task description has no clear deliverable | "Refine the prompt before spawning — agent will wander" |
| Task spans > 1 user story | "Split per parallel-work.md rule (one task per agent), then re-route" |
| Task needs human confirmation mid-flight | "Don't spawn — keep in main session for the confirmation point" |
| Opus requested for lookup/mechanical | "Downgrade to Haiku/Sonnet — Opus is cost waste here" |

---

## Output

```
agent-routing: [task / task-id]
Class:       [class]
Model:       [model]   Type: [type]   Isolation: [worktree?]
Tools:       [list]

Agent call block: [embedded above]
Reasoning: [1–3 lines]

Next: caller runs Agent() with this block
```

---

## Anti-patterns

- ❌ Opus everywhere "to be safe" — burns budget on trivial work
- ❌ Haiku for architecture — under-tooled, will produce shallow plans
- ❌ Worktree for read-only agents — pointless overhead
- ❌ `Bash(*)` everywhere — defeats permission system
- ❌ Skipping the prompt brief and giving "do task X" — agent has no context

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: full reasoning + Agent call block.
- **Autopilot mode**: emit status line + return Agent call block to caller. Never blocks.

## Output (autopilot status line — required)

`> agent-routing: [class] → [model] / [type]  [✓]`

Example: `> agent-routing: implementation → sonnet / general-purpose  ✓`

---

## Why this exists

Each Agent() call costs time (spawn overhead) and money (token usage scales with model). Default everywhere = default badly. This skill makes the routing decision explicit, cheap to verify, and consistent across the team.
