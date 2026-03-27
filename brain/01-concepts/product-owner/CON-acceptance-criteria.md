---
type: concept
tags: [product-owner, acceptance-criteria, user-stories, gherkin]
related: [CON-user-story-writing, CON-definition-of-done, CON-sprint-planning-po]
updated: 2026-03-25
source: template
---

# Acceptance Criteria

Acceptance Criteria (AC) define the conditions that must be met for a user story to be considered complete. They serve as the contract between Product Owner, developers, and QA.

## Definition

Acceptance Criteria are testable conditions that specify when a story is "done." They translate vague user needs into concrete, verifiable requirements that guard against ambiguity and scope creep.

**Key distinction:**
- **User Story** = What we're building and why
- **Acceptance Criteria** = How we know it works

## Gherkin Format (Given/When/Then)

The most popular format uses Gherkin syntax, which naturally aligns with TDD and automation:

```gherkin
Given [initial context/state]
When [user performs action]
Then [expected outcome/assertion]
```

**Example:**
```gherkin
Story: User registers for an account

AC 1:
Given I am on the registration page
When I enter a valid email and password
Then my account is created and I receive a confirmation email

AC 2:
Given I am on the registration page
When I enter an email already in use
Then I see an error message and the form is not submitted

AC 3:
Given I have entered my details
When I click "Register"
Then I am logged in automatically
```

## SMART Criteria

Write AC that are:
- **Specific** — No ambiguity; describe the exact behavior
- **Measurable** — Quantifiable or testable (not "should be fast")
- **Achievable** — Realistic within one sprint
- **Relevant** — Directly tied to the user story value
- **Time-bound** — Completable in the sprint

**Bad AC:** "The page should load quickly"
**Good AC:** "The page should load in < 2 seconds on 3G network"

## DoD vs AC

| Definition of Done (DoD) | Acceptance Criteria (AC) |
|---|---|
| Team-level quality gate | Story-specific requirements |
| Applies to ALL stories | Varies by story |
| Code reviewed, tested, documented | Functional behavior verified |
| Static (rarely changes) | Dynamic (per story) |

**Example:**
- DoD: "Code passes linting, has >80% test coverage, reviewed by peer"
- AC: "When user clicks 'Save', data persists and success message appears"

## Good vs Bad Criteria

**Bad AC (vague):**
- "The login should work correctly"
- "Users should be able to update their profile"
- "The system should handle errors gracefully"

**Good AC (testable):**
- Given valid credentials, when user clicks Login, then session token is set and user redirected to dashboard
- Given a user on /profile, when they edit their name and click Save, then profile updates within 2 seconds and shows success toast
- Given a failed API call, when user retries within 60 seconds, then the request is automatically resent; if > 60 seconds, user sees a manual retry button

## Checklist for Product Owners

When writing AC, verify:

- [ ] Each AC is **independent** — order doesn't matter
- [ ] AC use **Gherkin structure** — Given/When/Then format
- [ ] **No AND/OR** — Split complex conditions into separate AC
- [ ] **Testable** — Developer + QA can verify without guessing
- [ ] **Achievable** — Can be done in one sprint
- [ ] **Happy path + edge cases** — Include success and failure scenarios
- [ ] **Non-functional** — Performance/security criteria included if relevant
- [ ] **Team reviewed** — Dev confirms it's clear before sprint starts
- [ ] **Definition of Ready** — AC drives the "ready for dev" check

## Common Pitfalls

1. **Too many AC per story** → Story is too large; break into smaller stories
2. **AC that are implementation details** → "Store password hashed in DB" belongs in technical design, not AC
3. **Missing edge cases** → Include negative cases, boundary conditions
4. **Writing AC as a developer task list** → "Create login component, add validation..." is implementation, not acceptance

## Related References

See [[CON-user-story-writing]] for full story structure and [[CON-definition-of-done]] for team-wide quality standards.
