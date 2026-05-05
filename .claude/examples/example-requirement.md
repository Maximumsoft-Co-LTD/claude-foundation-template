# SP3-T032 — Returning user OAuth auto-link

> **This is a worked example.** A 3-pt fullstack story showing what the `[task-id]-requirement.md` looks like once filled. Sections that don't apply at 3pt (Performance, Analytics, Caching, Class Diagram, etc.) are omitted per the requirement points table.

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | SP3-T032 |
| **Sprint** | SP3 |
| **Task Type** | fullstack |
| **Points** | 3 |
| **Estimate** | 2 days |
| **Owner** | jordan |
| **Origin** | docs/sprints/SP3/SP3-overview.md |

---

## User Story

> **As a** returning user with an existing email/password account,
> **I want** clicking "Continue with Google" to log me into my existing account when my Google email matches,
> **so that** I don't end up with duplicate accounts and lose my data.

## Problem Statement

When SP3-T031 ships, any user who clicks "Continue with Google" — even one who already has an email/password account at the same email — gets a brand-new account because BE always creates on first sight. This produces duplicate accounts, splits user data, and confuses returning users.

## Overview

On callback, look up `users` by `email == google.email` (case-insensitive). If a row exists, link the Google identity to that row instead of creating a new one. Emit an `oauth_link` audit event.

## Value

Eliminates the only known way to land on duplicate accounts. Improves the returning-user re-entry experience without any extra UI.

---

## Acceptance Criteria

- **AC-1:** Existing user `priya@example.com` (email/password) clicking "Continue with Google" with the same Google email is logged into her existing account, no new row created in `users`.
- **AC-2:** The link is recorded in `audit_log` as event `oauth_link` with `provider=google`, `actor_id=priya.id`.
- **AC-3:** Email match is case-insensitive: `Priya@example.com` Google email matches `priya@example.com` existing user.
- **AC-4:** When no existing user matches, behavior falls through to SP3-T031's create-new-user path (regression).
- **AC-5:** If the existing user is `status=banned`, sign-in is rejected with HTTP 403 and no audit-log link event is written; a `oauth_blocked` audit event is written instead.

## Definition of Done

- [ ] All 5 ACs satisfied with passing tests.
- [ ] No new database tables or columns required.
- [ ] Spec review and quality review both `APPROVED`.
- [ ] FE smoke walkthrough evidence saved (the button still works, success lands on `/dashboard`).
- [ ] Audit log coverage manually verified against AC-5 (banned-user path).

## Out of Scope

- Linking by phone or any non-email identifier.
- A user-visible UI for un-linking Google later (separate story).

---

## Existing Code Context

- `pkg/auth/google_callback.go` — created by SP3-T031. Currently always creates a new user; this story adds the lookup branch.
- `pkg/users/repo.go` — `FindByEmail(ctx, email)` exists. Already lowercases input.
- `pkg/audit/log.go` — `Append(ctx, AuditEvent)` exists. New event type `oauth_link` to be added to the enum.
- FE: `apps/web/src/auth/callback.tsx` — no FE change required for this story; the BE response already shapes the authed session correctly.

## API Contracts Consumed (FE)

N/A — fe-only test path covers the existing `/auth/google/callback` response unchanged.

## API Endpoints (BE)

`POST /auth/google/callback` (existing, behavior extended)

Request body:
```json
{ "id_token": "<JWT from Google>" }
```

Response (200):
```json
{ "user_id": "uuid", "email": "priya@example.com", "linked": true | false }
```

Errors:
- `403 user_banned` — AC-5 path.
- `400 invalid_token` — Google id_token failed verification (existing).

---

# 3 · Frontend Design

`N/A — be-only behavior change`. The existing FE flow is unchanged. The smoke walkthrough is still required to confirm no regression in the visible flow.

# 4 · Backend Design

## Service / Layer Breakdown

```
google_callback handler
  ├── verify id_token  (existing)
  ├── extract google_email
  ├── users.FindByEmail(lower(google_email))    ← new branch
  │     └── found     → check status, then link OR reject
  │     └── not found → existing create path
  └── issue session JWT
```

## Business Logic

```
fn handleGoogleCallback(idToken):
  email = lower(verify(idToken).email)
  existing = users.FindByEmail(email)
  if existing:
    if existing.status == 'banned':
      audit.Append(oauth_blocked, actor=existing.id, provider=google)
      return 403 user_banned
    audit.Append(oauth_link, actor=existing.id, provider=google)
    return issueSession(existing)
  // existing SP3-T031 create path
  newUser = users.Create(email)
  audit.Append(oauth_signup, actor=newUser.id, provider=google)
  return issueSession(newUser)
```

## Error Handling Strategy

- `users.FindByEmail` errors → 500, do not link, do not create.
- `audit.Append` errors → log WARN, alert SecOps via existing pager hook, but DO issue the session (consistent with SP3-T033 AC-2).

## Authorization & Roles

The endpoint remains public (no prior session required). New: banned users explicitly rejected (AC-5).

---

## Implementation Plan

| Engineering task | Subtasks | Status |
|------------------|----------|--------|
| Add lookup branch to handler | <ul><li>[ ] Write failing test for AC-1 (existing email/password user logs in via Google)</li><li>[ ] Add `users.FindByEmail` call before create</li><li>[ ] Branch on found / not-found</li><li>[ ] Run test → green</li></ul> | todo |
| Audit-log event types | <ul><li>[ ] Add `oauth_link` and `oauth_blocked` to event enum</li><li>[ ] Update audit log unit tests</li></ul> | todo |
| Banned-user rejection | <ul><li>[ ] Failing test for AC-5</li><li>[ ] Add status check after lookup</li><li>[ ] Append `oauth_blocked` event</li><li>[ ] Return 403</li></ul> | todo |
| Case-insensitive match | <ul><li>[ ] Failing test for AC-3</li><li>[ ] Confirm `users.FindByEmail` lowercases (it does — add comment for the next reader)</li></ul> | todo |
| Regression — new-user path | <ul><li>[ ] Failing test for AC-4</li><li>[ ] Confirm fallthrough still creates and emits `oauth_signup`</li></ul> | todo |

---

## TDD Test Plan

### [BE] TDD Tests

| # | Test name | AC | RED → GREEN |
|---|-----------|----|--|
| 1 | `TestGoogleCallback_LinksExistingUser_ByEmail` | AC-1 | TBD |
| 2 | `TestGoogleCallback_AppendsOAuthLinkAuditEvent` | AC-2 | TBD |
| 3 | `TestGoogleCallback_LinksCaseInsensitively` | AC-3 | TBD |
| 4 | `TestGoogleCallback_CreatesNewUser_WhenNoMatch` | AC-4 | TBD |
| 5 | `TestGoogleCallback_RejectsBannedUser_WithOAuthBlockedEvent` | AC-5 | TBD |

Real DB fixtures (no mocks at integration layer, per `.claude/rules/testing.md`).

## E2E Test Plan

| # | Scenario | AC |
|---|----------|----|
| E1 | Existing email/password user signs in via Google → lands on dashboard, single user row in DB | AC-1, AC-3 |
| E2 | Banned user signs in via Google → sees "Account suspended" message, no session issued | AC-5 |

---

## Open Questions

None — all questions from `disc-007` Q1 are resolved (auto-link on exact email).
