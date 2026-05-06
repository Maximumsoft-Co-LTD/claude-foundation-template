---
description: Open a GitHub PR with structured title (≤70 chars), AC checklist body, design doc links, and test evidence — never "wip" or empty body
allowed-tools: Read, Grep, Glob, Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git push:*), Bash(git branch:*), Bash(git rev-parse:*), mcp__github__create_pull_request, mcp__github__list_pull_requests, mcp__github__get_me
disable-model-invocation: false
---

# pr-create

Workflow position: **invoked after /git-commit when user explicitly requests a PR — last action before review starts**

Produces a PR with enough context that a reviewer can decide approve / request changes without asking "what does this do?"

Arguments: `[task-id]` (single task PR) or `[sprint-id]` (sprint-end PR)

---

## When to invoke

- User says "create PR" / "open PR" / "ทำ PR" after a commit
- End of `/retro-task` if the team policy is "PR per task"
- End of `/retro-sprint` for the integration PR

Skip:
- User did NOT explicitly ask for a PR — never spontaneous
- Branch has no commits ahead of base
- Branch already has an open PR — UPDATE that one, don't open a duplicate

---

## Step 1 — Pre-flight checks (BLOCK on any fail)

Run sequentially, abort on first fail:

```bash
git rev-parse --abbrev-ref HEAD          # not main / master
git status --short                        # working tree clean
git log origin/main..HEAD --oneline       # has commits to PR
```

| Check | Fail action |
|---|---|
| On `main` or `master` | STOP — "switch to feature branch first" |
| Uncommitted changes | STOP — "commit or stash first; this skill PRs committed work only" |
| No commits ahead of main | STOP — "nothing to PR" |
| Existing open PR for this branch | List it, ask user via `ask-choice`: A) update existing  B) close + open new  C) abort |

---

## Step 2 — Verify the work is review-ready

| Gate | Check |
|---|---|
| Tests | run full suite — must be GREEN |
| Lint / typecheck | must be clean |
| `ui-verify` evidence exists (if UI work) | `docs/sprints/[sprint-id]/[task-id]/ui-verify/` non-empty |
| TDD plan exists (if requirement-driven) | section "TDD Test Plan" in requirement doc |
| Self-check on requirement doc | no `TBD` / `TODO` left |

If any gate fails → STOP and report which gate. Do NOT push a PR with red CI in advance.

---

## Step 3 — Push the branch

```bash
git push -u origin [branch-name]
```

