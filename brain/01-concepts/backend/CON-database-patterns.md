---
type: concept
tags: [backend, database, SQL, ORM, migrations, indexing, transactions]
related: [CON-backend-layers, CON-caching-strategies]
updated: 2026-03-25
---

# Database Patterns

## Core Rules

```
✅ Always name columns explicitly (never SELECT *)
✅ Migrations must be backward-compatible
✅ Integration tests use real test DB
✅ Wrap related changes in transactions
✅ Index foreign keys + frequently queried columns
✅ Seed test data separately from production migrations
```

## Migration Best Practices

```
Backward-compatible migrations (safe to deploy without downtime):
  ✅ ADD COLUMN nullable      ← no breaking change
  ✅ ADD INDEX                ← non-blocking (use CONCURRENTLY in Postgres)
  ✅ CREATE TABLE             ← additive
  ✅ Rename: add new column, migrate data, drop old column (3 deploys)

❌ Dangerous (require downtime or careful planning):
  DROP COLUMN        ← remove old code first, then drop
  RENAME COLUMN      ← break existing code immediately
  ALTER COLUMN type  ← can fail if data doesn't fit
  ADD NOT NULL       ← fails if existing rows have null
```

## Indexing Strategy

```
Always index:
  - Primary keys (auto)
  - Foreign keys (e.g., user_id in orders table)
  - Columns in WHERE clauses (frequent filters)
  - Columns in ORDER BY (for pagination)
  - Columns in JOIN conditions

Composite index order matters:
  INDEX (user_id, created_at)  ← good for: WHERE user_id=X ORDER BY created_at
  INDEX (created_at, user_id)  ← NOT good for: WHERE user_id=X ORDER BY created_at
```

## N+1 Query Problem

```
❌ N+1:
  users = User.all()                    # 1 query
  for user in users:
    print(user.orders.count())          # N queries (one per user)

✅ Eager loading:
  users = User.all().prefetch_related('orders')  # 2 queries total
  # Or: JOIN in single query
```

## Transaction Patterns

```sql
-- Wrap related operations
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
  INSERT INTO transactions (from_id, to_id, amount) VALUES (1, 2, 100);
COMMIT;
-- If any fails → ROLLBACK automatically
```

**Isolation levels:**
- READ COMMITTED (default Postgres) — most apps OK
- REPEATABLE READ — prevents phantom reads
- SERIALIZABLE — strictest, highest contention

## Soft Delete Pattern

```sql
-- Instead of DELETE, mark as deleted
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;

-- Always filter:
SELECT * FROM users WHERE deleted_at IS NULL;

-- "Delete":
UPDATE users SET deleted_at = NOW() WHERE id = ?;
```

**Pros:** Audit trail, recoverable
**Cons:** Tables grow large, must remember WHERE deleted_at IS NULL

## Related

- [[CON-backend-layers]] — repository is where queries live
- [[CON-caching-strategies]] — cache reduces DB load
- [[../../../00-MOC/MOC-Backend]]
