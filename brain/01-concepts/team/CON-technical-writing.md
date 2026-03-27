---
type: concept
tags: [team, technical-writing, documentation, README, runbook, ADR]
related: [CON-document-structure, CON-code-review-checklist, CON-branch-commit-format]
updated: 2026-03-25
source: template
---

# Technical Writing

Quality documentation is a multiplier: it scales knowledge, enables faster onboarding, and reduces support burden. Poor docs cost time and create confusion.

---

## README Structure

Every project needs a clear, scannable README as the entry point.

```markdown
# Project Name

[Brief one-liner: what does this do?]

## Status

[![Build](badge-url)](link) [![Tests](badge-url)](link)

## Description

[2-3 sentences explaining the problem this solves and key features]

### Key Features
- Feature A
- Feature B
- Feature C

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker (optional, for local dev)

## Installation

### From source
\`\`\`bash
git clone <repo>
cd project
npm install
\`\`\`

### Docker
\`\`\`bash
docker run -p 3000:3000 my-project:latest
\`\`\`

## Quick Start

[Get someone productive in 5 minutes. Include example command and expected output.]

\`\`\`bash
npm run dev
# Output: Server running on http://localhost:3000
\`\`\`

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | — | PostgreSQL connection string |
| PORT | No | 3000 | Server port |
| LOG_LEVEL | No | info | Logging level (debug, info, warn, error) |

### Example `.env`
\`\`\`
DATABASE_URL=postgres://user:pass@localhost/dbname
PORT=3000
\`\`\`

## Usage

### Core concepts
[Explain 1-3 main ideas before showing code]

### API Example
\`\`\`bash
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice"}'

# Response: {"id": 1, "name": "Alice", "created": "2026-03-25T..."}
\`\`\`

### CLI Usage
\`\`\`bash
project init --name my-project
project serve
project build --output dist/
\`\`\`

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test: `npm test`
4. Commit: `git commit -m "feat: my feature"`
5. Push and open a pull request

See [[CONTRIBUTING.md]] for style guide and development setup.

## Troubleshooting

### Port 3000 already in use
\`\`\`bash
PORT=3001 npm run dev
\`\`\`

### Database connection refused
- Ensure PostgreSQL is running: `psql -d postgres`
- Check DATABASE_URL is correct: `echo $DATABASE_URL`

## License

MIT. See [[LICENSE]] file.

---

## Deployment

[Link to deployment docs or include brief steps]

See [[docs/DEPLOYMENT.md]] for production setup.
```

**README best practices:**
- Badges (build, coverage, license) at the top
- No walls of text; scannable with headers and lists
- One code example that runs immediately
- Link to detailed docs, don't repeat them
- Keep updated (stale README is worse than no README)

---

## Architecture Decision Record (ADR)

