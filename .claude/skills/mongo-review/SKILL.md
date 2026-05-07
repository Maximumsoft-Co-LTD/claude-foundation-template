---
description: Review MongoDB queries, aggregations, indexes, and schema changes before ship — catches missing indexes, unanchored regex, $lookup pitfalls, large $in, projection leaks
allowed-tools: Read, Grep, Glob, Bash(grep:*), Bash(mongosh:*), Bash(git diff:*)
disable-model-invocation: false
---

# mongo-review

Workflow position: **invoked from /code-review and /implement (whenever the diff touches Mongo) — blocks ship on critical issues**

Stack-specific: MongoDB. Catches the 80% of Mongo bugs before they reach prod (missing index, wrong $regex, leaky projection, schema drift).

Arguments: `[task-id]` or `[file glob]`

---

## When to invoke

- `/code-review` step where diff touches `*.go` / `*.ts` / `*.py` files containing `mongo`, `Collection`, `find`, `aggregate`, `$lookup`, etc.
- `/implement` after writing a new query (before slice's done gate)
- New index migration script

Skip:
- Diff doesn't touch Mongo code
- Pure schema doc — no executable change

---

## Step 1 — Find the surface

```bash
# In the diff
git diff main...HEAD -- '*.go' '*.ts' '*.js' '*.py' | grep -nE 'collection|Find|Aggregate|\$lookup|\$regex|InsertOne|UpdateMany|createIndex|deleteMany'
```

Or for a specific file glob:

```bash
grep -rnE 'db\.[a-zA-Z]+\.(find|aggregate|insertOne|updateMany|deleteMany|createIndex)' [glob]
```

List every query, aggregation, and index touched. Each gets a row in Step 2.

---

## Step 2 — Per-query review

For each query, fill this row:

```
### Query [N] — [file:line]

Operation:    [find / findOne / aggregate / update / delete / createIndex]
Collection:   [name]
Filter:       [the filter doc]
Projection:   [projection or "none — RED FLAG"]
Sort:         [sort or "none"]
Limit:        [N or "none — RED FLAG for unbounded"]
Index used:   [predicted index name OR "COLLSCAN — RED FLAG"]
```

Run `explain()` if dev DB available:

```bash
mongosh "$MONGO_URI" --eval 'db.things.find({...}).explain("executionStats")' | jq '.executionStats.executionStages.stage'
```

`COLLSCAN` at top level → critical issue.

---

## Step 3 — Apply the checklist

Run every line. Mark FAIL/PASS/N-A.

### Filter & Index
- [ ] Every field in `filter` is the **prefix** of an existing index, OR a new index is added in this PR
- [ ] No `$regex` without `^` anchor (unanchored regex = collection scan on huge data)
- [ ] No `$ne`, `$nin`, `$not` on indexed fields without explanation (these can't use index efficiently)
- [ ] No `$in` with > 100 values (split into chunks or paginate differently)

### Projection
- [ ] Every read query has an explicit projection (no `find({...})` without 2nd arg returning everything)
- [ ] Sensitive fields excluded: `passwordHash`, `apiSecret`, `__v`, internal `_audit.*`
- [ ] `_id` returned as string in API responses (not raw ObjectId leaking BSON serialization)

### Aggregation
- [ ] `$match` is the **first stage** (uses index; later $match cannot)
- [ ] `$lookup` only on indexed `foreignField`
- [ ] `$lookup` not done in a hot path with > 1000 docs (consider denormalizing or doing 2 round trips)
- [ ] No `$group` without preceding `$match` to bound the input set
- [ ] `$sort` either before `$limit` (efficient) or has supporting index

### Writes
- [ ] `updateMany` / `deleteMany` filter is specific (not `{}` unless intentional)
- [ ] Schema validation rules applied at the collection level (`db.runCommand({collMod, validator})`) when shape matters
- [ ] Audit fields (`updatedAt`, `updatedBy`) set inside `$set`
- [ ] Writes that need atomicity with another operation are inside a session/transaction (per PAT-008 audit-in-transaction)

### Indexes
- [ ] New index added → migration script committed in this PR
- [ ] Index is created with `{background: true}` for prod safety (irrelevant for fresh collections)
- [ ] Compound index field order: equality → sort → range (Mongo's ESR rule)
- [ ] No redundant indexes (e.g. `{a:1}` already covered by `{a:1, b:1}` prefix)
- [ ] TTL field has a TTL index if docs should expire

### Schema drift
- [ ] All fields read in code are written somewhere (no read of field never written)
- [ ] All fields written are documented in the contract / type definition
- [ ] `null` vs missing handled consistently — code doesn't assume missing if some docs have `null`

### Cursor / pagination
- [ ] No `skip()` for pagination beyond page 100 (use cursor-based with `_id`)
- [ ] Cursor query has `_id` in sort to ensure stable ordering
- [ ] `limit()` always set on read queries that could return arbitrary count

---

## Step 4 — Severity triage

Group findings:

| Severity | Definition | Action |
|---|---|---|
| **CRITICAL** | COLLSCAN on prod-sized collection / sensitive field leak / unbounded write | BLOCK ship. Must fix in this PR. |
| **HIGH** | Missing index on warm path / `$lookup` without index / no projection on hot read | Fix in this PR strongly recommended. |
| **MEDIUM** | Inefficient compound order / $skip on large data | Open follow-up issue. Don't block. |
| **LOW** | Style / naming / minor optimizability | Mention in review. |

---

## Step 5 — Suggest fixes

For each CRITICAL and HIGH, provide a concrete fix:

```
### Finding: COLLSCAN on `things.find({createdBy: X})`
Severity: CRITICAL
Fix:
  Add index in migrations/2026-05-06-things-createdBy.js:
    db.things.createIndex({createdBy: 1, createdAt: -1}, {background: true});
  Reason: query pattern is "user's things, newest first" — ESR compound.
```

---

## Step 6 — Output

```
mongo-review: [task-id]
Queries reviewed: [N]
Indexes touched: [N]

Findings:
  CRITICAL: [N]   ← MUST FIX
  HIGH:     [N]
  MEDIUM:   [N]
  LOW:      [N]

[paste each CRITICAL/HIGH with fix]

Verdict: BLOCK / PASS-WITH-FOLLOW-UP / PASS
Next:
  BLOCK → fix CRITICALs, re-run mongo-review
  PASS  → /code-review or /git-commit
```

---

## Step 7 — Capture if pattern emerges

If the same finding keeps appearing across tasks (e.g. "everyone forgets projection"):

```
Invoke Skill("brain-capture") with type=LES, source=from-review.
```

So the lesson is enforced before code, not after review.

---

## Anti-patterns

- ❌ Reviewing only the diff hunk and missing the surrounding query context
- ❌ Approving COLLSCAN with "it's a small collection" — it grows
- ❌ Skipping `explain()` because "it looks fine"
- ❌ Adding indexes without removing redundant ones (index bloat slows writes)

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: full findings + 2-option completion.
- **Autopilot mode**: emit status line. **CRITICAL findings are a block condition** (emit `✗`); HIGH = flag `?` for user decision; MEDIUM/LOW = proceed silently with note in audit.

## Output (autopilot status line — required)

`> mongo-review: [N crit] [N high] [N med]  [✓|?|✗]`

Examples:
- `> mongo-review: 0 crit, 0 high, 1 med  ✓`
- `> mongo-review: 1 CRIT (COLLSCAN on things.find)  ✗`

---

## Why this exists

Mongo failures rarely show in dev (small data, no contention). They show in prod at the worst time. This skill front-loads the explain-plan / index / projection check into review, where it's cheap to fix.
