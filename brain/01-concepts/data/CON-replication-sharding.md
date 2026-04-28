---
type: concept
tags: [database, replication, sharding, scaling, fundamentals]
related: [CON-cap-acid-base, CON-database-types, CON-database-patterns]
updated: 2026-04-29
source: template
---

# Replication and Sharding

## Core idea

The two strategies for making a database handle more data and more traffic than one machine can serve.

- **Replication** = same data, multiple copies → scales **reads**, provides **redundancy**
- **Sharding** = different subsets of data on different machines → scales **writes** and **storage**

They are **orthogonal**: most production systems combine both.

## Replication

```
            ┌────────────┐
   Writes → │  Primary   │
            └─────┬──────┘
                  │ replicate
        ┌─────────┼─────────┐
        ▼         ▼         ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │Replica │ │Replica │ │Replica │
   └────────┘ └────────┘ └────────┘
   ↑ Reads can fan out to replicas
```

### Patterns

| Pattern | Writes | Reads | Trade-off |
|---------|--------|-------|-----------|
| **Single primary, async replicas** | Primary only | Primary or replica | Read scale; brief replication lag → reads can be stale |
| **Single primary, sync replicas** | Primary only (waits for replicas) | Anywhere | Stronger consistency; higher write latency |
| **Multi-primary** | Any node | Any node | Conflict resolution complexity; no single bottleneck |
| **Quorum-based** (Cassandra, Dynamo) | W replicas ack | R replicas read | Tunable; W + R > N → strong consistency |

### Failover

When the primary dies, a replica must be promoted:
- **Automatic** — orchestrator (Patroni, AWS RDS, Aurora) detects + promotes; risks split-brain if poorly configured
- **Manual** — operator promotes; safer but slower

The promoted replica must have replicated everything the dead primary committed, otherwise writes are lost. Sync replication makes this safe at the cost of latency.

### Replication lag

Async replication is **asynchronous** — there is always a window where the replica is behind. Symptoms:
- User writes a comment, immediately reads it back, doesn't see it (their read hit a lagging replica)
- A reporting query off a replica shows yesterday's totals during a backlog

**Mitigations:**
- **Read-your-writes** routing — for N seconds after a write, send that user's reads to the primary
- **Sync replicas** for critical paths
- **Bounded staleness reads** — replicas refuse to serve if lag exceeds X seconds

## Sharding (horizontal partitioning)

```
   ┌──────────────────────────────────────────────────────────┐
   │                        Logical DB                        │
   │                                                          │
   │   user_id 1-1000 →   user_id 1001-2000 →   user_id 2001-3000  │
   │   ┌────────────┐    ┌────────────┐         ┌────────────┐  │
   │   │  Shard A   │    │  Shard B   │   ...   │  Shard C   │  │
   │   └────────────┘    └────────────┘         └────────────┘  │
   └──────────────────────────────────────────────────────────┘
```

Each shard is its **own database** with a subset of the rows. Shards are usually independent — no cross-shard queries (or limited ones).

### Sharding strategies

| Strategy | Key |
|----------|-----|
| **Range** | `id 1-1000 → A`, `id 1001-2000 → B` — simple; risk of hot shards |
| **Hash** | `hash(id) % N → shard` — uniform distribution; resharding is expensive |
| **Consistent hash** | Hash to a ring; minimizes movement when adding shards |
| **Directory / lookup** | Central service maps key → shard; flexible but adds a hop and SPOF risk |
| **Geo / tenant** | Shard by region or by customer — natural for multi-tenant SaaS |

### Picking a shard key

The shard key is **the most important DB design decision** in a sharded system. A bad shard key = forever-pain.

A good shard key has:
- **High cardinality** — many distinct values so shards are uniform
- **Even distribution** — no hot keys (e.g., not "country" if 90% of users are in one country)
- **Aligned with the dominant query pattern** — if you mostly query by `user_id`, shard by `user_id` so most queries hit one shard
- **Stable** — value doesn't change after insert (a user's `id` is stable; their email isn't)

**Antithesis:** sharding by timestamp puts all new writes on one shard — instant hot shard.

### Cross-shard operations

These are **hard**:
- Joins across shards — usually not supported directly; assemble in app code
- Transactions across shards — need 2PC or Saga ([[CON-distributed-transactions]])
- Global aggregates — gather from each shard, combine

The architectural tax for sharding: app code becomes shard-aware. This is why teams **delay sharding** as long as possible (vertical scale + read replicas first).

## Replication + sharding combined

Real systems do both. Each shard is itself replicated for redundancy + read scale.

```
Shard A: primary + 2 replicas
Shard B: primary + 2 replicas
Shard C: primary + 2 replicas

A query routes to:
  → which shard? (sharding)
  → which replica? (replication / load balancing)
```

This is how DynamoDB, Cassandra, MongoDB sharded clusters, and large Postgres deployments work.

## Partitioning vs sharding (terminology)

| Term | Scope |
|------|-------|
| **Partitioning** | Splitting a table into pieces — could be on one server (logical) or across servers |
| **Sharding** | Specifically splitting **across servers** for horizontal scale |
| **Vertical partitioning** | Splitting **columns** (e.g., put rarely-read blob columns in a separate table) |
| **Horizontal partitioning** | Splitting **rows** — same thing as sharding when across servers |

PostgreSQL has built-in partitioning (`PARTITION BY RANGE/LIST/HASH`) — that's local partitioning, not sharding. Sharding requires app-level routing or an extension like Citus.

## When NOT to shard

Sharding is **expensive in complexity**. Defer it until:
- Vertical scaling (bigger machine) hit a real ceiling
- Read replicas + caching aren't covering read load
- Single-shard size or query latency are demonstrably the bottleneck

Many "we need to shard" conversations are solved by an index, a cache layer, or moving cold data to S3.

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| **Hot shard** | One shard 10× the load of others | Pick a better shard key, or split the hot one |
| **Cross-shard joins everywhere** | App code is unmaintainable | Design queries to live in one shard; pre-aggregate |
| **Resharding under load** | Outage | Plan capacity; consistent hashing; never reshard during peak |
| **Replica reads for read-your-writes** | "I just wrote it but it's not there" | Route to primary for N seconds after write |
| **Sharding before optimizing** | High complexity, low payoff | Profile first — likely an index or cache fixes it |

## Related

- [[CON-cap-acid-base]] — replication choices map to PACELC tradeoffs
- [[CON-database-types]] — different DBs implement these patterns differently
- [[CON-distributed-transactions]] — what to do when a transaction spans shards
- [[../backend/CON-database-patterns]] — connection pooling per shard
- [[../infra/CON-scalability-patterns]] — the broader scale-out picture
