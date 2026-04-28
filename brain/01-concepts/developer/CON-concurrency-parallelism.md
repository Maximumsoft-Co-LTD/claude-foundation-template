---
type: concept
tags: [concurrency, parallelism, threading, async, fundamentals]
related: [CON-async-patterns, CON-functional-programming]
updated: 2026-04-29
source: template
---

# Concurrency vs Parallelism

## Core idea

Often confused, never the same thing.

- **Concurrency** = managing **many things at once** (interleaved progress, may be a single CPU)
- **Parallelism** = doing **many things at once** (literal simultaneous execution on multiple cores)

You can have concurrency without parallelism (event loop, single CPU) and parallelism without concurrency (data parallelism on a GPU, no shared mutable state).

> **Rob Pike's metaphor:** "Concurrency is about dealing with lots of things at once. Parallelism is about doing lots of things at once."

## The execution model

| Unit | What it is | Sharing | Cost |
|------|-----------|---------|------|
| **Process** | OS-level isolation with own memory | Nothing (IPC needed) | Heavy (~MB) |
| **Thread** | Shares memory with siblings in the same process | Memory, file handles | Medium (~KB) |
| **Coroutine / Task** | Cooperative, scheduled by runtime | Same as host thread | Light (~bytes) |
| **Async / Future** | Pending value, scheduler-driven | Same as host | Light, but compiles differently |

Modern systems mix: a process has multiple threads, each thread runs many coroutines, each coroutine can `await` async I/O.

## Race conditions

A **race condition** is a bug where correctness depends on the relative timing of operations.

```python
# Two threads incrementing a shared counter
counter = 0
def inc():
    counter = counter + 1   # NOT atomic: read, add, write

# Run inc() twice in parallel → counter might end at 1, not 2
# (both threads read 0, both write 1)
```

**Cause:** check-then-act or read-modify-write patterns without atomic protection.

**Fix:** make the critical section atomic via a mutex, atomic operations, or a higher-level concurrent data structure.

## Mutex (mutual exclusion)

A lock that grants **exclusive** access to a critical section.

```python
lock = threading.Lock()
def inc():
    with lock:
        counter = counter + 1   # atomic w.r.t. other lock holders
```

**Properties:**
- Only one thread holds the lock at a time
- Other threads block until the holder releases
- Granularity matters: too broad → contention; too narrow → still racy

**Variants:**
- **Read-write lock** — many readers OR one writer
- **Spinlock** — busy-wait instead of blocking (only when critical section is microseconds)
- **Semaphore** — N permits instead of 1
- **Atomic operation** — hardware-level, no lock needed for primitive ops

## Deadlock

Two or more threads block forever, each waiting on a resource the other holds.

```python
# Thread A
with lock_a:
    with lock_b:  # waits for B
        ...

# Thread B (concurrent)
with lock_b:
    with lock_a:  # waits for A — deadlock
        ...
```

**Coffman conditions** (all four required for deadlock):
1. Mutual exclusion (resources non-shareable)
2. Hold and wait (holding one, asking for another)
3. No preemption (can't yank a lock)
4. Circular wait (A→B→A)

**Prevention:** establish a global lock ordering. If every thread always acquires `lock_a` before `lock_b`, the cycle is impossible.

## Async / await — single-threaded concurrency

```python
async def fetch_users(ids):
    results = await asyncio.gather(*[fetch(id) for id in ids])
    return results
```

The function pauses (`await`) and the event loop schedules other tasks. **No threads, no locks** — but only useful when work is **I/O-bound** (waiting on network/disk).

For **CPU-bound** work, async doesn't help — you need actual parallelism (threads in a language without GIL, or processes/workers).

## Concurrency vs parallelism — when to use which

| Workload | Best fit |
|----------|----------|
| 10K HTTP requests, mostly waiting on responses | **Async concurrency** (single thread, event loop) |
| Image transformations on 1000 photos | **Parallelism** (threads / process pool / GPU) |
| Real-time UI with background data fetch | **Concurrency** (UI thread + async data) |
| Massive matrix multiplication | **Parallelism** (SIMD / GPU) |

## Common patterns

### Producer-Consumer
A queue between producer threads (write) and consumer threads (read). Bounded queue gives backpressure.

### Worker pool
N worker threads/processes pull from a shared task queue. Caps concurrency at N.

### Fork-join
Split a big task into independent subtasks (fork), wait for all (join), combine. Maps to `Promise.all`, `Parallel.For`, etc.

### Actor model
Each "actor" is an isolated unit of state with a message inbox. No shared memory; concurrency via message passing. (Erlang, Akka, Elixir.)

## Why immutability is concurrency's friend

If data can't be mutated, it can be shared between threads with **zero locking**. This is why FP-leaning languages (Erlang, Elixir, Clojure) are popular for high-concurrency systems.

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| **Synchronized everything** | Lock around every method call | Lock specific critical sections only |
| **Shared mutable state across threads** | Random bugs, timing-dependent | Make state immutable or single-owned |
| **Sleep-based synchronization** | "It works most of the time" | Use proper sync primitives |
| **Async-over-sync** | `Task.Run(() => blockingCall())` to "make it async" | Find a real async API or use a worker pool |
| **Thread-per-connection at scale** | OOM at 10K connections | Use async I/O or a connection pool |

## Related

- [[../backend/CON-async-patterns]] — async/await in backend context
- [[CON-functional-programming]] — immutability eliminates many concurrency bugs
- [[../backend/CON-rate-limiting]] — concurrency control at the boundary
- [[../infra/CON-scalability-patterns]] — how concurrency models map to scaling
