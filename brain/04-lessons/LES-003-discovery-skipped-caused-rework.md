---
type: lesson
id: LES-003
sprint: example
tags: [discovery, scope, planning]
source: template-example
---

# LES-003 — Skipping /discovery on a "Simple" Feature Led to Mid-Sprint Scope Expansion

## What Happened

Feature seemed obvious — "add email notifications." Skipped discovery. Mid-sprint, found the email provider needed OAuth setup, the user model lacked an email-verified field, and the notification design conflicted with existing preferences logic. Sprint extended by 3 days.

## What We Learned

"Simple" features often sit on top of unexamined dependencies. /discovery surfaces those in 30 minutes instead of mid-sprint.

## Rule Going Forward

Always run /discovery before /new-sprint, even for features that feel obvious.

## Related

- [[../03-patterns/PAT-003-discovery-before-sprint]]
- [[../01-concepts/CON-sprint-lifecycle]]
