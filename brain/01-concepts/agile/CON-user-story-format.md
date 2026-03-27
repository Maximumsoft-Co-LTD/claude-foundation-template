---
type: concept
tags: [agile, user-stories, scrum, product-owner]
related: [CON-user-story-writing, CON-acceptance-criteria, CON-product-backlog-management, CON-scrum-artifacts]
updated: 2026-03-25
source: template
---

# User Story Format

## Core Template

The standard user story format is:

```
As a [role/persona],
I want [goal/capability],
so that [benefit/value].
```

**Example:** "As a customer, I want to save items to a wishlist, so that I can purchase them later."

## INVEST Criteria

A well-formed story is **INVEST** compliant:

- **Independent:** The story stands alone; minimal dependencies on other stories.
- **Negotiable:** Details can be refined through conversation (not a fixed contract).
- **Valuable:** Delivers tangible business or user value.
- **Estimable:** The team can size it relative to others; not too vague.
- **Small:** Completable in one sprint (typically 2-8 days of effort).
- **Testable:** Clear acceptance criteria define what "done" means.

Non-INVEST stories (bloated, vague, high-dependency) should be broken down before estimation.

## Story Splitting Techniques (SPIDR)

When a story is too large (8+ points), use SPIDR to break it:

### **S — Spike** (Learning / Risk Reduction)
Split off research or PoC work that reduces uncertainty.
- Original: "Implement real-time collaboration features"
- Spike: "Research WebSocket libraries and latency constraints" (1–2 points)
- Story: "Build real-time cursor tracking" (5 points, after spike)

### **P — Path** (Happy Path vs. Edge Cases)
Separate the main flow from error handling or alternate paths.
- Original: "User registration with email, SMS, and backup codes"
- Path 1: "Email-based registration (happy path)" (3 points)
- Path 2: "SMS and backup code alternatives" (3 points)

### **I — Interface** (Different UI/API Entry Points)
One story per interface (web UI, API, mobile, etc.).
- Original: "Admin dashboard analytics (web + mobile)"
- Story 1: "Web dashboard analytics view" (5 points)
- Story 2: "Mobile analytics view" (5 points)

### **D — Data** (Scope of Data Handled)
Limit by data size, complexity, or structure.
- Original: "Export user data in CSV, JSON, XML formats with full history"
- Story 1: "Export current user data as CSV" (3 points)
- Story 2: "Export with historical data and format options" (5 points)

### **R — Rules** (Business Rules / Workflows)
One story per rule or workflow variant.
- Original: "Payment processing (credit card, PayPal, debit, crypto)"
- Story 1: "Credit card payment processing" (5 points)
- Story 2: "PayPal integration" (5 points)
- Story 3: "Alternative payment methods" (3 points)

## Hierarchy: Epic → Feature → Story → Task → Bug

| Term | Scope | Duration | Owned By |
|------|-------|----------|----------|
| **Epic** | Large capability (e.g., "User Authentication") | 4–12 weeks | Product Owner |
| **Feature** | Shipping unit within an epic (e.g., "Email Login") | 1–3 sprints | Product Owner |
| **User Story** | Deliverable in one sprint (e.g., "User can reset password") | 2–5 days | Dev Team |
| **Task** | Engineering work without user-facing value (e.g., "Refactor auth module") | 1–3 days | Dev Team |
| **Bug** | Defect in existing functionality | Variable | Reported by QA/Users |

## Good Story vs. Bad Story

### Bad Story ❌
- **"User authentication"** — Too vague, too big, not estimable.
- **"Build login feature"** — No role, no benefit, no acceptance criteria.
- **"Support multiple SSO providers"** — Dependent on too many unknowns; needs a spike.

### Good Story ✅
- **"As a returning customer, I want to log in with my email and password, so that I can access my saved orders."**
  - Role defined (returning customer)
  - Clear goal (email/password login)
  - Business value (access saved orders)
  - Estimable and testable
  - Splittable (social login, forgot password → separate stories)

## Acceptance Criteria (Definition of Done)

Every story includes AC that defines when it's complete. Use [[CON-acceptance-criteria|Gherkin format (Given/When/Then)]]:

```
Given the user is on the login page
When they enter a valid email and password
Then they are redirected to the dashboard
And a session token is stored in localStorage
```

## Story Sizing Workflow

1. **Discovery:** Team discusses the story to clarify assumptions.
2. **Break it down:** Apply SPIDR if estimated > 8 points.
3. **Write AC:** Define testable conditions.
4. **Estimate:** Team votes using story points (Fibonacci: 1, 2, 3, 5, 8, 13).
5. **Commit:** Story ready for sprint planning.

## Avoiding Common Pitfalls

- **Conflating tasks and stories:** Tasks have no user value; keep them separate.
- **Writing stories for technology:** "Upgrade Node.js" is a task, not a story.
- **Over-specifying:** Let the team negotiate implementation details during refinement.
- **Dependent stories:** If story B can't start until story A is done, they should be one story.
- **Unmeasurable AC:** "The system should be fast" is not testable; use metrics ("< 200ms load time").

## See Also

- [[CON-acceptance-criteria]] — How to write Gherkin-style acceptance criteria
- [[CON-product-backlog-management]] — Backlog creation and refinement
- [[CON-scrum-ceremonies]] — Story refinement and sprint planning meetings