Format for recording architectural decisions with rationale (derived from Michael Nygard's ADR template).

```markdown
# ADR-001: Use PostgreSQL for Primary Database

**Date:** 2026-03-25
**Status:** Accepted
**Authors:** Team
**Reviewers:** CTO, Lead Architect

## Context

We are building a real-time collaborative editor. Requirement: support 100K concurrent users with sub-second latency.

Three candidate databases:
1. PostgreSQL 16 (relational, proven)
2. MongoDB (flexible schema, horizontal scaling)
3. DynamoDB (AWS managed, serverless)

Constraints:
- Must support ACID transactions (collaborative locking)
- Must run on-premises or in any cloud (vendor lock-in risk)
- Team expertise: mostly SQL, minimal MongoDB

## Decision

We will use PostgreSQL 16 with read replicas for reporting.

## Rationale

| Criteria | PostgreSQL | MongoDB | DynamoDB |
|----------|-----------|---------|----------|
| ACID Transactions | ✓ | ✓ | Limited |
| Vendor Lock-in | ✗ | ✗ | ✓ (AWS only) |
| Team Expertise | ✓ | ✗ | ✗ |
| Horizontal Scaling | Limited | ✓ | ✓ |
| Cost at Scale | Moderate | Moderate | High |

PostgreSQL meets all hard constraints and plays to team strengths. Horizontal scaling can be addressed later with read replicas and sharding.

## Consequences

**Positive:**
- Familiar to team, lower hiring bar
- Strong ACID support for collaborative features
- Mature tooling (backups, replication, monitoring)

**Negative:**
- Vertical scaling limits (~10K concurrent per node)
- Requires DBA expertise for optimization at scale
- Schema migrations are painful

**Mitigations:**
- Plan for read replicas before we hit scaling limits
- Hire DBA in year 2
- Use migration tool (Alembic) to version schema changes

## Alternatives Considered

1. **MongoDB:** Relaxed schema appealing but ACID support is recent; team inexperience is risk
2. **DynamoDB:** AWS lock-in and high cost at our scale; not suitable for on-premises

## Review Timeline

- Revisit if: single-node throughput > 10K req/sec or > 50K concurrent users
- Next review: Q4 2026

---

## Related ADRs

- [[ADR-002: Use async job queue for long-running tasks]]
- [[ADR-003: REST API design guidelines]]

## References

- PostgreSQL docs: https://www.postgresql.org/docs/
- Designing Data-Intensive Applications (Kleppmann, Ch. 1-4)
```

**ADR best practices:**
- Record decisions that are significant and have consequences (not minor)
- Keep as "Accepted" or "Superseded" — don't delete old decisions
- Update status when decision changes (e.g., "Superseded by ADR-010")
- Link related ADRs
- Set a review date (especially for decisions with future unknowns)

---

## Runbook (On-Call Guide)

Runbooks are ops docs: what to do when things go wrong.

```markdown
# Runbook: Payment Service

**Owned by:** Payments Team
**On-call:** Slack channel #payments-oncall
**Updated:** 2026-03-25

## Service Overview

Processes all payment transactions, charges cards, and reconciles with accounting system.

**Repository:** github.com/company/payment-service
**Deployment:** Kubernetes in `payments` namespace
**Dependencies:** Stripe API, PostgreSQL (primary), Redis (cache)

## SLOs (Service Level Objectives)

- **Availability:** 99.95% (5 nines minus) uptime per month
- **Latency:** P99 < 500ms for charge endpoint
- **Durability:** No lost transactions

## On-Call Checklist

[New on-call rotation? Read this first.]

- [ ] Slack: Join #payments-oncall, set notification keywords
- [ ] PagerDuty: Acknowledge your schedule, add phone number
- [ ] Runbook: Bookmark this doc + [[dashboards]]
- [ ] Credentials: Store Stripe API key, database password in 1Password
- [ ] Escalation: Know who to call (see [[CONTACTS.md]])

## Alert: Charge Endpoint High Latency

**Alert condition:** P99 latency > 1000ms for 5+ min

### Quick Diagnosis (1 min)

1. Check status page: https://status.company.com
2. Check PagerDuty incident for context
3. **Is Stripe down?** Check https://status.stripe.com
   - If yes: alert is correct, inform customers, wait for Stripe
4. **Is our DB slow?** Query `metrics.latency_by_service` in DataDog
   - Look for `service:payment-db` spike
5. **Is traffic spiked?** Check `payment.requests_per_sec` in DataDog

### If Database is Slow

1. SSH to payment-db-primary:
   ```bash
   kubectl exec -it payment-db-0 -- /bin/bash
   psql -U postgres
   ```

2. Check long-running queries:
   ```sql
   SELECT pid, query, query_start FROM pg_stat_activity
   WHERE state = 'active' AND query_start < now() - '1 min'::interval
   ORDER BY query_start;
   ```

3. **Kill a query if stuck:**
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE pid = <PID>;
   ```

4. Check disk usage:
   ```bash
   df -h /var/lib/postgresql
   ```

5. If disk > 80%: alert database team, you may need to delete old logs

### If Traffic Spiked

1. Check Stripe webhook processing: `kubectl logs -n payments stripe-webhook`
2. Look for errors like `"rate_limit": true`
3. Contact Stripe support if you hit rate limits

### Escalation

- **Still elevated after 10 min?** Page @payments-lead on PagerDuty
- **Database down?** Page @database-team and @cto immediately
- **Stripe integration broken?** Reach out to Stripe support (we have enterprise SLA)

## Alert: Payment Reconciliation Failed

**Alert condition:** Daily reconciliation job failed

### Context

Nightly job at 02:00 UTC checks that all Stripe charges match our database.

### Quick Check (2 min)

1. View logs: `kubectl logs -n payments -l job-name=reconciliation-nightly -f`
2. Look for error message (DB connection? Stripe API timeout?)
3. Check job status: `kubectl describe job reconciliation-nightly -n payments`

### Common Causes & Fixes

| Error | Fix |
|-------|-----|
| `Stripe API connection timeout` | Usually transient. Job auto-retries in 5 min. Monitor. |
| `Referential integrity violation` | DB corruption or race condition. Page @database-team. |
| `Missing credentials: STRIPE_API_KEY` | Missing secret. Check `kubectl get secrets -n payments`. Redeploy. |

### If Job Still Failing After 15 min

1. Page @payments-lead
2. Run manual reconciliation (read [[MANUAL-RECONCILIATION.md]])

## Common Customer Issues

### "My charge was declined"

1. Ask customer for: Card last 4 digits, amount, timestamp
2. Query: `SELECT * FROM charges WHERE card_last4 = '1234' ORDER BY created_at DESC LIMIT 5`
3. Check `decline_reason` field
4. **Common reasons:**
   - Insufficient funds → customer issue
   - CVV mismatch → customer issue
   - Card expired → customer issue
   - Rate limit (too many attempts) → tell customer to wait 5 min

### "I was charged twice"

1. Query: `SELECT * FROM charges WHERE customer_id = 123 ORDER BY created_at DESC`
2. Check timestamps: are there two charges < 10 seconds apart?
3. If yes, likely duplicate Stripe webhook. Find the duplicate in our idempotency key table
4. Contact Stripe support with transaction IDs

## Dashboards & Monitoring

- **Main dashboard:** https://datadog.company.com/dashboard/payments-overview
- **Alerts:** https://datadog.company.com/monitors?q=tag:service:payments
- **Logs:** https://datadog.company.com/logs?query=service:payments

## Deployment & Rollback

### Rollback to last stable version

```bash
kubectl rollout undo deployment/payment-service -n payments
```

### Check rollout status

```bash
kubectl rollout status deployment/payment-service -n payments
```

## Contacts & Escalation

| Role | Name | Slack | Phone |
|------|------|-------|-------|
| On-Call Lead | @payments-lead | #payments-oncall | See PagerDuty |
| CTO | Alex Chen | @alex | 555-0123 |
| VP Eng | Jordan Lee | @jordan | 555-0124 |

---

**Last updated:** 2026-03-25
**Next review:** 2026-04-25
```

**Runbook best practices:**
- Written for someone unfamiliar with the system (new hire, 3 AM)
- Step-by-step, not essays
- Include actual commands (don't make ops person guess)
- Link to dashboards, not screenshots (screenshots go stale)
- Update frequently, especially after incidents
- Include customer-facing issues (support tickets, complaints)

---

## API Documentation

Format for REST API documentation. (Similar for GraphQL or gRPC.)

```markdown
# Payments API

**Base URL:** https://api.example.com/v1
**Authentication:** Bearer token (see [[API Keys]])
**Rate limit:** 1000 req/min per API key

## Endpoint: Create Charge

**POST** `/charges`

### Request

```json
{
  "amount_cents": 2999,
  "currency": "USD",
  "customer_id": "cus_123",
  "description": "Premium subscription",
  "idempotency_key": "order-456-attempt-1"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount_cents | integer | Yes | Amount in cents (e.g., 2999 = $29.99) |
| currency | string | Yes | ISO 4217 code (USD, EUR, etc.) |
| customer_id | string | Yes | Customer ID in system |
| description | string | No | Human-readable note |
| idempotency_key | string | No | Unique key for request de-duplication |

### Response: 201 Created

```json
{
  "id": "ch_1234567890",
  "amount_cents": 2999,
  "currency": "USD",
  "customer_id": "cus_123",
  "status": "succeeded",
  "created_at": "2026-03-25T14:30:00Z",
  "stripe_transaction_id": "txn_stripe_123"
}
```

### Response: 400 Bad Request

```json
{
  "error": "invalid_request_error",
  "message": "amount_cents must be >= 100",
  "param": "amount_cents"
}
```

### Response: 402 Payment Required

```json
{
  "error": "card_error",
  "message": "Your card's expiration year is invalid.",
  "decline_code": "expired_card",
  "param": "card"
}
```

### Response: 429 Too Many Requests

Rate limit exceeded. Retry after `Retry-After` header.

### Example: cURL

```bash
curl -X POST https://api.example.com/v1/charges \
  -H "Authorization: Bearer sk_live_abc123" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: order-456-attempt-1" \
  -d '{
    "amount_cents": 2999,
    "currency": "USD",
    "customer_id": "cus_123",
    "description": "Premium subscription"
  }'
