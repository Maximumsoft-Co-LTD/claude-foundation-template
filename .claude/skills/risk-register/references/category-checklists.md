# Risk Register — Category Checklists

Per-category `Trigger / Risk / Mitigation` prompts. Reference from `risk-register` SKILL.md Step 3.

---

## Data (migrations)

| Trigger | Risk | Mitigation |
|---|---|---|
| Adding NOT NULL column | Existing rows have no value → fail | Add as nullable, backfill, then add NOT NULL constraint |
| Dropping a column | App still reads it after deploy | Two-phase: stop reading first, drop after 1 release cycle |
| Changing column type | Data loss on conversion (e.g. `string→int`) | Add new column, dual-write, migrate, drop old |
| Renaming a field | Old documents still have old name | Rolling migration, app reads either name during window |
| Adding unique index | Existing duplicates cause migration failure | Pre-scan for duplicates, dedup, then add index |
| Dropping an index | Hot query falls back to collection scan | Verify no query depends on it (`EXPLAIN`), drop in low-traffic window |
| Backfill > 100k rows | Long-running migration locks table | Batch in chunks, monitor, throttle |
| Deleting documents | Permanent loss if criteria is wrong | Soft-delete first (1 release), then purge |

---

## Auth

| Trigger | Risk | Mitigation |
|---|---|---|
| Session secret rotation | All current sessions invalidated | Dual-secret window, rotate gradually |
| Token format change | Existing tokens stop working | Versioned tokens (`v2:`), accept v1 during window |
| Permission tightening | Users locked out of features they had | Audit current grantees, communicate, phase rollout |
| Adding MFA | Users without device locked out | Grace period, opt-in first, enforce later |
| OAuth scope change | Existing integrations break | Bump version, run side-by-side |

---

## Payment

| Trigger | Risk | Mitigation |
|---|---|---|
| Money calculation change | Wrong amounts charged/refunded | Property test against the spec, golden-file regression |
| Currency conversion | Rounding loses cents on aggregate | Use integer cents, never floats; document rounding direction |
| Invoice format | Customer accounting systems break | Versioned invoices, opt-in to new format |
| Retry logic | Double-charge | Idempotency key required, dedupe at PSP boundary |

---

## API (Tier-3 contract)

| Trigger | Risk | Mitigation |
|---|---|---|
| Removing a field | Old client crashes | Mark deprecated, keep for 2 release cycles, add Sunset header |
| Adding required request field | Old client gets 400 | Make optional first, default-fill server-side |
| Changing status code | Old client error handlers misroute | Add new endpoint version, keep old |
| Mobile client (can't force update) | Permanent fragmentation | Versioned API, server supports oldest in-app version |

---

## Performance

| Trigger | Risk | Mitigation |
|---|---|---|
| New query in hot path | Latency regression | Benchmark before/after, EXPLAIN, add index if needed |
| N+1 from join replacement | Hidden fan-out | Test with realistic data volume, not 5-row fixtures |
| Adding cache | Stale data window | Bound TTL, invalidate on write, document staleness |
| Removing index | Query hits collection scan | Verify with `EXPLAIN`, no full-scan acceptable on > 10k docs |

---

## Reliability

| Trigger | Risk | Mitigation |
|---|---|---|
| New cron | Misses run during deploy | Idempotent design, tolerate skipped runs |
| Queue consumer change | Dead-letter buildup | Backward-compatible message format, drain DLQ |
| External API call | Cascading failure on outage | Timeout + retry + circuit breaker + fallback |
| Removing healthcheck | Bad pod stays in rotation | Replacement check exists FIRST |

---

## Security

| Trigger | Risk | Mitigation |
|---|---|---|
| New user input | Injection (SQL/NoSQL/cmd/XSS) | Parameterized queries, output encoding, allowlist validation |
| File upload | Malicious upload | Type sniffing, size cap, scan, served from separate domain |
| New secret | Leakage in logs/repo | Use secret manager, never `console.log`, scan diffs |
| CORS change | Cross-site attack | Explicit origin allowlist, no `*` with credentials |

---

## Observability

| Trigger | Risk | Mitigation |
|---|---|---|
| Removing a log line | Loss of investigation breadcrumb | Replace with metric, document why removed |
| Changing alert threshold | Page misses incidents | Run shadow alert for 1 week before flip |
| Tracing change | Distributed traces split | Verify trace propagates end-to-end before merge |
