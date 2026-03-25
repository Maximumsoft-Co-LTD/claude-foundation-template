---
type: concept
tags: [task-id, conventions, global-id]
related: [CON-branch-commit-format, CON-sprint-lifecycle]
updated: 2026-03-25
---

# Task ID Format

## Format

```
Sprint ID:  SP[N]            → SP1, SP2, SP3
Task ID:    SP[N]-T[NNN]     → SP1-T001, SP2-T003
Discovery:  disc-[NNN]-[name]→ disc-001-user-authentication
```

## The Global Counter Rule

**Task numbers never reset across sprints.**

If SP1 ends at T005, SP2 starts at T006. This means:
- Task IDs are globally unique across the entire project history
- You can search any commit, doc, or branch and find the originating task
- No ambiguity between "T001 in SP1" vs "T001 in SP2" — they're different tasks

## Enforcement

`/new-sprint` reads all existing task IDs from `BACKLOG.md` and finds the highest `T[NNN]` before assigning new ones.

## Usage in Docs

Every file in `docs/sprints/` is named with its task ID prefix:
```
SP1-T001-requirement.md
SP1-T001-frontend.md
SP1-T001-backend.md
SP1-T001-retro.md
```

## Related

- [[CON-branch-commit-format]] — task ID used in branch and commit names
- [[CON-document-structure]] — task ID used in all doc file names
