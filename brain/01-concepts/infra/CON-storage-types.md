---
type: concept
tags: [infra, storage, cloud, persistence]
related: [CON-cloud-fundamentals, CON-disaster-recovery, CON-database-types]
updated: 2026-04-29
source: template
---

# Storage Types — Block, File, Object

## Core idea

Three fundamental storage models, each optimized for different access patterns and scale. Picking the wrong one is the most common cloud-cost mistake.

| Type | Unit | Access | Scale | Latency |
|------|------|--------|-------|---------|
| **Block** | Fixed-size blocks (4KB) | Mounted as a disk | Limited per volume | Lowest (~ms) |
| **File** | Files in directories | Mounted as a filesystem | Multi-node shared | Low (~ms) |
| **Object** | Whole objects + metadata | HTTP API | Effectively unlimited | Higher (~10s of ms) |

## Block storage

What it is: a virtual disk. Reads/writes happen at the block level (4KB pages). Looks like a local SSD/HDD to the OS.

**Examples:** AWS EBS, Azure Managed Disks, GCP Persistent Disk, on-prem SAN.

**Best for:**
- **Databases** (Postgres, MySQL, MongoDB) — needs low-latency random I/O
- **Boot volumes** for VMs
- Filesystems that demand consistent IOPS (transaction logs, indexes)

**Properties:**
- Attached to **one instance at a time** (mostly — multi-attach exists but is the exception)
- **Lowest latency, highest IOPS** of the three types
- **Doesn't scale on its own** — you grow capacity by provisioning more / bigger volumes
- Snapshots are point-in-time backups stored as objects

**Trade-offs:**
- Pay for provisioned size, not used size
- Single-AZ by default — disaster recovery requires snapshots
- Resizing is non-trivial (allocate new + migrate or grow with FS-aware tools)

## File storage

What it is: a shared filesystem accessed over the network (NFS, SMB). Multiple machines mount it concurrently.

**Examples:** AWS EFS, Azure Files, GCP Filestore, on-prem NetApp/NFS.

**Best for:**
- Shared content across many app servers (CMS uploads, build artifacts)
- Lift-and-shift apps that expect a Unix filesystem
- Multi-instance write scenarios

**Properties:**
- **Multi-mount** — N instances see the same files at the same time
- **POSIX semantics** — `open`/`read`/`write`/`flock`
- **Elastic** — capacity grows as files are added
- Higher latency than block, lower than object (network hop)

**Trade-offs:**
- More expensive per GB than block
- Concurrent writes can produce locking surprises (NFS lock semantics are subtle)
- Not ideal for huge files at very high throughput (block beats it)

## Object storage

What it is: blobs of arbitrary size identified by a key. Accessed via HTTP API (PUT, GET, DELETE), not as a filesystem.

**Examples:** AWS S3, Azure Blob Storage, GCP Cloud Storage, MinIO (self-hosted), Cloudflare R2.

**Best for:**
- **Static assets** — images, video, JS bundles served via CDN
- **Backups & archives** — Glacier / cold tiers for compliance
- **Data lakes** — Parquet/CSV for analytics
- **User uploads** at scale
- **ML model artifacts**

**Properties:**
- **Effectively unlimited capacity** (S3 holds exabytes)
- **Versioning, lifecycle rules** (auto-tier to cold after 30 days)
- **High durability** (S3 = "11 nines" — `99.999999999%`)
- **Eventual consistency** historically; S3 is now strongly consistent for read-after-write
- **No POSIX** — no `mkdir`, no atomic rename, no partial-file edits

**Trade-offs:**
- Higher latency than block/file
- HTTP overhead per object (bad for many tiny files; aggregate them)
- Egress cost — listing 1B objects gets expensive
- Hot keys can throttle (use random key prefixes for high-throughput writes)

## Decision tree

```
Is the consumer a database / boot volume?
└─ YES → Block storage (EBS / Managed Disks)

Do multiple instances need to read/write the same files?
└─ YES → File storage (EFS / Azure Files)

Is it user uploads / backups / static assets / unbounded data?
└─ YES → Object storage (S3 / Blob / GCS)

Is it logs / metrics / time-series at scale?
└─ Object storage + analytics engine (Athena, BigQuery)
```

## Cold tiers and lifecycle

Within object storage, providers offer **storage classes** by access frequency:

| Class | Use | Cost / GB |
|-------|-----|-----------|
| Hot (S3 Standard) | Frequent access | High |
| Infrequent (S3 IA) | Monthly access | Medium |
| Archive (Glacier Instant) | Quarterly | Low |
| Deep archive (Glacier Deep) | Compliance, years | Very low |

**Lifecycle rules** auto-migrate objects: "after 30 days move to IA, after 1 year to Glacier." Big savings if access patterns are predictable.

## Common pitfalls

| Pitfall | Effect | Fix |
|---------|--------|-----|
| **Database on EFS** | High latency, lock contention | Use EBS for DB volumes |
| **User uploads on EBS** | Single-AZ, doesn't scale, hard to share | Use S3 |
| **Lots of small files in S3** | High API cost, slow listing | Aggregate (tar, parquet) before upload |
| **No lifecycle rules** | Cold data on hot tier costs 10× | Set rules from day 1 |
| **No versioning on S3** | Accidental deletes are unrecoverable | Enable versioning + MFA delete on prod buckets |
| **EFS for binary builds at scale** | Slow and expensive | S3 + cache; or per-instance EBS for build dir |

## Throughput tuning quick guide

- Block: provision IOPS or use gp3 with explicit IOPS allocation
- File: aim for general-purpose mode unless throughput is the bottleneck (then provisioned-throughput mode)
- Object: use multipart upload for files > 100 MB; use pre-signed URLs for direct-to-S3 uploads instead of streaming through your API

## Related

- [[CON-cloud-fundamentals]] — IaaS/PaaS context
- [[CON-disaster-recovery]] — backup strategy by storage type
- [[../data/CON-data-modeling]] — what to put in DB vs object storage
- [[../devops/CON-cicd-pipeline]] — build artifacts often live in object storage
