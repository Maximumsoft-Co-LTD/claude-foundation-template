---
type: concept
tags: [database, indexing, performance, fundamentals]
related: [CON-sql-fundamentals, CON-database-types, CON-database-patterns]
updated: 2026-04-29
source: template
---

# Database Indexing

## Core idea

An **index** is a separate data structure that lets the database find rows by value without scanning the whole table. The right index turns a 10-second query into a 10-millisecond one.

The right indexes are also among the most expensive things in a system to figure out wrong. An index everyone forgot about can slow writes by 30%; a missing index can take a service down at 3am.

## How indexes work (the mental model)

A table without an index is a stack of rows on disk. To find `WHERE email = 'x'`, the DB scans every row.

An index is a **sorted lookup structure** — typically a B-tree — that maps `email → row pointer`. Lookup is `O(log n)` instead of `O(n)`.

```
Table (rows on disk)               Index (sorted by email)
┌───┬──────────┬─────────┐         ┌────────────────┬──────┐
│ 1 │ b@a.com  │ Bob     │         │ a@a.com        │ →7   │
│ 2 │ d@a.com  │ Dan     │         │ b@a.com        │ →1   │
│ 3 │ z@a.com  │ Zoe     │         │ c@a.com        │ →5   │
│ ... 1M rows ...        │         │ ... sorted ... │      │
└───┴──────────┴─────────┘         └────────────────┴──────┘
```

## Index types (Postgres-flavored, but apply broadly)

### B-tree — the default
**90% of indexes are B-tree.** Supports `=`, `<`, `>`, `<=`, `>=`, `BETWEEN`, `IN`, `LIKE 'prefix%'`, `ORDER BY`.

```sql
CREATE INDEX idx_users_email ON users(email);
```

**Use for:** primary keys, foreign keys, anything compared with `=` or range, sortable columns.

### Hash — equality only
Stores `hash(value) → row pointer`. **Equality only** (no `<`, `>`, no range).

```sql
CREATE INDEX idx_sessions_token ON sessions USING HASH(token);
```

**Use for:** very rarely. B-tree is almost always good enough for equality, and B-tree also gives you range. Pick hash only when you've benchmarked and confirmed the savings.

### GIN — multi-value columns
**Generalized Inverted Index.** For columns that contain multiple values per row.

```sql
CREATE INDEX idx_tags ON posts USING GIN(tags);            -- array
CREATE INDEX idx_doc ON posts USING GIN(to_tsvector(body));-- full-text search
CREATE INDEX idx_meta ON posts USING GIN(metadata);        -- JSONB
```

**Use for:** arrays, JSONB documents, full-text search vectors.
**Trade-off:** writes are slower than B-tree (more pages to update); index is bigger.

### BRIN — block range index
**Block Range INdex.** Stores summary (min/max) per block range — tiny indexes for huge tables.

```sql
CREATE INDEX idx_logs_ts ON logs USING BRIN(ts);
```

**Use for:** append-only time-series tables, hundreds of millions of rows, where the data is **physically ordered** by the indexed column (because you only ever insert chronologically).

**Trade-off:** very approximate. Reads still re-scan the matching block range. Useless if data isn't physically ordered.

### GiST / SP-GiST — spatial / overlapping data
For geometry, ranges, and other "overlap" queries (PostGIS, range types).

```sql
CREATE INDEX idx_locations ON places USING GIST(geom);
```

### Specialized: Bloom, vector (pgvector), etc.
For specific access patterns. Use when measured.

## Composite (multi-column) indexes

```sql
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
```

This index helps:
- `WHERE user_id = X` ✅ (uses leading column)
- `WHERE user_id = X AND created_at > '2026-01-01'` ✅ (uses both)
- `WHERE created_at > '2026-01-01'` ❌ (skips leading column — no help)

**The leftmost-prefix rule:** a composite index helps queries that filter on a leading prefix of the columns.

**Order matters:** put the highest-cardinality, most-selective column **first**. `(user_id, status)` is usually better than `(status, user_id)` if `user_id` distinguishes more.

