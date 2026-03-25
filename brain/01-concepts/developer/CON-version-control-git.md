---
type: concept
tags: [developer, git, version-control, branching, workflow]
related: [CON-branch-commit-format, CON-code-review-checklist]
updated: 2026-03-25
---

# Version Control & Git Workflow

## Core Git Concepts

```
Working Directory → Staging Area → Local Repo → Remote Repo
     git add ↗           git commit ↗    git push ↗
                                        ← git pull/fetch
```

**Key commands:**
```bash
git status                    # what's changed
git diff                      # see changes
git add -p                    # interactive staging (selective)
git commit -m "type: msg"     # commit with conventional format
git log --oneline --graph     # visual branch history
git stash / git stash pop     # temporarily shelve changes
```

---

## Branching Strategies

### Trunk-Based Development (Recommended for CI/CD)
```
main (production-ready always)
├── feature/user-login     (< 2 days lifespan)
├── fix/payment-bug        (< 1 day lifespan)
└── (merge to main via PR, delete after merge)
```
- Small, short-lived branches
- Feature flags hide incomplete features
- CI runs on every push to main
- Best for: teams with strong test coverage, frequent deploys

### Gitflow (Classic, more complex)
```
main ─────────────────────────────── (production)
         ↑ merge release
release/1.2 ──────────── (stabilization)
         ↑ branch from develop
develop ──────────────────────────── (integration)
   ↑ feature branches merge here
feature/login ──── (1-2 week lifespan)
hotfix/crash ──── (branches from main, merges to main+develop)
```
- Heavier process
- Good for: multiple release versions, release-based teams

### This Project's Convention
```
Branch: SP[N]/SP[N]-T[NNN]-short-description
Example: SP2/SP2-T005-user-login
```

See: [[CON-branch-commit-format]]

---

## Merge Strategies

### Merge Commit
```
feature ─A─B─C─┐
main    ─────── M  ← merge commit (preserves history)
```
Pros: Full history visible, easy to revert
Cons: Messy history with many branches

### Squash and Merge
```
feature ─A─B─C─┐
main    ─────── S  ← single squashed commit
```
Pros: Clean linear history, one commit = one feature
Cons: Lose individual commit context

### Rebase and Merge
```
feature (rebased): main─A'─B'─C'
```
Pros: Clean linear history, individual commits preserved
Cons: Rewrites history (never rebase shared branches)

**Recommended:** Squash merge for feature branches (1 PR = 1 commit on main)

---

## PR (Pull Request) Best Practices

```
Before opening PR:
  ✅ Self-review your own diff
  ✅ All CI checks pass
  ✅ PR description explains WHY (not just what)
  ✅ Link to ticket/issue
  ✅ Screenshots for UI changes
  ✅ Size: < 300 lines changed (split if larger)

PR description template:
  ## What
  Brief description of the change

  ## Why
  The problem this solves / ticket link

  ## How
  Key technical decisions made

  ## Testing
  How to test this change
```

---

## Git Safety Rules

```
NEVER:
  ❌ Force push to main/master
  ❌ Rebase shared branches (others have checked out)
  ❌ Commit secrets/env files
  ❌ Use --no-verify to skip hooks
  ❌ Commit huge binary files

ALWAYS:
  ✅ .gitignore covers: .env, node_modules, build/, dist/
  ✅ Sensitive files in secrets manager, not git
  ✅ Review diff before push: git diff origin/main
```

---

## Common Git Operations

```bash
# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Discard all local changes
git checkout .

# See who changed a line
git blame file.ts

# Find commit that introduced a bug
git bisect start
git bisect bad          # current is broken
git bisect good v1.0    # this version was OK
# git binary-searches commits until finds culprit

# Apply a specific commit from another branch
git cherry-pick <commit-hash>

# Interactive rebase (clean up last 3 commits before PR)
git rebase -i HEAD~3
```

## Related

- [[CON-branch-commit-format]] — this project's naming conventions
- [[CON-code-review-checklist]] — PR review process
- [[../../00-MOC/MOC-Developer-Fundamentals]]
