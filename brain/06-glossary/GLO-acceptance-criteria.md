---
type: glossary
term: Acceptance Criteria (AC)
tags: [agile, user-stories, testing, product-owner, QA]
updated: 2026-03-25
---

# Acceptance Criteria

Specific, testable conditions that define when a user story is complete and ready for Product Owner acceptance.

**Standard format:** Gherkin (Given / When / Then)
```
Given [initial state]
When [user action]
Then [expected outcome]
```

**Characteristics:** Explicit, testable, covers happy path + error cases, independent of each other.

**Bad AC:** "The system should be performant" (too vague, not testable)
**Good AC:** "Given a valid reset link, When user enters new password, Then password is updated and old one rejected"

**Contrast with:** Tasks (engineering work without user-visible value)

## See Also

- [[CON-acceptance-criteria]] — Full AC format guide, Gherkin patterns, good vs bad examples
- [[CON-user-story-format]] — How to write user stories with well-formed AC
- [[CON-definition-of-done]] — Team agreement on when a story is truly done
- [[CON-qa-process]] — How AC map to test cases and QA verification
