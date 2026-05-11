---
name: ddd
description: Lightweight Domain-Driven Design gate — bounded contexts at discovery, single-context-per-task at sprint planning, aggregate + ubiquitous-language artifact at requirement, anemic-model / cross-aggregate-transaction / leaky-language scan at code review. Skip outright for pure CRUD / forms-over-data tasks.
allowed-tools: Read, Grep, Glob, Edit, Bash(git diff:*), Bash(git log:*)
---

# ddd

**Workflow position: four-mode gate invoked from `/discovery` Step 3, `/new-sprint` Step 3 hard-gate, `/requirement` Step 2 (before `plan-driven-delivery`), and `/code-review` Step 2b (after Context7 check).**

Lightweight DDD. Produces small artifacts (tables, not canvases). Designed to add ~5–10 minutes per call, not derail the sprint into modeling ceremony.

Different from related skills:
- `api-contract` = wire-level shape (request/response, fields, errors). `ddd` = domain-level shape (aggregates, invariants, language) that the wire shape serves.
- `impact-map` = mechanical "what code breaks." `ddd` = conceptual "what model breaks."
- `risk-register` = downside engineering risks. `ddd` = downside model-integrity risks (anemic, leaky, cross-aggregate).

The skill is **deliberately small**. It is NOT the full Bounded Context Canvas or Aggregate Design Canvas — escalate to those (see `## Escalate to full DDD canvases when` below) only when a single story flags >3 invariants or introduces a NEW bounded context.

Arguments: `[mode] [task-or-sprint-or-disc-id]` — `mode` ∈ `discovery | slice | model | review`.

---

## When to invoke

By caller:

| Caller | Mode | Trigger condition |
|---|---|---|
| `/discovery` Step 3 (after Epic Breakdown is filled) | `discovery` | Always when scope > 1 epic OR problem statement names ≥ 2 stakeholder roles. Skip for trivial single-team utility discoveries. |
| `/new-sprint` Step 3 hard-gate (after vertical-slice check) | `slice` | Always when the parent discovery has ≥ 2 bounded contexts. Skip when discovery has only one context. |
| `/requirement` Step 2 (after Implementation Plan, before `plan-driven-delivery`) | `model` | Story touches ANY of: a new aggregate, a new domain term, an invariant beyond field validation, an event consumed/emitted across contexts. Skip otherwise (see "When to skip"). |
| `/code-review` Step 2b (after Context7) | `review` | Always when the diff includes any file under `src/domain/`, `internal/domain/`, `pkg/model/`, or equivalent — OR the requirement doc contains a `## Domain Model` section. Skip for diffs that are pure plumbing / config / docs. |

---

## When to skip (and EMIT skipped status)

Skip outright when ALL of:
- Task is pure CRUD / forms-over-data (no business invariants beyond field validation).
- No new domain term is introduced.
- No cross-context interaction.
- Touches at most one already-existing aggregate.

Forcing DDD ceremony on CRUD tasks is the #1 anti-pattern in shallow DDD adoption. Output `> ddd (skipped): pure CRUD, no domain logic  ✓` and return.

---

## Vocabulary (inline reference for every mode)

| Term | One-line definition |
|---|---|
| **Bounded context** | A boundary inside which one model + one ubiquitous language is consistent. Outside it, the same word may mean something different. |
| **Ubiquitous language** | Shared vocabulary used identically by domain experts, code, tests, and docs *inside one context*. |
| **Entity** | Object with stable identity over time, even as attributes change. |
| **Value object** | Immutable object defined only by its attributes; equal attributes = interchangeable. |
| **Aggregate** | Cluster of entities + value objects treated as one consistency boundary; one root entity is the only external reference. |
| **Domain event** | A past-tense, business-significant fact emitted after a state change. |
| **Repository** | Collection-like abstraction for persisting/loading **whole aggregates**. One repo per aggregate root. |
| **Anti-corruption layer (ACL)** | Translation layer between two contexts so a foreign model doesn't leak in. |

---

## Mode: `discovery` — identify bounded contexts from a problem statement

Input: `docs/discovery/[disc-id]-[name].md` already drafted through Step 3.5 (Epic Breakdown filled). Output: a `## Bounded Contexts (DDD)` section appended before "Definition of Ready for /new-sprint".

### Step 1 — Extract candidate contexts

From the discovery doc's Problem Statement, Affected Users, and Epic Breakdown:
1. List all **nouns** that name a thing the system manages.
2. For each noun, ask: do different stakeholders use the SAME word for DIFFERENT meanings? If yes, that noun is a **context seam**.
3. Cluster nouns that share invariants and language → each cluster is a candidate bounded context.

### Step 2 — Classify each context

| Context | Type | Rationale |
|---|---|---|
| `<name>` | core / supporting / generic | core = our differentiator; supporting = needed but not differentiating; generic = solved problem (use OTS) |

**Only `core` contexts deserve bespoke modeling effort.** Flag any context tagged `generic` that we plan to build in-house — that is usually wrong; recommend an off-the-shelf solution instead.

### Step 3 — List shared concepts and assign owners

For every concept that crosses contexts (e.g. `User`, `Order`, `Money`):

