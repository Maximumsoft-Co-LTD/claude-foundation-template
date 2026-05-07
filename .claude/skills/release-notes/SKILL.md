---
description: Generate CHANGELOG.md entry + sync README sections + bump semver at sprint close — no more forgotten release docs
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git log:*), Bash(git diff:*), Bash(git tag:*), Bash(git rev-parse:*), Bash(git describe:*), Bash(git add:*), Bash(git status:*), Bash(jq:*), Bash(node:*)
disable-model-invocation: false
---

# release-notes

Workflow position: **inside /retro-sprint, before sprint close → produces CHANGELOG entry, README updates, version bump**

Closes the "ลืมอัพเดท README + CHANGELOG หลังจบ sprint" loop. Runs once per sprint; output is a PR-ready commit, not a task to remember later.

Arguments: `[sprint-id]` — e.g. `SP3`

---

## When to invoke

Mandatory at end of every sprint (called from `/retro-sprint`).

Also invoke ad-hoc when:
- Cutting a hotfix release outside sprint cadence
- After a public-API change that ships before sprint close

Skip:
- Internal-only refactor sprint with zero user-visible change (state this explicitly in retro doc)

---

## Step 1 — Determine the diff range

```bash
# Find the previous release tag (if any)
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
RANGE="${LAST_TAG:+$LAST_TAG..}HEAD"
```

If no prior tag, range is the full history of this sprint's branches. Confirm with:

```bash
git log --oneline $RANGE
```

Sanity check: should include all `SP[N]-T[NNN]` commits for this sprint. If commits are missing → main isn't up to date or branches haven't merged. STOP, fix that first.

---

## Step 2 — Group commits by type

Parse commit messages — they follow `SP[N]-T[NNN] type: description` (per CLAUDE.md). Group by `type`:

| Type | CHANGELOG section | User-facing? |
|---|---|---|
| `feat` | **Added** | yes |
| `fix` | **Fixed** | yes |
| `refactor` | **Changed** (only if behavior-affecting) | maybe — judge per commit |
| `docs` | skip | no |
| `test` | skip | no |
| `chore` | skip | no |

For ambiguous `refactor` commits, check `git diff` of the commit:
- Touches public API surface (route, exported function, response shape) → include in **Changed**
- Internal only (rename private var, extract helper) → skip

---

## Step 3 — Decide the version bump

Use semver with this rule (Keep a Changelog convention):

| Change | Bump |
|---|---|
| Any **breaking** change (removed field, renamed route, incompatible behavior) | MAJOR |
| Any new `feat` and no breaking | MINOR |
| Only `fix` (no new features) | PATCH |
| Only docs/chore/test | no bump (skip release entirely) |

State the proposed bump and the **specific commit** that justifies it:

```
Proposed bump: 1.4.0 → 1.5.0 (MINOR)
Reason: feat commits SP3-T012 (export endpoint), SP3-T015 (new dashboard widget)
Breaking changes: none
```

---

## Step 4 — Draft CHANGELOG.md entry