```

### Example: Node.js

```javascript
const response = await fetch('https://api.example.com/v1/charges', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_abc123',
    'Content-Type': 'application/json',
    'Idempotency-Key': 'order-456-attempt-1'
  },
  body: JSON.stringify({
    amount_cents: 2999,
    currency: 'USD',
    customer_id: 'cus_123'
  })
});

const charge = await response.json();
console.log(charge.id); // ch_1234567890
```

## Error Codes

| Code | Status | Meaning | Action |
|------|--------|---------|--------|
| invalid_request_error | 400 | Missing or invalid parameter | Fix request body and retry |
| card_error | 402 | Card declined | Ask customer for different card |
| rate_limit_error | 429 | Rate limit exceeded | Exponential backoff + retry |
| authentication_error | 401 | Missing or invalid API key | Check API key in request |
| api_error | 500 | Server error | Retry with exponential backoff |

## Pagination

Endpoints returning multiple items support pagination:

```bash
curl "https://api.example.com/v1/charges?limit=10&offset=20"
```

Returns:
```json
{
  "data": [...],
  "meta": {
    "total": 1000,
    "limit": 10,
    "offset": 20
  }
}
```

Use `offset` to get next page: `offset += limit`
```

**API doc best practices:**
- One endpoint per section
- Show request & response, with real field values (not fake placeholders)
- Include error responses and error codes
- Provide client library examples (cURL, JavaScript, Python)
- Document rate limits and auth model upfront
- Link to error reference and troubleshooting
- Keep examples up-to-date (old examples break trust)