If push fails due to network → retry with backoff: 2s, 4s, 8s, 16s (per repo's git policy).

If the branch already tracks remote and is behind → STOP, do NOT auto-rebase or force-push. Report and ask user.

---

## Step 4 — Compose the title

Format: `SP[N]-T[NNN] type: short description`

Rules:
- ≤ 70 characters total
- Type matches commit convention: `feat / fix / docs / refactor / chore / test`
- Description focused on WHY/WHAT user-visible — not "implement T012"

Examples:
- ✅ `SP3-T012 feat: CSV export for things list`
- ✅ `SP3-T020 fix: prevent double-submit on slow network`
- ❌ `update some files` (useless)
- ❌ `SP3-T012 feat: implement the export feature with full backend changes and frontend wiring including tests` (too long)

---

## Step 5 — Build the body

Template (every section required, omit only with `<!-- N/A: reason -->`):

```markdown
## Summary
[2–3 sentences. What this PR does and why. Reader should understand even without opening files.]

## Scope (linked task / requirement)
- Task: SP3-T012 — `docs/sprints/SP3/SP3-T012/SP3-T012-requirement.md`
- Discovery: `docs/discovery/disc-007-export.md` (if applicable)

## Acceptance Criteria
- [x] AC1 — User can request CSV export of own things
- [x] AC2 — Export includes only owner's records (authz)
- [x] AC3 — Empty list still produces valid CSV with header row
- [x] AC4 — Export over 10k rows uses streaming (no OOM)

## Changes
- BE: `internal/handlers/export.go` new `POST /api/things/export`
- BE: `internal/services/csv_writer.go` streaming CSV writer
- FE: `web/composables/useExport.ts` triggers download
- FE: `web/components/ExportButton.vue` UI
- DB: index `{createdBy:1, createdAt:-1}` added (migration 2026-05-06)

## Tests
- BE unit: 4 added (`export_handler_test.go`)
- BE integration: 2 added — DB seeded, real export
- FE component: 1 added — button states
- FE e2e: 1 added — full download flow
- All tests: GREEN locally — see `ui-verify/`

## ui-verify evidence
- `docs/sprints/SP3/SP3-T012/ui-verify/AC1-export-success.png`
- `docs/sprints/SP3/SP3-T012/ui-verify/AC4-large-dataset.png`

## Mongo review
- mongo-review: PASS (no CRITICAL/HIGH findings)
- New index: yes (see Changes)

## Breaking changes
- None  /  [BREAKING: list each]

## Deployment notes
- Run migration `2026-05-06-things-index.js` before deploy of this code
- New env var: `EXPORT_MAX_ROWS=10000` (defaults to 10k)

## Reviewer focus areas
- `csv_writer.go` streaming logic — please confirm no buffered allocation grows with N
- `useExport.ts` error path on 504 timeout — does it surface clearly?

## Out of scope (intentionally not in this PR)
- Scheduled exports (separate task SP4-T...)
- XLSX format (only CSV in this PR)
```

For sprint-end integration PRs, replace the per-task sections with a list of included tasks and link each.

---

## Step 6 — Determine base branch

| Project policy | Base |
|---|---|
| Trunk-based | `main` |
| Release branch flow | `develop` or `release/*` |
| GitHub Flow | `main` |

Read repo's CONTRIBUTING.md or .github/PULL_REQUEST_TEMPLATE.md if exists. If unclear → ask via `ask-choice`.

---

## Step 7 — Create the PR

Use `mcp__github__create_pull_request`. NEVER use `gh` CLI — this harness routes GitHub through MCP.

```
mcp__github__create_pull_request(
  owner: <repo owner>,
  repo: <repo name>,
  title: <Step 4 title>,
  body: <Step 5 body>,
  head: <feature branch>,
  base: <Step 6 base>,
  draft: false  # or true if explicitly requested
)
```

Capture the returned PR URL.

---

## Step 8 — Subscribe to PR activity (offer)

Ask the user via `ask-choice`:

```
PR opened. Subscribe to activity?
A) Yes — auto-respond to review comments / CI failures
B) No — manual checks only
C) Yes but draft mode — observe only, don't auto-fix
```

If A → call `mcp__github__subscribe_pr_activity` for the PR.

---

## Step 9 — Output

```
pr-create: [task-id or sprint-id]
URL: [PR URL]
Title: [title]
Base ← Head: [base] ← [branch]
Draft: yes / no
Subscribed: yes / no

Next:
  Wait for review (subscribed → auto-handle activity)
  Or: /next-task
```

---

## Anti-patterns

- ❌ "wip" or "test" PR title — useless to reviewers
- ❌ Empty body — wastes reviewer time asking for context
- ❌ Force-push to update existing PR — push normally; force only if requested
- ❌ Auto-merge without explicit user request
- ❌ Skipping ui-verify evidence link when UI changed
- ❌ PR that includes 2 tasks — split per parallel-work.md (one task per branch)

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: pre-flight + push + open PR + ask-choice for subscribe.
- **Autopilot mode**: invoked only if user intent contained "open PR" / "ทำ pr". `git push` and PR creation are destructive ops — ALWAYS block for yes/no before executing, regardless of mode.

## Output (autopilot status line — required)

`> pr-create: [URL]  [✓]` or `> pr-create: BLOCKED [reason]  [✗]`

Example: `> pr-create: https://github.com/org/repo/pull/47  ✓`

---

## Why this exists

A PR with a complete body is reviewed in 10 minutes. A PR with "see commits" takes 40 minutes and 3 round-trips of "what is this?" — and the reviewer is more likely to approve without really understanding. The structured body forces the author to articulate what changed, what's tested, and what's risky — which is half the review work already done.
