---
description: Enumerate risks (data loss, regression, security, performance, reliability) before implementing — stack-aware checklists with mitigation + rollback plan, especially for migrations, auth, and payment changes
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git log:*), Bash(git diff:*)
disable-model-invocation: false
---

# risk-register

Workflow position: **inside `/implement` Step 0 (after slicing, before first slice) and `/code-review` Step 4 (before approving) — produces the risk table that makes "what could go wrong" explicit and addressable**

Different from `impact-map`:
- `impact-map` = WHAT existing code/contracts get touched (mechanical)
- `risk-register` = WHAT could go wrong + how to prevent + how to recover (judgement)

Different from `nfr-plan`:
- `nfr-plan` = forward-looking targets (latency p95 < 200ms)
- `risk-register` = downside-looking failures (what if migration partially fails)

Arguments: `[task-id]`

---

## When to invoke

Required when the change touches ANY of:
- Database migrations (schema change, data backfill, index drop)
- Authentication / authorization / session
- Payment / billing / financial calculation
- Public API surface (mobile clients, webhooks)
- Data deletion / retention
- Cron / scheduled jobs in production

Recommended when:
- Impact-map has any 🔴 High or Tier-3 row
- The task touches > 5 files or > 200 LOC
- The change is a refactor of shared utility code

Skip:
- UI-only changes with no behavior shift
- Test-only changes
- Doc / config-comment changes

---

## Step 1 — Categorize the change

Pick the categories that apply (multi-select OK):

| Category | Trigger to include |
|---|---|
| **Data** | Schema change, migration, backfill, deletion, retention change |
| **Auth** | Login, session, token, role/permission, SSO, MFA |
| **Payment** | Money math, invoice, refund, subscription, currency |
| **API** | New/changed endpoint, response shape, status code, headers |
| **Performance** | Query change, new aggregation, removed index, hot path |
| **Reliability** | Cron, queue, retry, circuit breaker, healthcheck |
| **Security** | Input validation, file upload, secret handling, CORS, CSP |
| **Observability** | Log/metric removal, alert change, tracing change |

Each chosen category triggers its checklist in Step 3.

---

## Step 2 — Inherit from impact-map

If `impact-map` exists for this task:
- Every 🔴 High row → must appear in the risk register with explicit mitigation
- Every Tier-3 row → must appear with rollout strategy (versioning, deprecation, mobile fallback)
- Unknown unknowns from impact-map → carry forward as "Unknown — manual verification required"

If impact-map does NOT exist and you're in a 🔴 category — STOP and run `impact-map` first. The risks can't be assessed without knowing the surface.

---

## Step 3 — Apply category checklists

Use the matching checklists below. Each row is `Trigger / Risk / Mitigation`.

### Data (migrations)

| Trigger | Risk | Mitigation |
|---|---|---|
| Adding NOT NULL column | Existing rows have no value → fail | Add as nullable, backfill, then add NOT NULL constraint |
| Dropping a column | App still reads it after deploy | Two-phase: stop reading first, drop after 1 release cycle |
| Changing column type | Data loss on conversion (e.g. `string→int`) | Add new column, dual-write, migrate, drop old |
| Renaming a field | Old documents still have old name | Rolling migration, app reads either name during window |
| Adding unique index | Existing duplicates cause migration failure | Pre-scan for duplicates, dedup, then add index |
| Dropping an index | Hot query falls back to collection scan | Verify no query depends on it (`EXPLAIN`), drop in low-traffic window |
| Backfill > 100k rows | Long-running migration locks table | Batch in chunks, monitor, throttle |
| Deleting documents | Permanent loss if criteria is wrong | Soft-delete first (1 release), then purge |

### Auth

