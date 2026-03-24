---
name: sql_param_style
description: Use anonymous ? parameters in D1 SQL queries (not ?1/?2 numbered) for better-sqlite3 shim compatibility
type: feedback
---

Always use `?` (anonymous positional) bind parameters in SQL queries, not `?1`/`?2` (numbered/indexed).

**Why:** Cloudflare D1 supports both forms, but better-sqlite3 (used via makeD1Shim in tests) may behave inconsistently when numbered params are spread via stmt.all(...params). Anonymous `?` params work reliably in both environments.

**How to apply:**
- SQL: `WHERE a.activity_date >= ? AND a.activity_date <= ?`
- Not: `WHERE a.activity_date >= ?1 AND a.activity_date <= ?2`
- bind() call is the same: `.bind(weekStartEpoch, weekEndEpoch)` — positional order matches
