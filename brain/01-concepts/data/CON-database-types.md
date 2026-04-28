---
type: concept
tags: [database, polyglot-persistence, fundamentals]
related: [CON-cap-acid-base, CON-data-modeling, CON-sql-fundamentals]
updated: 2026-04-29
source: template
---

# Database Types — Choosing the Right Store

## Core idea

There are **eight** dominant database categories in 2026. They are not interchangeable — each is shaped by an access pattern, and using the wrong one produces 10× cost or 10× latency.

The starting question: **what is the data's shape and how is it queried?**

## The eight categories

### 1. Relational (RDBMS)
**Examples:** PostgreSQL, MySQL, SQL Server, Oracle.

**Shape:** rows in tables, schema-enforced, foreign keys.
**Best for:** anything where data integrity > scale (financial ledgers, inventory, orders).
**Strengths:** ACID transactions, joins, mature tooling, predictable.
**Weaknesses:** sharding/horizontal scale is hard; schema migrations on huge tables are painful.

In 2026, **PostgreSQL is the default**. It also covers many "non-relational" needs: JSONB for documents, full-text search, GIS, vectors via `pgvector`, time-series via TimescaleDB.

### 2. Document
**Examples:** MongoDB, CouchDB, Firestore, Amazon DocumentDB.

**Shape:** JSON/BSON documents in collections; schemaless or flexible schema.
**Best for:** content with variable shape (blog posts, product catalogs), prototyping.
**Strengths:** schema flexibility, no migration to add a field, embedded docs avoid joins.
**Weaknesses:** weaker transactional guarantees historically (improving), denormalization invites data drift.

**Heuristic:** if Postgres + JSONB columns work, use Postgres + JSONB. Reach for MongoDB only when the *primary* access pattern is document-shaped at large scale.

### 3. Key-value
**Examples:** Redis, Memcached, DynamoDB, etcd, RocksDB.

**Shape:** opaque key → value lookups. Often O(1).
**Best for:** caching, session storage, rate-limiting counters, leaderboards (Redis), feature flag config (etcd).
**Strengths:** very low latency, very high throughput, simple model.
**Weaknesses:** can't query by anything but the key; must denormalize the world.

DynamoDB is a **distributed** KV with secondary indexes — it blurs the line with document, but the access pattern is still "lookup by key."

### 4. Graph
**Examples:** Neo4j, Amazon Neptune, TigerGraph, ArangoDB.

**Shape:** nodes (entities) + edges (relationships) with properties.
**Best for:** social networks ("friends of friends"), fraud detection (transaction patterns), knowledge graphs, recommendations.
**Strengths:** traversal queries that would be 12-table joins in SQL run in milliseconds.
**Weaknesses:** specialized — overkill if the graph aspect is small.

Heuristic: if the answer to "find all paths from X to Y" matters, use a graph DB.

### 5. Wide-column / Columnar
**Examples:** Cassandra, ScyllaDB, HBase, BigQuery (analytical).

**Shape:** rows have a key + a sparse column family. Internally stored column-wise on disk.
**Best for:** time-series, analytics, write-heavy workloads at scale.
**Strengths:** writes are fast (append-mostly), columnar storage compresses well, scans of one column are blazing.
**Weaknesses:** not built for ad-hoc joins or strong consistency.

Cassandra is **AP** by default — if you need strong consistency on every read, this isn't the right tool.

### 6. Time-series
**Examples:** InfluxDB, TimescaleDB (Postgres extension), QuestDB, Prometheus.

**Shape:** rows indexed by timestamp + a few labels. Append-only.
**Best for:** metrics, sensor readings, financial ticks, application logs at scale.
**Strengths:** retention policies (auto-drop old data), downsampling, aggregations over time windows are first-class.
**Weaknesses:** poor fit for relational data.

**TimescaleDB** is notable — a PostgreSQL extension. Teams already on Postgres can add time-series capabilities without a new system.

### 7. NewSQL
**Examples:** CockroachDB, YugabyteDB, Spanner, VoltDB.

**Shape:** looks like SQL relational; underneath is a distributed sharded system.
**Best for:** core systems (banking, inventory) needing both ACID and horizontal scale.
**Strengths:** ACID + global scale, SQL interface, automatic sharding.
**Weaknesses:** more expensive per query than vanilla Postgres; latency on cross-region writes.

**Heuristic:** start with vanilla Postgres. Move to NewSQL when measured single-node Postgres no longer fits your scale.

### 8. Vector
**Examples:** Pinecone, Weaviate, Milvus, Qdrant, pgvector (Postgres extension), OpenSearch with k-NN.

**Shape:** rows are high-dimensional vectors (embeddings) + metadata.
**Best for:** semantic search, RAG for LLMs, image similarity, recommendations from embeddings.
**Strengths:** approximate-nearest-neighbor (ANN) search at billion-vector scale.
**Weaknesses:** one-trick pony; pair with another DB for relational metadata.

By 2026, vector DBs are a standard component of any AI/LLM-backed system.

## Polyglot persistence — using more than one

Modern systems often use **multiple databases**, each for what it does best. A typical SaaS stack:

```
PostgreSQL    — main transactional data (users, orders)
Redis         — cache + sessions + rate limit counters
S3            — uploaded files, backups
Elasticsearch — full-text search + log analytics
ClickHouse    — analytics / dashboards
pgvector      — embeddings for AI features
```

**Cost:** more systems to operate, deploy, secure. **Reward:** each access pattern hits a system designed for it.

**Counter-trend:** "**Postgres for everything**" — by 2026, Postgres extensions (JSONB, full-text, pgvector, TimescaleDB, pg_partman) cover ~80% of these needs in one system. For small/medium teams this is often the right call.

## Decision matrix

| Need | First pick | Alternative |
|------|-----------|-------------|
| Transactions on related entities | PostgreSQL | MySQL |
| Cache / session / counter | Redis | Memcached |
| Multi-region scale + ACID | CockroachDB / Spanner | PostgreSQL with read replicas |
| User-uploaded blobs | S3 | EFS for shared filesystems |
| Search across text | Elasticsearch / OpenSearch | Postgres full-text (small scale) |
| Time-series metrics | TimescaleDB / Prometheus | InfluxDB |
| Graph traversal | Neo4j | Postgres recursive CTE (small scale) |
| LLM embeddings | pgvector / Pinecone | Weaviate / Qdrant |
| Massive write throughput | Cassandra / Scylla | Kafka + downstream DB |

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| **MongoDB as the relational DB** | Embedded docs duplicate data, drift, manual joins in app code | Use Postgres for relational work |
| **PostgreSQL for high-throughput sessions** | DB pressure, frequent vacuums | Move to Redis |
| **One DB per microservice** without need | Operational burden | Share DBs when bounded contexts truly overlap |
| **Eventually-consistent for inventory** | Overselling | Use strong consistency where money/stock is on the line |
| **No vector DB for AI features** | Slow KNN, hand-rolled cosine sim | Use pgvector first |
| **Picking by hype** | "Web3 needs a graph DB" with no graph queries | Pick by access pattern |

## Related

- [[CON-cap-acid-base]] — guarantees these DBs offer
- [[CON-data-modeling]] — how to model for each type
- [[CON-sql-fundamentals]] — relational deep dive
- [[CON-replication-sharding]] — how each DB scales
- [[../backend/CON-database-patterns]] — connection pools, migrations, etc.
- [[CON-database-indexing]] — indexing rules per DB type
