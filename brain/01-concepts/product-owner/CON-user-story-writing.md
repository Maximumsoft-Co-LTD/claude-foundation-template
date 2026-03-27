---
type: concept
tags: [product-owner, user-story, AC, INVEST, backlog]
related: [CON-acceptance-criteria, CON-product-backlog-management]
updated: 2026-03-25
source: template
---

# User Story Writing

## Format

```
As a [type of user],
I want [some goal or action],
So that [benefit / reason / value].
```

**Examples:**
```
As a registered customer,
I want to filter products by price range,
So that I can find items within my budget quickly.

As an admin,
I want to export user data as CSV,
So that I can analyze engagement in Excel.
```

## Acceptance Criteria (ACs)

ACs define **done** for a user story — clear, testable conditions.

### Given/When/Then Format (BDD Style)

```
Given [precondition / context]
When  [action / event]
Then  [expected outcome]

Example:
  Given I am logged in as a registered user
  When I apply a "price: $0-$50" filter on the products page
  Then only products with price ≤ $50 should be visible
  And the product count should update to reflect the filter
  And the URL should update with ?maxPrice=50
```

### Bullet Format (Simple)

```
Acceptance Criteria:
  - User can filter by price range ($0-$50, $50-$100, $100+)
  - Multiple filters can be applied simultaneously
  - Filter state persists on page refresh (URL params)
  - Removing a filter shows all products again
  - Filter is keyboard accessible
```

## INVEST Criteria (Good Story Test)

| Letter | Question |
|--------|---------|
| **I**ndependent | Can this be developed without another story? |
| **N**egotiable | Are details flexible and discussable? |
| **V**aluable | Does this deliver value to a user or business? |
| **E**stimable | Can the team size this in story points? |
| **S**mall | Can it be done in one sprint? |
| **T**estable | Do the ACs tell us how to verify it? |

## Story Splitting Patterns

When a story is too big (13 points), split by:

| Pattern | Example |
|---------|---------|
| Happy path first | "User can log in" → split error handling stories |
| By user type | "Any user can search" → registered vs guest |
| By CRUD | "Manage products" → Create / Read / Update / Delete each |
| By UI + API | Complex features can split FE + API (rare, avoid) |
| By platform | Desktop vs mobile experience |
| By data variation | "Apply discount" → % vs flat amount |

## Anti-patterns

| Anti-pattern | Problem |
|-------------|---------|
| Technical stories ("Refactor DB") | No user value — use task or spike |
| Stories without ACs | Team doesn't know when done |
| Epic as story ("Shopping cart") | Too big — breaks INVEST |
| "System does X" (no user) | Missing who and why |
| AC: "Works correctly" | Not testable |

## Related

- [[CON-acceptance-criteria]] — writing great ACs
- [[CON-product-backlog-management]] — where stories live
- [[../agile/CON-scrum-artifacts]] — stories in Product Backlog
- [[../../../00-MOC/MOC-Product-Owner]]