Read existing `CHANGELOG.md` to match the style. If none exists, create one with [Keep a Changelog](https://keepachangelog.com) header.

Prepend new entry:

```markdown
## [1.5.0] - 2026-05-06

### Added
- Export endpoint for thing list — `POST /api/things/export` returns CSV (SP3-T012)
- Dashboard widget showing weekly thing count (SP3-T015)

### Changed
- `GET /api/things` now returns `createdAt` as ISO-8601 instead of unix ms (SP3-T018)

### Fixed
- Save button no longer double-submits on slow network (SP3-T020)
- Mongo query in `things.list` now uses index `{createdBy:1, createdAt:-1}` (SP3-T022)
```

Rules for entry text:
- One bullet per user-visible change, NOT one per commit
- Start with the user benefit, end with the task ID
- Don't expose internal class/function names
- Mark breaking changes with **BREAKING:** prefix
- Group multiple commits on the same feature into one bullet

---

## Step 5 — Sync README.md

Read current `README.md`. Diff against the new feature set. Update these sections if they exist:

| Section | Update if |
|---|---|
| Features list | new `feat` commit added something user-visible |
| Installation / Setup | new env var, new dependency, new required service |
| Usage / Quick start | API surface changed in a way that affects examples |
| API reference / Endpoints | new route, removed route, changed response |
| Architecture diagram | new service, new socket event family, new collection |
| Screenshots | UI changed materially |

Output a per-section verdict:

```
README.md sync:
  Features list:   UPDATE — add "CSV export"
  Setup:           UPDATE — new env MONGO_REPLICA_SET required for SP3-T015
  Usage:           OK — examples still valid
  API reference:   UPDATE — append POST /api/things/export, change GET /things createdAt format
  Architecture:    OK
  Screenshots:     UPDATE — dashboard.png needs reshoot (SP3-T015)
```

Make the edits. For screenshot updates that require manual capture, leave a `<!-- TODO: reshoot dashboard.png after SP3-T015 -->` and surface in output.

---

## Step 6 — Bump version files

Apply the bump from Step 3 to all version-bearing files. Search:

```bash
# Common locations
ls package.json go.mod pyproject.toml setup.py VERSION 2>/dev/null
```

Update each that exists:
- `package.json` → `"version": "1.5.0"`
- `pyproject.toml` → `version = "1.5.0"`
- `VERSION` → `1.5.0`
- `go.mod` — Go modules don't carry version; set the git tag instead (Step 8)

If multiple versions exist (monorepo), bump all that this sprint affected. Don't bump untouched packages.

---

## Step 7 — Self-check

Before declaring done, confirm:

| Check | Pass condition |
|---|---|
| CHANGELOG entries match commit log? | every `feat`/`fix` in range appears in entry |
| README features match CHANGELOG Added section? | yes |
| Version bump consistent across files? | all bumped or none |
| No leftover `<!-- TODO -->` in shipped sections? | TODOs only for follow-up actions, surfaced in output |
| Date matches today? | yes |
| Task IDs cite sprint-id correctly? | all `SP[N]-...` match current sprint |

---

## Step 8 — Stage, don't commit yet

This skill **prepares** the release; the user (or `/git-commit`) does the commit + tag.

Stage the changes:

```bash
git add CHANGELOG.md README.md package.json pyproject.toml VERSION 2>/dev/null
git status --short
```

Output a draft commit message:

```
SP3 docs: release notes v1.5.0

- CHANGELOG: 2 added, 1 changed, 2 fixed
- README: features, setup, API reference updated
- Version: 1.4.0 → 1.5.0
```

And a draft tag command (do NOT execute without user confirm):

```
git tag -a v1.5.0 -m "Release v1.5.0 — see CHANGELOG.md"
```

---

## Output

```
release-notes: [sprint-id] — v[old] → v[new]

CHANGELOG: +[N] entries  ([added] / [changed] / [fixed])
README:    [N] sections updated, [N] OK, [N] manual TODO
Version:   bumped in [N] files
Staged:    yes

Open TODOs (manual):
  - [reshoot dashboard.png after SP3-T015]

Next:
  Review the diff → /git-commit
  Then: git tag v[new] && git push --tags
```

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: present staged changelog + draft commit message + 2-option completion.
- **Autopilot mode**: emit status line. Tag creation + push are destructive ops and ALWAYS block for explicit yes/no, regardless of mode.

## Output (autopilot status line — required)

`> release-notes: v[old] → v[new], [N] entries  [✓]`

Example: `> release-notes: v1.4.0 → v1.5.0, 5 entries (2 added, 1 changed, 2 fixed)  ✓`

---

## Why this exists

Previous pain: "ต้องคอยอัพเดท README และ CHANGELOG.md หลังจบ sprint, ลืมทำ". Root cause: the work happens at the lowest-energy point of the sprint (right after exhausting deep work), with no structured prompt. This skill turns it into a deterministic, evidence-driven step that runs from `/retro-sprint` and produces a staged diff — there's nothing left to "remember to do later."
