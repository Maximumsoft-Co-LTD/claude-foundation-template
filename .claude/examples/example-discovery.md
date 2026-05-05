# disc-007 — Google OAuth Sign-In

> **This is a worked example.** Use it as a reference for what a filled-in `docs/discovery/[disc-id]-[name].md` looks like. Optional sections (Personas, Event Storming, SIPOC, Glossary) are omitted because this scope doesn't need them.

## Metadata
| Field | Value |
|-------|-------|
| **Discovery ID** | disc-007 |
| **Status** | backlog |
| **Date** | 2026-04-21 |
| **Scenario** | integration |
| **Requester** | Priya (PM) |
| **Facilitator** | flame |

---

## 1. Problem Statement

**Problem:** New users abandon signup at the password-creation step (38% drop-off, last 90 days). Existing users hit "forgot password" 14× more than they hit any other auth event, and support tickets correlate.

**Who is affected:** Free-tier signups (12k/month) and any user returning after a long gap. Pro-tier users are less affected because their org provisions them via SSO.

**Current workaround (if any):** None — users either create a password or leave.

---

## 2. Affected Users & Stakeholders

| Role | Impact | Notes |
|------|--------|-------|
| Prospective free-tier user | High | Abandons at password step. |
| Returning lapsed user | High | Forgot-password flow is friction. |
| Support team | Medium | 30% of weekly tickets are password resets. |
| SecOps | Medium | Owns password policy and breach response. |

---

## 4. Goals & Success Criteria

| Goal | Success Metric | How to Measure |
|------|---------------|----------------|
| Reduce signup abandonment | Free-tier signup completion ≥ 78% (from 62%) | Funnel analytics — `signup_started → signup_completed` |
| Reduce password-reset support load | Forgot-password tickets / week ≤ 40% of current | Support ticket tag count |
| No new auth incidents | Zero auth-related security incidents in 60 days post-launch | SecOps incident log |

---

## 5. Current User Journey (As-Is)

```
landing → click "Sign Up" → enter email → enter password (12+ chars, mixed) → verify email → onboarding
                                                  ▲
                                                  └ 38% drop here
```

**Pain points identified:**
- Password requirements feel hostile.
- Returning users don't remember which email/password combo they used.

---

## 6. Future User Journey (To-Be)

```
landing → click "Continue with Google" → Google consent → onboarding
                                              ▲
                                              └ existing email match → log in
```

**Improvements over As-Is:**
- No password creation for the OAuth path. Email/password remains an option.
- Returning users matched by email — no parallel account.

---

## 7. Context & Background

We use NextAuth on the FE; the BE is a Go service with a `users` table keyed on email. We've integrated Stripe (OAuth-style flow already proven). Past attempt to add Apple Sign-In stalled in 2024 — see `LES-014` for the lesson on app-store review impact (does not apply here, web-only).

---

## 8. Constraints

- **Technical:** must extend existing `users` table — no separate identity store. Supports linking later (Apple, GitHub) so don't bake Google-only assumptions in.
- **Business:** ship before mid-Q3 to align with growth campaign.
- **Timeline:** 1 sprint, 2 engineers.
- **UX:** Google branding follows their guidelines; "Continue with Google" button placement above email field.
- **Compliance:** OAuth tokens never stored client-side; refresh tokens encrypted at rest.

---

## 11. Proposed Approaches

### Option A: NextAuth with the Google provider
- **Description:** Use NextAuth's `GoogleProvider` on the FE; BE exposes `/auth/google/callback` that consumes the `id_token`, looks up / creates the user, and issues our own session JWT.
- **Pros:** Battle-tested library; handles consent, state, PKCE. Aligns with existing FE auth shape.
- **Cons:** Some opacity on token refresh — need explicit handling for expired Google tokens.
- **Estimated effort:** 3 days FE + 3 days BE.

### Option B: Roll our own OAuth client
- **Description:** Direct calls to Google's OAuth 2.0 endpoints; manage state, PKCE, token exchange ourselves.
- **Pros:** Full control over flow.
- **Cons:** More code to own and review for security; we'd be re-deriving NextAuth's logic.
- **Estimated effort:** 7 days, plus security review week.

---

## 12. Decision Log
| # | Date | Decision | Rationale | Alternatives Rejected | Decided by |
|---|------|----------|-----------|----------------------|------------|
| 1 | 2026-04-21 | Adopt Option A (NextAuth + Google Provider) | Lower delivery risk, well-supported lib, matches existing FE patterns | Option B (rejected — re-implementing security primitives is not core competency) | flame, Priya |

**Current chosen approach:** Option A.

---

## 13. Unknowns & Open Questions

- [ ] Q1: For users who currently have email/password and now sign in via Google with the same email — auto-link, or prompt to confirm? → **Resolved:** auto-link, log the link event.
- [ ] Q2: Do we still expose email/password signup, or hide it behind "Other options"? → **Open** (decide in `/new-sprint` Step 3 when scoping the FE story).

---

## 14. Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Google API outage during launch week | low | high | Email/password remains available; statuspage notice ready |
| Account takeover via stolen Google session | low | high | Re-auth required for security-sensitive actions; 30-day refresh cap |
| Email collision (Google email ≠ existing user email) | medium | medium | Auto-link on exact match, prompt on near-match (different domain) |

---

## 15. Scope Estimate

- **Estimated sprints:** 1
- **v1 scope (must-have):** "Continue with Google" on signup + login pages; create-or-link user; issue session JWT; logout.
- **v2 scope (nice-to-have):** Apple Sign-In, GitHub Sign-In, account-linking UI in settings.
- **Explicitly out of scope:** SSO/SAML for enterprise (separate epic).

---

## 16. Epic Breakdown
<!-- Single-epic discovery — table left empty per .claude/rules/discovery-epic-mapping.md -->

| # | Epic Title | One-line Scope | Depends On | Priority |
|---|-----------|---------------|------------|----------|

**Shared entities / cross-epic concerns:** none — this discovery is single-epic.

---

## 18. Next Steps

- [x] Resolve all open questions (Q1 resolved; Q2 deferred to story scoping)
- [x] Get stakeholder sign-off on chosen approach
- [x] Update status to `backlog`
- [ ] When ready → `/new-sprint SP3 "Google OAuth Sign-In"`