---

## Writing Principles

### One idea per paragraph
**Bad:**
> The system supports two authentication methods: API keys and OAuth. API keys are simple to use and good for server-to-server. OAuth is more secure for user-facing apps because it doesn't expose the secret.

**Good:**
> The system supports two authentication methods: API keys and OAuth.

> Use API keys for server-to-server communication (services that trust each other).

> Use OAuth for user-facing apps where users should not share secrets.

### Active voice over passive
**Bad:** "The API is called when a charge is created by a webhook listener, and then the database is updated."

**Good:** "When a charge is created, the webhook listener calls the API and updates the database."

### Code examples over prose
**Bad:** "To get the current user, you would typically make a GET request to the `/users/me` endpoint with your API key in the Authorization header."

**Good:**
```bash
curl https://api.example.com/v1/users/me \
  -H "Authorization: Bearer $API_KEY"
```

### Keep it current
- Review and update docs quarterly
- Mark docs as outdated if system changed but docs haven't
- Link to code (if auto-generated) rather than maintaining separate copy

---

## Common Anti-Patterns

🚫 **Outdated docs:** Docs from 2 years ago that say "we use Postgres" but you switched to MongoDB. Worse than nothing.

🚫 **No examples:** 50 paragraphs describing an API with no code sample. User goes to competitor.

🚫 **Wall of text:** Dense paragraph with no headings, lists, or whitespace. Unreadable.

🚫 **Missing context:** "Call the API to get the user." Which API? What user? Authentication required?

🚫 **Copy-paste without review:** Docs saying "if you have questions, email support@oldcompany.com" from template.

🚫 **Outdated screenshots:** UI changed but old screenshot still there. Confuses readers.

---

See also: [[CON-code-review-checklist]], [[CON-branch-commit-format]]