| Trigger | Risk | Mitigation |
|---|---|---|
| Session secret rotation | All current sessions invalidated | Dual-secret window, rotate gradually |
| Token format change | Existing tokens stop working | Versioned tokens (`v2:`), accept v1 during window |
| Permission tightening | Users locked out of features they had | Audit current grantees, communicate, phase rollout |
| Adding MFA | Users without device locked out | Grace period, opt-in first, enforce later |
| OAuth scope change | Existing integrations break | Bump version, run side-by-side |

### Payment

| Trigger | Risk | Mitigation |
|---|---|---|
| Money calculation change | Wrong amounts charged/refunded | Property test against the spec, golden-file regression |
| Currency conversion | Rounding loses cents on aggregate | Use integer cents, never floats; document rounding direction |
| Invoice format | Customer accounting systems break | Versioned invoices, opt-in to new format |
| Retry logic | Double-charge | Idempotency key required, dedupe at PSP boundary |

### API (Tier-3 contract)

| Trigger | Risk | Mitigation |
|---|---|---|
| Removing a field | Old client crashes | Mark deprecated, keep for 2 release cycles, add Sunset header |
| Adding required request field | Old client gets 400 | Make optional first, default-fill server-side |
| Changing status code | Old client error handlers misroute | Add new endpoint version, keep old |
| Mobile client (can't force update) | Permanent fragmentation | Versioned API, server supports oldest in-app version |

### Performance

| Trigger | Risk | Mitigation |
|---|---|---|
| New query in hot path | Latency regression | Benchmark before/after, EXPLAIN, add index if needed |
| N+1 from join replacement | Hidden fan-out | Test with realistic data volume, not 5-row fixtures |
| Adding cache | Stale data window | Bound TTL, invalidate on write, document staleness |
| Removing index | Query hits collection scan | Verify with `EXPLAIN`, no full-scan acceptable on > 10k docs |

### Reliability

| Trigger | Risk | Mitigation |
|---|---|---|
| New cron | Misses run during deploy | Idempotent design, tolerate skipped runs |
| Queue consumer change | Dead-letter buildup | Backward-compatible message format, drain DLQ |
| External API call | Cascading failure on outage | Timeout + retry + circuit breaker + fallback |
| Removing healthcheck | Bad pod stays in rotation | Replacement check exists FIRST |

### Security

| Trigger | Risk | Mitigation |
|---|---|---|
| New user input | Injection (SQL/NoSQL/cmd/XSS) | Parameterized queries, output encoding, allowlist validation |
| File upload | Malicious upload | Type sniffing, size cap, scan, served from separate domain |
| New secret | Leakage in logs/repo | Use secret manager, never `console.log`, scan diffs |
| CORS change | Cross-site attack | Explicit origin allowlist, no `*` with credentials |

### Observability

| Trigger | Risk | Mitigation |
|---|---|---|
| Removing a log line | Loss of investigation breadcrumb | Replace with metric, document why removed |
| Changing alert threshold | Page misses incidents | Run shadow alert for 1 week before flip |
| Tracing change | Distributed traces split | Verify trace propagates end-to-end before merge |

---

## Step 4 — Build the risk register

Append to the requirement doc:

```markdown
## Risk Register ([YYYY-MM-DD])

Categories: [data, payment]
Linked impact-map: yes — 2 🔴 rows carried forward

| # | Risk | Category | Likelihood | Severity | Mitigation | Verification | Must-mitigate before merge? |
|---|------|----------|------------|----------|------------|--------------|------------------------------|
| R1 | Migration adds NOT NULL on 2.3M rows; old rows fail constraint | Data | High | High | 3-phase: nullable → backfill → NOT NULL | `npm run migrate:dry-run` shows 0 violations | Yes |
| R2 | Discount code calc rounds incorrectly | Payment | Med | High | Use integer cents; property test 10k random orders | `discount.property.test.ts` passes | Yes |
| R3 | Removing /v1/orders breaks mobile clients on v3.2.x | API | Med | High | Keep v1 alive 6 weeks; add Sunset header | App store version stats < 1% on v3.2.x | Yes |
| R4 | New aggregation increases p95 latency | Perf | Low | Med | Benchmark before/after; index on (status, createdAt) | k6 load test p95 < 200ms | Yes |
| R5 | Backfill log volume spikes Cloudwatch bill | Cost | Low | Low | Sample logs to 1% during backfill | Manual check post-deploy | No |
```

Likelihood: `Low` (< 10%) / `Med` (10–50%) / `High` (> 50%)
Severity: `Low` (cosmetic) / `Med` (degraded UX) / `High` (data loss / outage / money loss)

**Must-mitigate-before-merge** = Yes if Severity is High OR (Severity = Med AND Likelihood ≥ Med).

---

## Step 5 — Rollback plan (for highest-risk rows)

For every "Must-mitigate-before-merge = Yes" row, write a 1-paragraph rollback:

```markdown
### Rollback — R1 (NOT NULL migration)

If post-deploy errors spike on `orders.discountCode IS NULL`:
1. Run reverse migration: drop NOT NULL constraint (`migrations/0042-revert.sql`)
2. Revert app version to previous tag (3 min via blue-green)
3. Investigate which rows are missing the field, fix backfill script, re-run

Reversibility: full. Data backfilled stays — re-running migration is idempotent.
```

If a row has NO viable rollback (e.g. dropped column, deleted documents) — flag it 🔴🔴 and require sign-off in the 2-option completion (note in summary).

---

## Step 6 — Verification before merge

Each "Must-mitigate" row needs evidence:

| Verification type | Evidence form |
|---|---|
| Migration dry-run | terminal output paste with `0 violations` |
| Property test | test name + green check |
| Load test | k6/artillery output with p95 number |
| EXPLAIN | query plan showing index used |
| Audit / smoke | `/code-review` link or manual check log |

The verification column in the table must be filled BEFORE `/code-review` can approve.

---

## Output

```
risk-register: [task-id]
Categories: [list]
Total risks: [N]   (Must-mitigate: [M])
Rollback plans: [K]   (No-rollback flagged: [N])

Highest-severity row: R[X] — [1-line summary]
Register written: [path to requirement doc, "Risk Register" section]

Next: ensure verification evidence is collected during /implement. /code-review will check it.
```

End with the standard 2-option completion:

```
Next: choose one
A) Request changes — describe what to revise
B) Continue to /implement (with risk register as a guardrail)
```

---

## Anti-patterns

- ❌ Generic risks ("might break things") — every row is specific or it's noise
- ❌ Mitigation = "be careful" — mitigations are concrete (test, gate, phased rollout)
- ❌ Skipping rollback because "we'll figure it out" — that's how outages get worse
- ❌ Marking everything Low/Low to fast-track approval — gaming defeats the purpose
- ❌ Treating risk-register as ceremony — if the task doesn't trigger any category, skip it (per Step 1 rule)

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: write register + rollback plans + 2-option completion
- **Autopilot mode**: emit status line + return. Block (`?` flag) if ANY "Must-mitigate" row has no rollback (orchestrator will batch a yes/no destructive-op-style confirmation)

## Output (autopilot status line — required)

`> risk-register: [N] risks ([M] must-mitigate, [K] no-rollback)  [✓|?]`

Examples:
- `> risk-register: 5 risks (4 must-mitigate, 0 no-rollback)  ✓`
- `> risk-register: 7 risks (5 must-mitigate, 2 no-rollback)  ?`

---

## Why this exists

Without an explicit register, "risk" lives in the engineer's head and gets forgotten under deadline pressure. The categorize → checklist → mitigation → verification → rollback flow forces every dangerous change to declare its downside in writing. `/code-review` can then check evidence rather than relying on reviewer intuition. Pairs with `impact-map` (mechanical surface scan) and `nfr-plan` (forward-looking targets) — together they cover what could go wrong, what's affected, and what success looks like.
