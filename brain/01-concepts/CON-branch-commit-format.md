---
type: concept
tags: [git, conventions, branch, commit]
related: [CON-task-id-format]
updated: 2026-03-25
---

# Branch & Commit Format

## Branch Format

```
[sprint-id]/[task-id]-[short-description]
```

**Examples:**
```
SP1/SP1-T001-user-login
SP2/SP2-T005-product-search-filter
```

**Rules:**
- One branch per task
- No direct commits to `main`
- Always branch from the latest `main`

## Commit Format

```
[task-id] type: short description (max 72 chars)
```

**Types:**
| Type | When |
|------|------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `test` | Adding/updating tests |
| `docs` | Documentation changes |
| `refactor` | Code restructure, no behavior change |
| `chore` | Build, config, tooling |

**Examples:**
```
SP1-T001 feat: add user login with JWT
SP1-T001 test: add integration tests for login endpoint
SP2-T005 fix: product filter not applying correctly
```

## Why This Format

- Task ID in commit makes `git log` readable as a sprint history
- Type prefix enables automated changelog generation
- Max 72 chars keeps commit titles readable in all tools

## Related

- [[CON-task-id-format]] — how task IDs are structured
- [[../00-MOC/MOC-Architecture]] — full conventions overview
