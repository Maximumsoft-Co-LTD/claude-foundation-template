---
type: concept
tags: [data, SQL, database, query, joins, indexes, transactions]
related: [CON-database-patterns, CON-data-modeling, CON-backend-layers]
updated: 2026-03-25
---

# SQL Fundamentals

Core SQL operations, query patterns, and performance considerations.

## Query Fundamentals

### SELECT / WHERE / GROUP BY / HAVING / ORDER BY / LIMIT

```sql
SELECT column1, COUNT(*) as cnt
FROM table_name
WHERE column2 > 100
GROUP BY column1
HAVING COUNT(*) > 5
ORDER BY cnt DESC
LIMIT 10;
```

- **SELECT**: specify columns; use `*` only for exploration, never production
- **WHERE**: filters rows before aggregation
- **GROUP BY**: groups rows; all non-aggregated columns must be in GROUP BY
- **HAVING**: filters groups after aggregation (WHERE filters rows, HAVING filters groups)
- **ORDER BY**: sort results; specify ASC/DESC
- **LIMIT**: restrict result count; always pair with ORDER BY for deterministic results

## JOIN Types

Visual comparison of join types:

```
Table A (ID: 1,2,3)     Table B (ID: 2,3,4)

INNER JOIN (A ∩ B)
└─ Result: 2, 3

LEFT JOIN (A ∪ (A ∩ B))
└─ Result: 1, 2, 3 (B cols NULL for 1)

RIGHT JOIN ((A ∩ B) ∪ B)
└─ Result: 2, 3, 4 (A cols NULL for 4)

FULL OUTER JOIN (A ∪ B)
└─ Result: 1, 2, 3, 4 (cols NULL as needed)
```

```sql
-- INNER JOIN: both tables have match
SELECT a.id, b.name
FROM table_a a
INNER JOIN table_b b ON a.id = b.a_id;

-- LEFT JOIN: all from left, matched from right
SELECT a.id, b.name
FROM table_a a
LEFT JOIN table_b b ON a.id = b.a_id;

-- Full outer join (not all DBs support directly)
SELECT a.id, b.name
FROM table_a a
FULL OUTER JOIN table_b b ON a.id = b.a_id;
```

## Subqueries vs CTEs

| Aspect | Subquery | CTE (WITH) |
|--------|----------|-----------|
| Readability | Nested, hard to follow | Linear, top-to-bottom |
| Reusability | Repeat definition | Reference by name |
| Performance | Same | Same, but optimizer handles better |
| Debugging | Harder | Easier (test CTE independently) |
| Recursion | Not supported | Supported |

```sql
-- Subquery
SELECT user_id, (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as order_count
FROM users u;

-- CTE (cleaner)
WITH user_orders AS (
  SELECT user_id, COUNT(*) as order_count
  FROM orders
  GROUP BY user_id
)
SELECT u.id, uo.order_count
FROM users u
LEFT JOIN user_orders uo ON u.id = uo.user_id;
```

**Preference**: Use CTEs for clarity; use subqueries in SELECT only when simple.

## Window Functions

Powerful for analytics without GROUP BY aggregation:

```sql
SELECT
  id,
  amount,
  ROW_NUMBER() OVER (ORDER BY amount DESC) as rank_simple,
  RANK() OVER (ORDER BY amount DESC) as rank_with_ties,
  SUM(amount) OVER (ORDER BY id ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) as running_sum,
  LAG(amount) OVER (ORDER BY id) as prev_amount,
  LEAD(amount) OVER (ORDER BY id) as next_amount
FROM transactions;
```

- **ROW_NUMBER()**: unique rank (1,2,3,4)
- **RANK()**: gaps on ties (1,2,2,4)
- **DENSE_RANK()**: no gaps on ties (1,2,2,3)
- **SUM/AVG/COUNT OVER (PARTITION BY... ORDER BY...)**: running aggregates
- **LAG/LEAD**: access previous/next row values
- **PARTITION BY**: reset window per group

## Index Types

| Type | Use Case | Pros | Cons |
|------|----------|------|------|
| B-Tree | General purpose, range queries | Fast exact match, range, sorting | Slower for full-text |
| Hash | Exact match only | O(1) lookup | Can't do range; no ORDER BY |
| Composite | Multi-column filter/sort | Single index for multiple columns | Order matters; leftmost must be used |
| Partial | Conditional rows | Smaller, fewer duplicates | Not used for full table scans |
| Full-Text | Text search | Fast substring matching | Schema-specific |

```sql
-- B-Tree (default)
CREATE INDEX idx_user_email ON users(email);

-- Composite (filter by status, sort by created)
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);

-- Partial (only active users)
CREATE INDEX idx_active_users ON users(id) WHERE is_active = true;
```

## EXPLAIN / Query Plans

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

Key metrics:
- **Seq Scan**: full table scan (slow)
- **Index Scan**: index lookup (good)
- **Bitmap Index Scan**: partial index scan
- **Rows**: estimated vs actual (big gap = plan is wrong)
- **Time**: startup + total cost

**Action**: If Seq Scan with millions of rows, add an index. If actual rows >> estimated, update table statistics.

## Transactions

### ACID Properties

- **Atomicity**: all-or-nothing execution
- **Consistency**: enforces constraints
- **Isolation**: concurrent transactions don't interfere
- **Durability**: committed data survives crashes

### Isolation Levels (weakest → strongest)

| Level | Dirty Read | Non-Repeatable Read | Phantom | Deadlock Risk |
|-------|-----------|-------------------|---------|---------------|
| Read Uncommitted | ✓ | ✓ | ✓ | Low |
| Read Committed | ✗ | ✓ | ✓ | Low |
| Repeatable Read | ✗ | ✗ | ✓ | Medium |
| Serializable | ✗ | ✗ | ✗ | High |

**Default (Read Committed)**: safe for most apps. Upgrade only if needed.

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT; -- all-or-nothing
```

### Deadlocks

Occur when transactions lock each other's resources:

```sql
-- Transaction A
UPDATE users SET balance = balance - 100 WHERE id = 1;
UPDATE users SET balance = balance + 100 WHERE id = 2; -- waits for B

-- Transaction B (concurrent)
UPDATE users SET balance = balance - 100 WHERE id = 2;
UPDATE users SET balance = balance + 100 WHERE id = 1; -- waits for A
-- ⚠️ DEADLOCK
```

**Prevention**: Always acquire locks in the same order.

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|---|---|---|
| **SELECT \*** | Fetches unused columns; breaks on schema changes | Specify columns |
| **N+1 Queries** | SELECT user; then loop SELECT posts WHERE user_id=? | Use JOIN or batch query |
| **Missing Indexes** | Full table scans for every query | EXPLAIN ANALYZE, add index |
| **Implicit Type Casting** | WHERE user_id = '123' (string vs int) | Cast explicitly or use correct type |
| **No LIMIT on scans** | Can fetch millions of rows | Always LIMIT in WHERE clause |
| **SELECT in loop** | Performance killer | Use JOIN or batch |

## Practical Guidelines

1. **Always profile**: EXPLAIN ANALYZE before tuning
2. **Index strategically**: B-Tree for equality/range, composite for common filters
3. **Use CTEs**: make queries readable and maintainable
4. **Partition by**: for huge tables (e.g., timeseries)
5. **Batch inserts**: multi-row INSERT for bulk operations
6. **Archive old data**: don't query historical rows with active data

## See Also

- [[CON-data-modeling]] — schema design
- [[CON-database-patterns]] — caching, partitioning
- [[CON-scalability-patterns]] — handling growth
