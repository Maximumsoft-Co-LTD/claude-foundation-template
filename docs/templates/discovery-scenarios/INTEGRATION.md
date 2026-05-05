# Discovery — Integration (external system)

For epics that connect to a third party (payment, email, identity provider, analytics, partner API, webhook source).

Scenario-specific prompts for the 10 discovery topics. Use alongside `DISCOVERY-TEMPLATE.md`.

## 1 · Problem
- What capability does the external system give us that we can't build (or shouldn't rebuild)?
- Why this provider over alternatives?

## 2 · Users & Stakeholders
- End-user role consuming the integrated capability.
- Internal owner: who responds when the external system is down.
- Vendor account ownership and support escalation path.

## 3 · Goals & Success
- Functional outcome (feature works for users).
- SLO commitment we make on top of the external system's SLA (cap, retry, fallback).
- Auditability: which calls / responses are logged.

## 4 · As-Is
- How is this currently handled (manual ops, custom code, none)?

## 5 · To-Be
- Integration shape: API client, webhook receiver, queue consumer, batch import.
- Sequence diagram of the happy path. List all retry / failure branches.

## 6 · Context & Background
- Past integrations with this vendor or similar (lessons, gotchas).
- Internal libraries / clients we already have that we should reuse.

## 7 · Constraints
- **External contract**: protocol (REST / gRPC / GraphQL / SOAP), auth model, rate limits, data residency, SLA.
- **Idempotency** required keys (so retries don't double-charge / double-send).
- **Failure modes** to handle: 4xx, 5xx, timeout, partial response, schema drift.
- **Secrets management**: where API keys / certs live, rotation policy.
- Compliance: PII boundaries, data export, sub-processor disclosure.

## 8 · Approaches
- Direct vs. via a queue (decouple our latency from theirs).
- Shared client lib vs. inline calls (reuse vs. independence).
- Pull (polling) vs. push (webhook) — and what we own when one side is down.

## 9 · Unknowns & Open Questions
- Sandbox credentials — do we have them, who provisions?
- Test data: does the vendor support test fixtures, or do we need our own mock?

## 10 · Risks & Scope
- **Vendor outage** — graceful degradation strategy.
- **Schema drift** — how do we detect breaking changes (typed client, contract test, monitoring).
- Sprint count. Webhook + write-path + reconciliation usually splits across multiple sprints — list as separate epics in the Epic Breakdown.
