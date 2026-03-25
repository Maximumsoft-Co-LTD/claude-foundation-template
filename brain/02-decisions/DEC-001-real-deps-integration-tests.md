---
type: decision
id: DEC-001
status: active
date: 2026-03-25
tags: [testing, integration, mocks, real-deps]
---

# DEC-001 — Real Dependencies for Integration Tests (No Mocks)

## Status
`active`

## Context

When writing integration tests, there are two approaches:
1. Mock external dependencies (DB, queues, HTTP clients)
2. Use real dependencies in a test environment

Mocking is faster to set up but creates a false sense of security.

## Decision

**Integration tests must use real dependencies.** No mocks at the integration layer.

- Real database (test DB with known seed data)
- Real message queue (local instance or test container)
- Real HTTP calls (against local test server)

Unit tests may use mocks for pure logic testing.

## Rationale

Mocks at the integration layer fail in production because:
- Real DB has different query planner behavior
- Real queues have timing and ordering characteristics
- Schema changes in production aren't reflected in static mocks
- Connection pooling and transaction behavior only appears with real deps

The extra setup cost of real dependencies pays off in bug prevention.

## Consequences

**Positive:**
- Integration tests catch real production bugs
- Schema changes are immediately detected by tests
- No mock drift — tests reflect actual system behavior

**Negative:**
- Test setup requires running a test DB/queue
- CI pipeline needs containerized services (Docker Compose / testcontainers)
- Slower test runs than mock-based tests

## Related

- [[../01-concepts/CON-tdd-rules]]
- [[../03-patterns/PAT-001-tdd-flow]]
- `.claude/rules/testing.md`
