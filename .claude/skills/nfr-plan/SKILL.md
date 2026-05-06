---
description: Append explicit NFR targets (perf, security, scalability, reliability) to requirement doc — stack-aware defaults for Go/Vue/Nuxt/Mongo/Socket
allowed-tools: Read, Grep, Glob, Edit
disable-model-invocation: false
---

# nfr-plan

Workflow position: **inside `/requirement` step 4 (conditional) when ACs imply non-functional needs OR explicitly invoked**

Forces every requirement doc to commit to **measurable** non-functional targets — perf, security, scalability, reliability — instead of leaving them implicit. AI-DLC adoption.

Arguments: `[task-id]`

---

## When to invoke

Trigger automatically when AC text contains any of:
- perf keywords: `fast`, `responsive`, `latency`, `throughput`, `slow`, `quickly`
- scale keywords: `concurrent`, `users`, `large dataset`, `millions of`, `high-traffic`
- security keywords: `auth`, `permission`, `role`, `secret`, `private`, `encrypted`, `PII`
- reliability keywords: `available`, `uptime`, `failover`, `retry`, `idempotent`

Also invoke explicitly when:
- Task is user-facing prod feature
- Touches authn / authz code
- Adds public API surface

Skip:
- Internal-only refactor with no user impact
- Doc-only change

---

## Step 1 — Read requirement doc

Open `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`. Locate the AC section. Identify which NFR categories the ACs touch (use the keyword list above).

If none triggered AND user didn't explicitly invoke → emit `> nfr-plan: skipped (no NFR signals)  ✓` and return.

---

## Step 2 — Per-category planning

For each triggered category, fill the relevant sub-table.

### Performance (if triggered)

```markdown
### Performance

| Metric | Target | Method |
|---|---|---|
| API p50 latency | ≤ 50 ms | benchmark in BE unit test |
| API p95 latency | ≤ 200 ms | k6 / vegeta load test |
| API p99 latency | ≤ 500 ms | same |
| FE Time-to-interactive | ≤ 2 s on Slow 3G | Lighthouse CI |
| FE FCP | ≤ 1.5 s | Lighthouse CI |
| Memory under load | ≤ 256 MB / pod | grafana / pprof |
```

Stack defaults (use these unless AC overrides):
- Go HTTP handler: p95 ≤ 100 ms typical
- Mongo query: p95 ≤ 50 ms with index
- Nuxt SSR: TTFB ≤ 300 ms
- Socket.io broadcast: ≤ 100 ms one-way

### Security (if triggered)

```markdown
### Security

**Threat model (STRIDE applied to this feature):**

| Threat | Applies? | Mitigation |
|---|---|---|
| Spoofing identity | yes | JWT validated on every request, short-lived access token |
| Tampering | yes | input validated against contract schema |
| Repudiation | yes | audit log entry per state change |
| Info disclosure | yes | response projection excludes `passwordHash`, `_audit` |
| Denial of service | partial | rate limit per IP via middleware (existing) |
| Elevation of privilege | yes | RBAC check on every protected route |

**Authn / Authz:**
- Authentication required: yes (JWT bearer)
- Authorization model: ownership (user can only touch own things) + role admin (can touch any)

**Secrets:**
- New secrets needed: [list, e.g. GOOGLE_OAUTH_CLIENT_SECRET]
- Storage: [.env / KMS / vault]
- Rotation: [N days]

**OWASP Top-10 applicability:**
- A01 Broken access control: applies — RBAC test required
- A03 Injection: applies — Mongo query uses parameterized filter, no string concat
- A07 Auth failures: applies — see auth section
- (others: N/A, with brief reason)
```

### Scalability (if triggered)

```markdown
### Scalability

| Dimension | Current | Target this feature |
|---|---|---|
| Concurrent users (system) | 500 | unchanged |
| Records in `things` collection | 100k | scales to 10M (index covers query pattern) |
| Concurrent socket connections | 200 | scales to 2k (current infra OK) |

**Data growth:**
- Estimated rows added per day: [N]
- Estimated size per row: [bytes]
- 1-year projection: [size] in [collection]

**Caching:**
- Layer: [Redis / in-memory / none]
- TTL: [seconds]
- Invalidation: [event-driven / time-based]

**Bottlenecks expected:**
- [primary suspect — DB index? FE bundle? Socket fanout?]
```

