---
description: Audit outdated and vulnerable dependencies, generate a safe upgrade plan with test verification
allowed-tools: Read, Write, Bash(npm *), Bash(go list *), Bash(pip list *), Bash(bundle outdated *)
disable-model-invocation: false
---

# /dependency-update
Workflow position: **pre-sprint maintenance → START → /git-commit**

Proactively audit all dependencies for outdated versions and known vulnerabilities, then generate a safe, incremental upgrade plan. Different from `/security-review` (which is reactive per-task) — this is the proactive, full-project sweep.

Arguments: `[scope]` — `all` (default) · `security-only` · `major` · `minor`

---

## Step 1 — Audit current state

Run the appropriate audit command for each detected package manager:

**Node.js:**
```bash
npm outdated --json    # all outdated packages
npm audit --json       # known CVEs
```

**Go:**
```bash
go list -m -u all      # outdated modules
govulncheck ./...      # known vulnerabilities (if installed)
```

**Python:**
```bash
pip list --outdated --format=json
pip-audit --format=json    # if installed
```

**Ruby:**
```bash
bundle outdated
bundle exec bundler-audit check --update
```

---

## Step 2 — Classify packages

For each outdated package, classify:

| Category | Criteria | Action |
|----------|---------|--------|
| **Security patch** | CVE present, patch available | Upgrade immediately |
| **Minor/patch** | No breaking changes (semver) | Safe to upgrade in batch |
| **Major** | Breaking changes possible | Upgrade individually with testing |
| **Dev-only** | Only affects build/test tools | Lower risk, upgrade in batch |
| **Pinned** | Intentionally fixed version | Skip — check comment in lockfile |

---

## Step 3 — Check breaking changes

For each **major version bump**:
1. **Fetch migration docs via context7 (if available):**
   - `mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs` with query: "migration guide from [old version] to [new version], breaking changes".
   - Use returned docs as the primary source of breaking changes — more reliable than reading CHANGELOG manually.
   - If context7 is not available, read the package's CHANGELOG or GitHub releases for the version range.
2. List breaking changes that could affect this codebase.
3. Search codebase for usage of changed APIs: `grep -rn "[package-name]" src/`
4. Estimate impact: `none` · `low` · `medium` · `high`

Skip packages with `high` impact — document them as "manual upgrade required" with the specific breaking change.

---

## Step 4 — Generate upgrade plan

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dependency Audit: [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total outdated: [N]  |  CVEs: [N] critical / [N] high / [N] low

Batch 1 — Security (do now):
  ↑ [package] [old] → [new]  ⚠ CVE-XXXX-YYYY: [description]

Batch 2 — Safe minor/patch (batch upgrade):
  ↑ [package] [old] → [new]
  ↑ [package] [old] → [new]

Batch 3 — Major (upgrade individually):
  ↑ [package] [old] → [new]  Breaking: [what changed]

Skip (manual review needed):
  ~ [package] [old] → [new]  Breaking: [too complex — see notes]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Show plan and ask: "Apply Batch 1 and Batch 2? (yes/no)"

---

## Step 5 — Apply upgrades

**Batch 1 + 2 (security + safe):**
```bash
npm update [pkg1] [pkg2] ...     # Node
go get [module]@latest           # Go
pip install --upgrade [pkg1] ... # Python
```

Run full test suite after batch. If tests pass → continue to Batch 3.

**Batch 3 (major — one at a time):**
- Upgrade one package.
- Run tests.
- If green → stage, continue to next.
- If red → debug (see `/debug`) or revert and document.

---

## Step 6 — Commit

Stage only dependency files:
- `package.json`, `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`
- `go.mod`, `go.sum`
- `requirements.txt`, `Pipfile.lock`
- `Gemfile`, `Gemfile.lock`

Commit message: `chore: update dependencies — [N] security, [N] minor, [N] major`

---

## Output

```
✓ Upgraded: [N] packages
  Security: [N]  |  Minor/patch: [N]  |  Major: [N]
  Skipped (manual): [N]

Tests: [N] passing after upgrade

Next:
  Manual upgrades remain → create task in BACKLOG.md per package
  All clear → /git-commit
```
