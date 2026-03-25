---
type: moc
tags: [MOC, data]
updated: 2026-03-25
---

# 🗺️ MOC — Data & Databases

> When to open: designing schemas, writing queries, choosing storage solutions, optimizing performance

Your entry point to data-related knowledge. Navigate by task:

## Core Knowledge

- **[[CON-sql-fundamentals]]** — Queries, JOINs, indexes, transactions, anti-patterns
  - When: Writing SQL, debugging slow queries, understanding query plans
  - Key topics: SELECT/WHERE/GROUP BY, JOIN types, window functions, indexes, ACID

- **[[CON-data-modeling]]** — Schema design, normalization, NoSQL patterns
  - When: Designing new schemas, choosing between SQL/NoSQL, star vs snowflake schemas
  - Key topics: ER diagrams, 1NF-3NF, denormalization, document vs key-value vs graph

## Related Concepts

- **[[CON-database-patterns]]** — Caching, replication, sharding (when added)
  - When: Scaling database, handling duplicates, improving read performance

- **[[CON-scalability-patterns]]** — Partitioning, horizontal growth, distribution (when added)
  - When: Database reaches limits, need to split data, multi-region setup

- **[[CON-caching-strategies]]** — Cache types, TTL, invalidation (when added)
  - When: Optimizing query performance, reducing DB load

- **[[CON-backend-layers]]** — Architecture, persistence layer patterns (when added)
  - When: Structuring your data access layer, repository patterns

## Quick Reference

### Choosing Your Database

| Need | Best Fit | Concept |
|------|----------|---------|
| Structured, relational data | PostgreSQL, MySQL | [[CON-data-modeling]] + [[CON-sql-fundamentals]] |
| Flexible schema, documents | MongoDB | [[CON-data-modeling]] (Document section) |
| Real-time counters, sessions | Redis | [[CON-data-modeling]] (Key-Value section) |
| Time-series, write-heavy | Cassandra | [[CON-data-modeling]] (Wide-Column section) |
| Complex relationships | Neo4j | [[CON-data-modeling]] (Graph section) |

### Design Workflow

1. **Understand your access patterns** → [[CON-data-modeling]]
2. **Design ER diagram** → [[CON-data-modeling]] (ER section)
3. **Normalize to 3NF** → [[CON-data-modeling]] (Normalization)
4. **Plan for denormalization** → [[CON-data-modeling]] (Denormalization)
5. **Write efficient queries** → [[CON-sql-fundamentals]]
6. **Index strategically** → [[CON-sql-fundamentals]] (Indexes)
7. **Profile with EXPLAIN** → [[CON-sql-fundamentals]] (EXPLAIN)

### Performance Checklist

- [ ] EXPLAIN ANALYZE shows index scans, not seq scans
- [ ] No N+1 queries → use JOINs
- [ ] Queries have LIMIT on WHERE
- [ ] Composite indexes for multi-column filters
- [ ] Window functions instead of expensive GROUP BY
- [ ] Denormalize only where measured beneficial
- [ ] Archive old data (separate from hot data)

## Next Steps

- **Writing a query?** → Start at [[CON-sql-fundamentals]]
- **Designing new schema?** → Start at [[CON-data-modeling]]
- **Performance problem?** → [[CON-sql-fundamentals]] (EXPLAIN section)
- **Choosing a database?** → [[CON-data-modeling]] (comparison table)
- **Need caching?** → (future) [[CON-caching-strategies]]
- **Scaling the DB?** → (future) [[CON-scalability-patterns]]
