---
description: Generate a user-friendly changelog from sprint commits and task retros
allowed-tools: Read, Bash(git log *), Bash(git tag *)
disable-model-invocation: false
---

# /changelog
Workflow position: **/retro-sprint → START (optional)**

Generate a user-facing changelog from the sprint's git commits and task retros. Converts technical commit messages into readable release notes grouped by change type.
Arguments: `[sprint-id] [version]`  — e.g. `SP3 v1.4.0`
`[version]` is optional — omit to use `[sprint-id]` as the release label.

---

## Step 1 — Validate and collect

Parse `[sprint-id]` and optional `[version]`.

Read `docs/BACKLOG.md` — collect all task IDs in `[sprint-id]` with status `done`.
If any task not `done` → warn but continue (include completed tasks only).

Run in parallel:
```bash
git log main --oneline --since="[sprint-start-date]"   # all commits in sprint window
git log --oneline --grep="[sprint-id]"                 # commits tagged with sprint ID
git tag --list                                         # existing version tags
```

---

## Step 2 — Read task retros

For each done task, read `docs/sprints/[sprint-id]/[task-id]/[task-id]-retro.md`:
- Task title
- Actual deliverable summary (what was built, not how)
- Any issues filed (for known limitations section)

Also read `docs/sprints/[sprint-id]/[sprint-id]-retro.md` if it exists — for sprint-level summary.

---

## Step 3 — Classify commits

Map each commit to a user-facing category:

| Commit type | Changelog section |
|-------------|------------------|
| `feat` | ✨ New Features |
| `fix` | 🐛 Bug Fixes |
| `perf` | ⚡ Performance |
| `refactor` (user-visible) | 🔧 Improvements |
| `refactor` (internal only) | skip |
| `test`, `chore`, `docs` | skip (internal) |
| `security` | 🔒 Security |
| `breaking` | ⚠️ Breaking Changes |

For each kept commit, rewrite the message in plain language:
- Remove technical jargon
- Focus on user benefit, not implementation detail
- "Users can now X" not "Added X handler to Y service"

---

## Step 4 — Write changelog entry

Append to `docs/CHANGELOG.md` (create if it doesn't exist):

```markdown
## [version] — [YYYY-MM-DD]

> [1–2 sentence sprint summary for non-technical readers]

### ✨ New Features
- [User-facing description] ([task-id])
- ...

### 🐛 Bug Fixes
- [What was broken and what is fixed] ([task-id])
- ...

### ⚡ Performance
- [What is faster/lighter and by how much] ([task-id])
- ...

### 🔒 Security
- [What was patched — keep vague if sensitive] ([task-id])
- ...

### ⚠️ Breaking Changes
- [What changed and migration path] ([task-id])
- ...

### Known Issues
- [Issue from retro that is deferred] (tracked: [link or task-id])
```

Omit sections with no entries. Never add empty sections.

---

## Step 5 — Offer to tag release

```
Create git tag [version] for this release? (yes/no)
```

If yes:
```bash
git tag -a [version] -m "Release [version] — [sprint-id]"
```

---

## Output

```
✓ docs/CHANGELOG.md — [version] entry added

  Sections: [N] features / [N] fixes / [N] improvements
  Tasks covered: [task-id], [task-id], ...
  Git tag: [version] (tagged / skipped)

Next: publish CHANGELOG.md to your release platform
```