## Covering indexes — index-only scans

If the index itself contains all the columns the query needs, the DB can answer **without touching the table**.

```sql
-- Query
SELECT user_id, status FROM orders WHERE user_id = 7;

-- Covering index
CREATE INDEX idx_orders_user_status ON orders(user_id) INCLUDE (status);
```

The `INCLUDE` clause adds `status` to the leaf nodes without making it a key column. The query is satisfied entirely from the index.

**When to use:** hot read queries. Trade-off: bigger index, slower writes.

## Partial indexes — only some rows

```sql
CREATE INDEX idx_active_users ON users(email) WHERE deleted_at IS NULL;
```

Index only the rows you actually query for. Smaller, faster, less write overhead.

**Common uses:**
- "Active" rows in a soft-delete table
- "Pending" rows in a status column
- Rows from a specific tenant in a multi-tenant DB

## Functional / expression indexes

Index the result of an expression, not a raw column.

```sql
CREATE INDEX idx_lower_email ON users(LOWER(email));
-- Now: WHERE LOWER(email) = 'x@a.com' uses the index
```

**Use:** case-insensitive search, computed values queried often.

## When indexes hurt

Indexes are NOT free. Every index:
- Slows down `INSERT`, `UPDATE`, `DELETE` (each modification updates each affected index)
- Consumes disk space
- Increases planner complexity (the planner considers more options)

**Symptom of over-indexing:** writes are slow; bulk inserts crawl; the table has 10+ indexes most of which are unused.

**Detect unused indexes (Postgres):**
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;  -- never scanned
```

## Index design checklist

For each query that will run frequently:

1. What's in `WHERE`? → leftmost columns of an index
2. What's in `ORDER BY`? → can the index also satisfy the sort?
3. What columns are returned? → could `INCLUDE` make it covering?
4. Are some rows filtered out? → partial index?
5. Is the access pattern equality, range, or both? → B-tree handles both
6. Is the column high-cardinality (good index) or low (hash distribution barely better than scan)?

## Read the query plan

The DB tells you what it's doing. Always check `EXPLAIN ANALYZE` before assuming an index is being used.

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 7;
```

Look for:
- `Index Scan` ✅
- `Index Only Scan` ✅✅ (covering)
- `Bitmap Index Scan` ✅ (multiple matches)
- `Seq Scan` on a big table ❌ (missing index, or planner chose not to use one)

**Common cause of unused index:** type mismatch (`WHERE id = '7'` against integer `id`), function around column (`WHERE LOWER(email) = ...` without functional index), or `OR` across non-indexed columns.

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| **Index on every column** | Writes crawl, disk full | Index queries, not columns |
| **No index on FK** | Cascading deletes are O(n²) | Always index FKs |
| **Wrong column order in composite** | Query does `Seq Scan` despite index | Reorder by query pattern |
| **Hash index in 2026** | Loses range queries for nothing | Use B-tree |
| **GIN on a column queried with `=`** | Slower than B-tree | Use B-tree |
| **No `EXPLAIN`** | "We added an index but it's still slow" | Read the plan |

## Indexing for the workload

Different DBs need different strategies:

| DB | Default index | Specialized |
|----|---------------|-------------|
| **PostgreSQL** | B-tree | GIN (JSONB, FTS), BRIN (time-series), GiST (spatial), pgvector |
| **MySQL** | B+tree | FULLTEXT, spatial |
| **MongoDB** | B-tree | Compound, multikey (arrays), text, geospatial |
| **Cassandra** | Partition key built-in | Secondary indexes (use carefully — distributed) |
| **DynamoDB** | Partition + sort key | GSI / LSI |

## Related

- [[CON-sql-fundamentals]] — how queries actually use indexes
- [[CON-database-types]] — index choice depends on DB type
- [[../backend/CON-database-patterns]] — N+1 prevention often = right index
- [[CON-replication-sharding]] — shard key is itself an index decision