### Reliability (if triggered)

```markdown
### Reliability

| Concern | Target |
|---|---|
| Uptime SLO | 99.5% (≤ 3.6h downtime/month) |
| Mean Time to Detect (MTTD) | < 5 min via Sentry alert |
| RTO (recovery time objective) | < 30 min |
| RPO (recovery point objective) | ≤ 1h (Mongo backup cadence) |
| Idempotency | yes — endpoint accepts `Idempotency-Key` header, dedupes for 24h |
| Retry safety | safe up to 3 retries, exponential backoff 1/2/4s |
| Graceful degradation | if Mongo down: 503 with Retry-After: 30; FE shows "service unavailable" toast |

**Failure modes considered:**
- Mongo connection lost mid-write: txn rollback, return 503
- Socket disconnect mid-broadcast: server queues for 30s reconnect
- Google OAuth callback after timeout: state token expires, user re-initiates
```

---

## Step 3 — Verification plan

For each filled NFR table, identify how the target gets measured/proven:

```markdown
### NFR verification plan

| NFR | Verified by | When |
|---|---|---|
| API p95 ≤ 200ms | k6 load test in CI | every PR touching this endpoint |
| OAuth state token expires < 10min | unit test asserts ttl | merge gate |
| Mongo index covers query | `explain()` in integration test | merge gate |
| FCP ≤ 1.5s | Lighthouse CI | every FE PR |
```

Tests for these go into the `tdd-plan` (next step in pipeline) — this skill does NOT create tests, only the contract.

---

## Step 4 — Resolve unknowns

If any target is genuinely unknown (e.g. user gave no perf SLO, project has no precedent), flag for `ask-choice`:

In autopilot mode → emit `?` with a list of unknowns, let orchestrator batch.

In manual mode → invoke `ask-choice` with multi-choice options:

```
Q: Performance SLO for this feature?
A) Match existing API p95 ≤ 200ms (recommended)
B) Tighter — p95 ≤ 100ms (requires caching layer)
C) Looser — p95 ≤ 500ms (acceptable for non-hot-path)
```

---

## Step 5 — Append to requirement doc

Open the requirement doc, find the section ordering (after `## Acceptance Criteria`, before `## Implementation Plan`), insert:

```markdown
## NFR Plan ([YYYY-MM-DD])

[any of the 4 sub-sections above that were triggered]

### NFR verification plan
[Step 3 table]
```

Do NOT overwrite an existing `## NFR Plan` — if one exists, this is a re-run; show a diff and ask via `ask-choice` whether to merge or replace.

---

## Step 6 — Cross-link from brain

If a DEC note covers a relevant SLO or threat model, link it under the relevant NFR row. Otherwise, note any newly-introduced NFR that should become a DEC and trigger:

```
Invoke Skill("brain-capture") with type=DEC if a target is novel for the project.
```

(Per the SLO becoming a project-wide convention, e.g. "all new endpoints follow p95 ≤ 200ms" → DEC.)

---

## Output (autopilot status line — required)

```
> nfr-plan: [N] categories planned ([list])  ✓
```

Examples:
```
> nfr-plan: skipped (no NFR signals)  ✓
> nfr-plan: 3 categories (perf, sec, rel)  ✓
> nfr-plan: 2 unknowns flagged  ?
```

---

## Anti-patterns

- ❌ Vague targets like "should be fast" — must be a number
- ❌ Copying defaults without checking AC — defaults are starting points, not answers
- ❌ Listing every OWASP item with "N/A" — only mark applies/N/A for items that match the feature
- ❌ Adding NFR section without a verification plan — un-measurable target = not a target
- ❌ Filling NFR for purely-internal changes (refactor, naming)

---

## Why this exists

Without explicit NFR commitments, "performance" and "security" become handwaves that fail at the worst time (load test in staging, security review at PR merge). Forcing measurable NFR up-front makes the requirement honest about what "done" really means and where the sprint will spend effort.