| Shared concept | Owning context | Consumed by | Integration pattern |
|---|---|---|---|
| `<concept>` | `<context>` | `<contexts>` | ACL / domain event / shared kernel / conformist |

**Default to ACL** unless there is a strong reason for shared kernel — shared kernel is the most common source of cross-team coupling.

### Step 4 — Append to discovery doc

Insert a new section before "Definition of Ready for /new-sprint":

```markdown
## Bounded Contexts (DDD)

[Step 2 table]

### Shared concepts
[Step 3 table]
```

If the discovery's "Shared entities / cross-epic concerns" subsection already exists (per `discovery-epic-mapping.md`), reconcile the two — `## Bounded Contexts (DDD)` is the source of truth for ownership; the cross-epic subsection cites it.

---

## Mode: `slice` — verify per-task context ownership

Input: the proposed Stories table from `/new-sprint` Step 3 + the discovery doc's `## Bounded Contexts (DDD)` section. Output: a per-task verdict.

### Step 1 — Per-task gate

For each task in the proposed sprint plan:
1. Name the **single owning bounded context** (must come from the discovery doc's context list).
2. If the task touches a second context → name the integration pattern (ACL / domain event / shared kernel / conformist).
3. If acceptance criteria require a **single transaction across two aggregate roots** → flag as a slicing smell. Resolve by either splitting the task or using a domain event + eventual consistency.

### Step 2 — Verdict line per task

| Task | Owning context | Cross-context? | Verdict |
|---|---|---|---|
| `SP2-T005` | `<context>` | no | `OK` |
| `SP2-T012` | `<context>` | yes (via ACL to `<other>`) | `OK — cross-context` |
| `SP2-T018` | `<context>` | yes | `SMELL — cross-aggregate transaction in AC-3` |

Tasks flagged `SMELL` are blocked from `/new-sprint` Step 3 confirmation until split or re-designed. Tasks flagged `OK — cross-context` proceed but must declare the integration pattern in their `/requirement` doc.

---

## Mode: `model` — per-story domain model artifact

Input: drafted `[task-id]-requirement.md` after the Implementation Plan but before `plan-driven-delivery` is invoked. Output: a `## Domain Model` section appended to the requirement doc.

### Step 0 — Skip check (strict)

Re-evaluate the "When to skip" criteria against the requirement doc's ACs. If skip → emit skipped status, return. Do not produce empty tables.

### Step 1 — Identify aggregates touched

From the Implementation Plan and ACs, list every aggregate root the story creates / mutates / queries. If the count is 0, this is not a `model`-mode story — re-run Step 0.

### Step 2 — Aggregate Table

Append to `[task-id]-requirement.md` under a new `## Domain Model` section, immediately after the Implementation Plan section and BEFORE the Execution Slices section:

```markdown
## Domain Model

> **Owning context:** `<X>`. **Integrations:** `<Y>` via ACL / domain event / shared kernel.
> *(Omit this line if the story touches only one bounded context.)*

### Aggregates

| Aggregate | Root | Invariants (must always hold) | Commands handled | Events emitted | Repository |
|---|---|---|---|---|---|
| `<name>` | `<root entity>` | <one invariant per line, semicolon-separated; cite ACs> | `<command names>` | `<past-tense event names>` | `<repo name>` |

### Ubiquitous Language Delta

| Term | Context | Definition (1 sentence) | Replaces / synonyms to avoid |
|---|---|---|---|
| `<term>` | `<context>` | <one-sentence definition> | <old terms now banned> |
```

### Step 3 — Cross-link invariants to ACs (HARD-GATE)

Every invariant in the Aggregate Table MUST map to at least one AC (and therefore at least one TDD test row). Add cross-references inline (e.g., `cannot confirm if payment.status ≠ paid (AC-3)`).

If an invariant has no AC → STOP. Either add the AC (and the TDD row) or remove the invariant. **An untested invariant is a wish.**

### Step 4 — Escalation check

If ANY of:
- Aggregate has >3 invariants
- Story introduces a NEW bounded context (not in discovery's context list)
- >2 aggregates touched in one story

→ STOP and recommend escalating to the full [Bounded Context Canvas](https://github.com/ddd-crew/bounded-context-canvas) and/or [Aggregate Design Canvas](https://github.com/ddd-crew/aggregate-design-canvas) before continuing the story. The lightweight tables here are insufficient for that scope.

---

## Mode: `review` — DDD violations in the diff

Input: `git diff main...HEAD` for the task branch + the requirement doc's `## Domain Model` section (if present). Output: findings appended to `/code-review`'s Step 3 report.

### The 6 violations to scan

| # | Violation | Smell to grep for | Fix | Severity |
|---|---|---|---|---|
| 1 | **Anemic model** | Entity class / struct with only getters/setters; business logic lives in a service | Move logic into the entity | Major |
| 2 | **Repository inside aggregate** | Aggregate constructor / method calls a repository to load another aggregate | Pass IDs only; load at the application service | Critical |
| 3 | **Cross-aggregate transaction** | One DB transaction mutates two aggregate roots | Split into two transactions + domain event for eventual consistency | Critical |
| 4 | **Mutable value object** | VO has setters or an `id` field | Make immutable; replace via constructor | Minor |
| 5 | **Leaky language** | Code uses synonyms for the same domain term (`Reservation`/`Booking`/`Trip`), or DB-shaped names (`tbl_user`, `usr`) | Rename to the ubiquitous-language term from the requirement doc's UL Delta | Minor (Major if the term is in the UL Delta and the diff diverges) |
| 6 | **Log-style event name** | Domain event named after a DB op (`RowInserted`, `RecordUpdated`) | Rename to past-tense business fact (`OrderPlaced`) | Major |

Findings feed back into `/code-review` Step 3 with the severities above. Critical findings auto-trigger `/issue` per `/code-review` Step 3d.

### When the requirement doc has NO `## Domain Model` section

Then the `model` mode was correctly skipped (CRUD task) or incorrectly skipped. Apply this check:
- Diff is purely CRUD / plumbing → confirm skip was correct, emit `> ddd (review): no domain model section, diff is plumbing only  ✓`.
- Diff introduces invariants, new domain terms, or events → return the task to `/requirement` to add the `## Domain Model` section. Do NOT silently approve.

---

## Output (manual mode)

```
ddd ([mode]):
Mode: [discovery | slice | model | review | skipped]
[Mode-specific summary line — see below]
Section appended to: [path]   OR   Findings: [N critical / K major / M minor]

Next: choose one
A) Request changes — describe what to revise
B) Continue to [next-step-name]
```

Mode-specific summary lines:
- `discovery`: `Contexts identified: [N] (core: [K], supporting: [J], generic: [M]). Shared concepts: [P].`
- `slice`: `[N] tasks checked, [K] OK, [J] cross-context, [M] smells.`
- `model`: `Aggregates: [N] ([invariant count] invariants total, all mapped to ACs). UL delta: [K] new terms. Escalation: [yes/no].`
- `review`: `Findings: [N critical / K major / M minor].`
- `skipped`: `Reason: [pure CRUD / no domain logic / single existing aggregate / etc.]`

---

## Behavior in autopilot mode

Autopilot status line (one only — per `.claude/rules/autonomous-mode.md`):

```
> ddd ([mode]): [terse summary]  [✓|?]
```

Examples:
- `> ddd (discovery): 3 contexts (1 core), 2 shared concepts (ACL)  ✓`
- `> ddd (slice): 5 tasks, 1 cross-aggregate smell on T012  ?`
- `> ddd (model): 1 aggregate, 3 invariants → 3 ACs, no escalation  ✓`
- `> ddd (review): 2 critical (cross-agg txn, repo-in-agg), 1 minor  ?`
- `> ddd (skipped): pure CRUD, no domain logic  ✓`

Block conditions per `autonomous-mode.md` (3 official reasons only):
- **Ambiguity** (`?`): cannot decide if a context is core/supporting/generic; cannot tell whether a transaction crosses aggregate roots; cannot find the ubiquitous term for a noun. Emit `?`, let the orchestrator batch into `ask-choice`.
- **Destructive op**: never (this skill writes section appends only).
- **ui-verify fail**: not applicable.

In all other cases (e.g. an invariant lacks an AC) the skill follows the same hard-gate behavior as the corresponding command — flag the issue and stop, do not request user confirmation in autopilot.

---

## Anti-patterns

- ❌ Running `model` mode for a CRUD task with no invariants — produces empty tables, trains people to ignore DDD output. Skip instead.
- ❌ Letting "leaky language" findings (severity Minor) gate a code review when the term is NOT in the UL Delta — fix in a follow-up; don't block merges over naming alone.
- ❌ Treating shared kernel as the default integration pattern — research is unambiguous: ACL or domain event first. Shared kernel only when teams agree to versioned co-ownership.
- ❌ Adding `ddd` invocation to commands not listed at the top of this file. The skill is scoped to 4 callers; expanding it elsewhere makes the audit trail unclear.
- ❌ Inventing a NEW bounded context inside a story without escalating to the Bounded Context Canvas. Per Step 4 of `model` mode, this is an automatic stop.

---

## Escalate to full DDD canvases when

- Story introduces a NEW bounded context → use [Bounded Context Canvas](https://github.com/ddd-crew/bounded-context-canvas).
- Aggregate has >3 invariants OR >5 commands → use [Aggregate Design Canvas](https://github.com/ddd-crew/aggregate-design-canvas).
- Multi-team integration design → run an Event Storming session (Big Picture, then Process Modelling).

---

## Sources

- Eric Evans, *Domain-Driven Design* (Blue Book, 2003)
- Vaughn Vernon, *Domain-Driven Design Distilled* (2016) — best lightweight intro
- Microsoft Learn — [Tactical DDD](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd)
- Martin Fowler — [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html), [Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html)
- DDD Crew — [Bounded Context Canvas](https://github.com/ddd-crew/bounded-context-canvas), [Aggregate Design Canvas](https://github.com/ddd-crew/aggregate-design-canvas)
- Alberto Brandolini — Event Storming (Big Picture / Process Modelling)
