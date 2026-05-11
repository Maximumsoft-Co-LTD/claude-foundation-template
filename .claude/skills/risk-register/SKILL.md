---
name: risk-register
description: Enumerate risks (data loss, regression, security, performance, reliability) before implementing — stack-aware checklists with mitigation + rollback plan, especially for migrations, auth, and payment changes
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git log:*), Bash(git diff:*)
---

# risk-register

**Workflow position: inside `/implement` Step 0 (after slicing, before first slice) and `/code-review` Step 4 (before approving) — produces the risk table that makes "what could go wrong" explicit and addressable.**

Different from `impact-map`:
- `impact-map` = WHAT existing code/contracts get touched (mechanical)
- `risk-register` = WHAT could go wrong + how to prevent + how to recover (judgement)

Different from `nfr-plan`:
- `nfr-plan` = forward-looking targets (latency p95 < 200ms)
- `risk-register` = downside-looking failures (what if migration partially fails)

**Must-mitigate-before-merge rule:** Any risk row with `Severity = High` AND no rollback plan OR `Severity = High + data-loss tier` blocks merge. `/code-review` treats an unfilled rollback for a High-severity row as an automatic Critical finding.

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
- Impact-map has any High or Tier-3 row
- The task touches > 5 files or > 200 LOC
- The change is a refactor of shared utility code

Skip:
- UI-only changes with no behavior shift
- Test-only changes
- Doc / config-comment changes

---

## Step 0 — Search existing risk section

Before building a new register, check whether one already exists in the requirement doc:

```bash
rg -n "^## Risk Register" docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md
```

Three outcomes:
- **Nothing found** → continue to Step 1.
- **Section exists** → diff the existing rows against the current categories (Step 1). Add new rows for any newly-triggered categories; do NOT overwrite existing mitigations.
- **Section exists but categories changed materially** → annotate changed rows with `[updated YYYY-MM-DD]` and re-run rollback planning for altered High-severity rows.

Why: a risk register written at `/implement` start should survive into `/code-review` without being clobbered by a re-run.

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

Each chosen category triggers its checklist. For per-category prompts, read `references/category-checklists.md`.

---

## Step 2 — Inherit from impact-map

If `impact-map` exists for this task:
- Every High row → must appear in the risk register with explicit mitigation
- Every Tier-3 row → must appear with rollout strategy (versioning, deprecation, mobile fallback)
- Unknown unknowns from impact-map → carry forward as "Unknown — manual verification required"

If impact-map does NOT exist and you're in a required category — STOP and run `impact-map` first. The risks can't be assessed without knowing the surface.

---

## Step 3 — Apply category checklists

Using the prompts in `references/category-checklists.md`, fill one row per identified risk. Build the register in Step 4.

---

## Step 4 — Build the risk register

Append to the requirement doc:

```markdown
## Risk Register ([YYYY-MM-DD])

Categories: [data, payment]
Linked impact-map: yes — 2 High rows carried forward

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

If a row has NO viable rollback (e.g. dropped column, deleted documents) — flag it with double-red and require sign-off in the 2-option completion (note in summary).

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

## Output (manual mode)

```
risk-register: [task-id]
Categories: [list]
Total risks: [N]   (Must-mitigate: [M])
Rollback plans: [K]   (No-rollback flagged: [N])

Highest-severity row: R[X] — [1-line summary]
Register written: [path to requirement doc, "Risk Register" section]
```

Then end with the standard 2-option completion message per `.claude/rules/completion-format.md`:

```
Next: choose one
A) Request changes — describe what to revise
B) Continue to /implement (with risk register as a guardrail)
```

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: write register + rollback plans + 2-option completion.
- **Autopilot mode**: emit status line + return. Block (`?` flag) if ANY "Must-mitigate" row has no rollback — orchestrator will batch a yes/no destructive-op-style confirmation.

### Output (autopilot status line — required)

`> risk-register: [N] risks ([M] must-mitigate, [K] no-rollback)  [✓|?]`

Examples:
- `> risk-register: 5 risks (4 must-mitigate, 0 no-rollback)  ✓`
- `> risk-register: 7 risks (5 must-mitigate, 2 no-rollback)  ?`

---

## Anti-patterns

- ❌ Generic risks ("might break things") — every row is specific or it's noise
- ❌ Mitigation = "be careful" — mitigations are concrete (test, gate, phased rollout)
- ❌ Skipping rollback because "we'll figure it out" — that's how outages get worse
- ❌ Marking everything Low/Low to fast-track approval — gaming defeats the purpose
- ❌ Treating risk-register as ceremony — if the task doesn't trigger any category, skip it (per Step 1 rule)

---

## Why this exists

Without an explicit register, "risk" lives in the engineer's head and gets forgotten under deadline pressure. The categorize → checklist → mitigation → verification → rollback flow forces every dangerous change to declare its downside in writing. `/code-review` can then check evidence rather than relying on reviewer intuition. Pairs with `impact-map` (mechanical surface scan) and `nfr-plan` (forward-looking targets) — together they cover what could go wrong, what's affected, and what success looks like.
