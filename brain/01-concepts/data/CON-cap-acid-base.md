---
type: concept
tags: [database, distributed-systems, consistency, fundamentals]
related: [CON-database-types, CON-replication-sharding, CON-distributed-transactions]
updated: 2026-04-29
source: template
---

# CAP, ACID, BASE, PACELC

## Core idea

Four acronyms that govern how distributed databases trade off **consistency**, **availability**, and **performance**. Knowing them is how you pick (and defend) a database choice.

The TL;DR:
- **ACID** describes what a single-node transactional DB guarantees
- **CAP** says what a distributed DB **can't** guarantee all of, simultaneously, during a partition
- **BASE** describes what NoSQL DBs offer instead
- **PACELC** extends CAP with the latency/consistency tradeoff that exists **even without** partitions

## ACID — single-node transaction guarantees

Originated in classic relational DBs. A transaction is:

| Letter | Property |
|--------|---------|
| **A** | **Atomicity** — all or nothing. Crash mid-transaction → no partial effects. |
| **C** | **Consistency** — DB constraints (FKs, uniqueness, CHECK) hold before and after. |
| **I** | **Isolation** — concurrent transactions don't see each other's intermediate state. |
| **D** | **Durability** — committed transactions survive crashes (fsync to disk). |

**Where it applies:** the canonical example is a bank transfer.

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

ACID guarantees you never lose or duplicate the $100, even if the server crashes between the two UPDATEs.

**Where it breaks down:** ACID is hard to maintain across multiple nodes. The second you replicate or shard, you confront CAP.

## CAP — the three-way impossibility

In a distributed system you can have **at most 2 of 3**:

| Letter | Meaning |
|--------|---------|
| **C** — Consistency | Every read sees the most recent write (or an error). All nodes agree on the value. |
| **A** — Availability | Every request gets a non-error response (possibly stale). |
| **P** — Partition tolerance | The system keeps working when nodes can't talk to each other. |

In practice **P is non-negotiable** (network partitions happen — hardware fails, switches reboot). So the real choice is:

| Choice | What you give up | Examples |
|--------|------------------|----------|
| **CP** (Consistency + Partition) | Availability during partition (some requests will error) | PostgreSQL primary/replica, MongoDB w/ majority writes, Redis Sentinel, etcd, Zookeeper |
| **AP** (Availability + Partition) | Strong consistency (reads may be stale) | DynamoDB, Cassandra, Riak, Couchbase |

> **Note:** "CA" databases (consistency + availability without partition tolerance) only exist on a single node. In a distributed setting, P is forced.

### CAP nuance — it's per request, not the whole system
CAP is often misread as "Cassandra is AP forever, Postgres is CP forever." Real systems can offer **per-request** tunable consistency:
- DynamoDB: strongly-consistent read = CP for that read; eventually-consistent = AP
- Cassandra: `CONSISTENCY ONE` is AP; `CONSISTENCY ALL` is CP

## BASE — the NoSQL counter-philosophy

Born in opposition to ACID, for systems that prioritize availability and scale.

| Letter | Property |
|--------|---------|
| **BA** | **Basically Available** — best-effort response, partial failures tolerated |
| **S** | **Soft state** — data may change over time without input (replication catching up) |
| **E** | **Eventually consistent** — given no new updates, replicas converge — eventually |

BASE is what you get when you trade ACID for availability. **Eventual consistency** is the catch: a write becomes visible to all readers eventually, but you can't say *when*.

## PACELC — the missing dimension

CAP only describes behavior **during a partition**. Reality: even without a partition, distributed DBs trade **latency for consistency**.

```
IF Partition (P):
  pick Availability (A) or Consistency (C)
ELSE (E):
  pick Latency (L) or Consistency (C)
```

| Class | Partition behavior | Normal behavior | Examples |
|-------|--------------------|-----------------|----------|
| **PA / EL** | Availability over consistency | Latency over consistency | Cassandra, DynamoDB, Cosmos (default), Riak |
| **PC / EC** | Consistency over availability | Consistency over latency | PostgreSQL, VoltDB, traditional RDBMS |
| **PA / EC** | Availability over consistency under partition; consistency normally | Mostly consistent, AP only when forced | MongoDB (majority writes), some configs |
| **PC / EL** | Consistency over availability under partition; latency normally | Lower latency by relaxing consistency | Rare in practice |

PACELC is more honest than CAP because it accounts for the **everyday** trade-off, not only the edge case of partitions.

## Strong vs weak vs eventual consistency — the spectrum

| Level | Guarantee |
|-------|-----------|
| **Linearizable / strict** | Reads see the most recent write, globally. As if a single node. |
| **Sequential** | Reads see writes in **some** consistent order, same on all nodes |
| **Causal** | Causally related writes are seen in order; concurrent writes can be in any order |
| **Read-your-writes** | A client always sees its own writes |
| **Monotonic reads** | Once you see version N, you never see < N |
| **Eventual** | Eventually all replicas agree |

Many DBs let you tune this per request. Strong = expensive (waits for ack from majority). Eventual = fast.

## Practical decision flow

```
Is the data financial / inventory / anything where stale = wrong?
└─ YES → CP / strong consistency (PostgreSQL, CockroachDB, Spanner)

Is high availability + low latency at planet scale the priority,
and stale reads acceptable?
└─ YES → AP / eventual consistency (DynamoDB, Cassandra)

Mostly normal needs, single-region?
└─ Default to relational (Postgres). Add NoSQL only when measured pain forces it.
```

## Common misconceptions

| Myth | Reality |
|------|---------|
| "Pick 2 of CAP" | You don't pick — partitions happen; you pick how to behave during them |
| "ACID DBs are always consistent across nodes" | Not when you replicate. ACID is per-node; CAP is across nodes |
| "BASE means no consistency" | It means *eventual*. Often that's enough |
| "NoSQL = AP" | Many NoSQL are tunable; some are CP-by-default |
| "CAP is dead" | The Brewer original was over-simplified, but PACELC and tunable consistency build on it |

## How this template treats DB choice

When `/discovery` or `/requirement` selects a database, the design doc should answer:
- ACID needed? → relational, CockroachDB, or Spanner
- Eventually consistent acceptable? → consider DynamoDB / Mongo for the fit
- Read-your-writes guarantee per session needed? → tunable consistency setting

## Related

- [[CON-database-types]] — what to use when
- [[CON-replication-sharding]] — how distribution actually works
- [[CON-distributed-transactions]] — Saga / 2PC across services
- [[../architecture/CON-event-driven-architecture]] — eventual consistency patterns
- [[../architecture/CON-microservices-patterns]] — Saga is the typical answer
