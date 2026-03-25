---
description: Review database schema and migrations before implementation — catch design issues early
allowed-tools: Read, Grep, Bash(git diff *)
disable-model-invocation: false
---

# /db-schema-review
Workflow position: **/be-design → START → /implement**

Review the database schema design from the BE design doc before any code is written. Catches structural issues, naming problems, missing indexes, and migration risks while the cost to fix is zero.
Arguments: `[task-id]`  — e.g. `SP1-T002`

---

## Step 1 — Load context

Parse `[task-id]`, extract `[sprint-id]`.

Read `docs/sprints/[sprint-id]/[task-id]/[task-id]-backend.md`:
- Data Models / Schema section
- Migration plan (if present)
- API contracts (to cross-check field names)

If no schema section found → print `✓ No schema changes in design — db-schema-review skipped.` and exit.

Also scan for existing migration files:
```bash
# Common migration locations
find . -path "*/migrations/*.sql" -o -path "*/migrations/*.ts" -o \
       -path "*/db/migrate/*.rb" -o -name "*.migration.ts" \
       | grep -v node_modules | head -20
```

---

## Step 2 — Naming conventions

| Check | Rule |
|-------|------|
| Table names | `snake_case`, plural nouns (`users`, `order_items`) |
| Column names | `snake_case` (`created_at`, `user_id`) |
| Primary keys | Named `id` (or `[table]_id` for composite clarity) |
| Foreign keys | Named `[referenced_table_singular]_id` (e.g. `user_id` → `users.id`) |
| Boolean columns | Prefixed `is_`, `has_`, or `can_` (`is_active`, `has_verified_email`) |
| Timestamp columns | `created_at`, `updated_at` — present on every entity table |
| Junction tables | Named `[table_a]_[table_b]` alphabetically (`post_tags`, not `tag_posts`) |

Flag any violations with suggested rename.

---

## Step 3 — Structural design review

**Normalization**
- Repeated groups in a single row? → likely needs a child table
- Comma-separated values in a column? → needs a junction table
- Same data duplicated across tables without a FK? → denormalized — justify or normalize

**Primary keys**
- UUID vs auto-increment: consistent with existing tables?
- Composite PKs documented with reason?

**Nullable columns**
- Every `NULL`able column has a documented reason
- Fields that are logically required are `NOT NULL`

**Column types**
- Money/currency: `DECIMAL(precision, scale)` or integer cents — never `FLOAT`
- Dates with timezone: `TIMESTAMPTZ` (Postgres) / `DATETIME` with explicit UTC — not naive `DATE` for cross-TZ data
- Enums: stored as `VARCHAR` with a check constraint, or a proper enum type — not magic integers
- Large text: `TEXT` not `VARCHAR(255)` as default for unbounded strings

---

## Step 4 — Index review

For each table in the schema:

| Check | Flag if missing |
|-------|----------------|
| FK columns | Index on every foreign key column |
| Query filters | Columns used in `WHERE` clauses (per API spec) have index |
| Unique constraints | Columns that must be unique have `UNIQUE` index, not just app-level check |
| Composite indexes | Column order matches query patterns (most selective first) |
| Over-indexing | More than 6–8 indexes on a write-heavy table — flag for discussion |

---

## Step 5 — Migration safety

If a migration plan is included in the design:

| Check | Risk |
|-------|------|
| `DROP COLUMN` | Is the column still referenced in code? |
| `NOT NULL` addition | Does existing data satisfy the constraint? Need backfill? |
| Column rename | Will break queries not updated in same deploy — requires two-phase migration |
| Table rename | Same risk as column rename |
| Adding index without `CONCURRENTLY` | Locks table on Postgres — use `CREATE INDEX CONCURRENTLY` |
| Default value change | May require table rewrite — check row count |
| Type change | `VARCHAR → TEXT` is safe; `INT → BIGINT` may not be online-safe |

Flag BREAKING changes that require a coordinated deploy or data backfill.

---

## Step 6 — Cross-check with API contract

From the BE design doc's API contracts, verify:
- Every field name the FE expects matches a column name in the schema (or a computed alias)
- Response shapes that return nested objects map to actual JOIN relationships
- Paginated endpoints have indexes that support efficient `LIMIT/OFFSET` or cursor queries

---

## Step 7 — Write schema review report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DB Schema Review: [task-id] — [Task Title]
Result: APPROVED / CHANGES REQUESTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Critical (fix before implement):
  ☐ [table.column] — [issue + suggested fix]

Advisory (discuss):
  • [observation]

Migration risk:
  ⚠ [change] — [risk description]

API contract alignment: ✓ / [N] mismatches
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If APPROVED → update `[task-id]-backend.md` with any agreed naming corrections.

---

## Output

```
Result: APPROVED / CHANGES REQUESTED  ([N] critical / [N] advisory)

Next:
  Changes requested → update [task-id]-backend.md, re-run /db-schema-review
  Approved          → /implement [task-id]
```
